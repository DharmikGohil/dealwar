import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allocateClaim } from "@/lib/claim-allocation";
import { db } from "@/lib/db";
import { couponHash, decryptCoupon, encryptCoupon } from "@/lib/security";

const suffix = crypto.randomUUID().slice(0, 8);
const slug = `concurrency-${suffix}`;
let dealId = "";
let productId = "";
let organizationId = "";
let roundId = "";
const userIds: string[] = [];

describe("claim allocation concurrency", () => {
  beforeAll(async () => {
    const users = await Promise.all(Array.from({ length: 4 }, (_, index) => db.user.create({ data: { name: `Claim Test ${index}`, email: `claim-${suffix}-${index}@example.com`, emailVerified: true } })));
    const owner = users[0];
    if (!owner) throw new Error("Test owner was not created.");
    userIds.push(...users.map((user) => user.id));
    const organization = await db.organization.create({ data: { name: "Concurrency Test", slug: `org-${suffix}`, website: "https://example.com", billingEmail: owner.email, createdById: owner.id, verifiedAt: new Date() } });
    organizationId = organization.id;
    const product = await db.product.create({ data: { organizationId, slug: `product-${suffix}`, name: "Concurrency Product", tagline: "A test product for concurrent claim allocation.", description: "A deliberately temporary integration-test product used to prove that simultaneous claims receive unique inventory.", websiteUrl: "https://example.com", status: "ACTIVE" } });
    productId = product.id;
    const round = await db.round.create({ data: { slug: `round-${suffix}`, name: "Concurrency Round", strapline: "Integration test", startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 3_600_000), status: "LIVE" } });
    roundId = round.id;
    const codes = Array.from({ length: 5 }, (_, index) => `CONCURRENT-${suffix}-${index}`);
    const deal = await db.deal.create({ data: { productId, roundId, slug, headline: "Concurrent test credit", terms: "Integration test inventory. Not a public offer.", redemptionUrl: "https://example.com/redeem", creditAmountCents: 500, inventoryCount: codes.length, availableCount: codes.length, scoreCents: BigInt(500 * codes.length), entryFeeCents: 1900, status: "LIVE", liveAt: new Date(), endsAt: round.endsAt, coupons: { create: codes.map((code) => ({ codeHash: couponHash(code), ...encryptCoupon(code) })) } } });
    dealId = deal.id;
  });

  afterAll(async () => {
    if (dealId) await db.auditLog.deleteMany({ where: { targetId: dealId } });
    if (dealId) await db.claim.deleteMany({ where: { dealId } });
    if (dealId) await db.couponCode.deleteMany({ where: { dealId } });
    if (dealId) await db.deal.delete({ where: { id: dealId } }).catch(() => undefined);
    if (productId) await db.product.delete({ where: { id: productId } }).catch(() => undefined);
    if (organizationId) await db.organization.delete({ where: { id: organizationId } }).catch(() => undefined);
    if (roundId) await db.round.delete({ where: { id: roundId } }).catch(() => undefined);
    if (userIds.length) await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });

  it("allocates distinct inventory and replays a prior user claim", async () => {
    const allocations = await Promise.all(userIds.map((userId, index) => allocateClaim({ slug, userId, email: `claim-${suffix}-${index}@example.com`, idempotencyKey: `claim-${suffix}-${index}`, requestId: `request-${index}`, ipHash: `ip-${index}`, userAgentHash: `ua-${index}` })));
    const revealed = allocations.map((allocation) => decryptCoupon(allocation.coupon));
    expect(new Set(revealed).size).toBe(4);
    const replay = await allocateClaim({ slug, userId: userIds[0]!, email: `claim-${suffix}-0@example.com`, idempotencyKey: `claim-${suffix}-replay`, requestId: "request-replay", ipHash: "ip-0", userAgentHash: "ua-0" });
    expect(replay.repeated).toBe(true);
    expect(replay.claim.id).toBe(allocations[0]!.claim.id);
    const state = await db.deal.findUniqueOrThrow({ where: { id: dealId }, include: { coupons: true, claims: true } });
    expect(state.claimedCount).toBe(4);
    expect(state.availableCount).toBe(1);
    expect(state.claims).toHaveLength(4);
    expect(state.coupons.filter((coupon) => coupon.status === "CLAIMED")).toHaveLength(4);
  });
});
