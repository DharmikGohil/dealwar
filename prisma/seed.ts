import "dotenv/config";
import { createCipheriv, createHmac, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const encryptionKey = process.env.COUPON_ENCRYPTION_KEY;
const hashSecret = process.env.ABUSE_HASH_SECRET;
if (!databaseUrl || !encryptionKey || !hashSecret) throw new Error("Seed environment is incomplete.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const couponKey = Buffer.from(encryptionKey, "hex");
const couponHash = (code: string) => createHmac("sha256", hashSecret).update("coupon\0").update(code.trim().toLowerCase()).digest("hex");
const encryptCoupon = (code: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", couponKey, iv);
  const encryptedCode = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]).toString("base64url");
  return { encryptedCode, encryptionIv: iv.toString("base64url"), encryptionTag: cipher.getAuthTag().toString("base64url") };
};

const samples = [
  {
    name: "Northstar AI",
    tagline: "A research workspace that turns source material into decision-ready briefs.",
    description: "Northstar gathers source material, preserves citations, and helps teams produce rigorous research briefs without losing the trail back to the evidence.",
    headline: "Get $50 in research credits",
    credit: 50,
    inventory: 100,
    claimed: 28,
    color: "#D7FF3F",
    website: "https://example.com/northstar",
  },
  {
    name: "Parcel",
    tagline: "Customer operations for small internet businesses that hate ticket queues.",
    description: "Parcel combines customer context, lightweight automation, and a shared team inbox for small product companies that want support to feel personal.",
    headline: "Take $30 off your first three months",
    credit: 30,
    inventory: 120,
    claimed: 41,
    color: "#FF4F1F",
    website: "https://example.com/parcel",
  },
  {
    name: "Switchboard",
    tagline: "Deploy and observe background jobs without managing another platform.",
    description: "Switchboard gives engineering teams durable jobs, retries, schedules, and production traces through one small SDK and a focused operations console.",
    headline: "Ship with $25 of infrastructure credit",
    credit: 25,
    inventory: 100,
    claimed: 19,
    color: "#3157FF",
    website: "https://example.com/switchboard",
  },
  {
    name: "Outline Studio",
    tagline: "A deliberate writing room for product narratives and launch pages.",
    description: "Outline Studio helps teams structure product arguments, challenge weak claims, and turn the final narrative into a launch-ready page without template sludge.",
    headline: "Get $40 toward any annual workspace",
    credit: 40,
    inventory: 50,
    claimed: 11,
    color: "#FFB6D9",
    website: "https://example.com/outline",
  },
  {
    name: "Ledgerly",
    tagline: "Calm cash-flow forecasting for bootstrapped companies.",
    description: "Ledgerly connects revenue and expenses into a plain cash runway model made for operators who need answers without becoming finance specialists.",
    headline: "Claim $15 in forecasting credit",
    credit: 15,
    inventory: 100,
    claimed: 7,
    color: "#8DE0D0",
    website: "https://example.com/ledgerly",
  },
];

async function main() {
  const email = "admin@dealwar.local";
  const admin = await db.user.upsert({
    where: { email },
    create: { name: "DealWar Operator", email, role: "ADMIN", emailVerified: true },
    update: { role: "ADMIN", emailVerified: true },
  });

  const startsAt = new Date();
  startsAt.setUTCHours(0, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 7 * 86_400_000);
  const round = await db.round.upsert({
    where: { slug: "opening-bell" },
    create: { slug: "opening-bell", name: "The Opening Bell", strapline: "The first verified credit fight.", startsAt, endsAt, status: "LIVE" },
    update: { startsAt, endsAt, status: "LIVE" },
  });

  for (const [index, sample] of samples.entries()) {
    const orgSlug = `sample-${sample.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
    const organization = await db.organization.upsert({
      where: { slug: orgSlug },
      create: { name: sample.name, slug: orgSlug, website: sample.website, billingEmail: email, createdById: admin.id, verifiedAt: new Date(), verificationMethod: "MANUAL", memberships: { create: { userId: admin.id, role: "OWNER" } } },
      update: { verifiedAt: new Date() },
    });
    const productSlug = sample.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
    const product = await db.product.upsert({
      where: { slug: productSlug },
      create: { organizationId: organization.id, slug: productSlug, name: sample.name, tagline: sample.tagline, description: sample.description, websiteUrl: sample.website, accentColor: sample.color, status: "ACTIVE" },
      update: { tagline: sample.tagline, description: sample.description, accentColor: sample.color, status: "ACTIVE" },
    });
    const dealSlug = `${productSlug}-opening-bell`;
    const deal = await db.deal.upsert({
      where: { slug: dealSlug },
      create: { productId: product.id, roundId: round.id, slug: dealSlug, headline: sample.headline, terms: "New customers only. One claim per person. Apply the unique code at checkout before this round ends. Credit cannot be exchanged for cash.", redemptionUrl: sample.website, creditAmountCents: sample.credit * 100, inventoryCount: sample.inventory, availableCount: sample.inventory - sample.claimed, claimedCount: sample.claimed, scoreCents: BigInt(sample.credit * 100 * sample.inventory), entryFeeCents: Math.max(1900, sample.credit * sample.inventory * 2), status: "LIVE", liveAt: new Date(Date.now() - (samples.length - index) * 3600_000), endsAt, reviewedAt: new Date() },
      update: { status: "LIVE", endsAt, headline: sample.headline },
    });
    const existingCoupons = await db.couponCode.count({ where: { dealId: deal.id } });
    if (existingCoupons === 0) {
      await db.couponCode.createMany({
        data: Array.from({ length: sample.inventory }, (_, codeIndex) => {
          const code = `${productSlug.slice(0, 4).toUpperCase()}-${String(codeIndex + 1).padStart(4, "0")}-DW`;
          return { dealId: deal.id, codeHash: couponHash(code), ...encryptCoupon(code), status: codeIndex < sample.claimed ? "VOID" as const : "AVAILABLE" as const };
        }),
      });
    }
    await db.payment.upsert({
      where: { providerSessionId: `seed-${deal.id}` },
      create: { dealId: deal.id, providerSessionId: `seed-${deal.id}`, amountCents: deal.entryFeeCents, status: "SUCCEEDED", paidAt: new Date() },
      update: { status: "SUCCEEDED" },
    });
  }
}

main()
  .then(async () => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
