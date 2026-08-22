import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { keyedHash } from "@/lib/security";

type LockedCoupon = {
  id: string;
  encryptedCode: string;
  encryptionIv: string;
  encryptionTag: string;
};

type AllocationInput = {
  slug: string;
  userId: string;
  email: string;
  idempotencyKey: string;
  requestId: string;
  ipHash: string;
  userAgentHash: string;
};

async function replayExisting(input: AllocationInput) {
  const byKey = await db.claim.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { couponCode: true, deal: { include: { product: { select: { name: true } } } } },
  });
  if (byKey && byKey.userId !== input.userId) {
    throw new ApiError(409, "That idempotency key has already been used.", "idempotency_conflict");
  }
  const existing = byKey ?? await db.claim.findFirst({
    where: { userId: input.userId, deal: { slug: input.slug } },
    include: { couponCode: true, deal: { include: { product: { select: { name: true } } } } },
  });
  if (!existing) return null;
  return {
    claim: existing,
    coupon: existing.couponCode,
    redemptionUrl: existing.deal.redemptionUrl,
    productName: existing.deal.product.name,
    headline: existing.deal.headline,
    repeated: true,
  };
}

export async function allocateClaim(input: AllocationInput) {
  const replay = await replayExisting(input);
  if (replay) return replay;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        // All writers acquire the deal lock before coupon rows. This deterministic
        // lock order prevents counter drift and avoids serializable write-conflict storms.
        const lockedDeals = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id FROM "Deal" WHERE slug = ${input.slug} FOR UPDATE
        `);
        if (!lockedDeals[0]) throw new ApiError(409, "This deal is not currently claimable.", "deal_unavailable");
        const deal = await tx.deal.findUnique({
          where: { slug: input.slug },
          include: { product: { select: { name: true } } },
        });
        if (!deal || deal.status !== "LIVE" || deal.availableCount < 1) {
          throw new ApiError(409, "This deal is not currently claimable.", "deal_unavailable");
        }
        if (deal.endsAt && deal.endsAt <= new Date()) {
          throw new ApiError(409, "This deal has ended.", "deal_ended");
        }
        const priorClaim = await tx.claim.findUnique({
          where: { dealId_userId: { dealId: deal.id, userId: input.userId } },
          include: { couponCode: true },
        });
        if (priorClaim) {
          return {
            claim: priorClaim,
            coupon: priorClaim.couponCode,
            redemptionUrl: deal.redemptionUrl,
            productName: deal.product.name,
            headline: deal.headline,
            repeated: true,
          };
        }

        const coupons = await tx.$queryRaw<LockedCoupon[]>(Prisma.sql`
          SELECT id, "encryptedCode", "encryptionIv", "encryptionTag"
          FROM "CouponCode"
          WHERE "dealId" = ${deal.id} AND status = 'AVAILABLE'::"CouponStatus"
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `);
        const coupon = coupons[0];
        if (!coupon) throw new ApiError(409, "All codes were just claimed.", "inventory_exhausted");
        const claim = await tx.claim.create({
          data: {
            dealId: deal.id,
            couponCodeId: coupon.id,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            emailHash: keyedHash("email", input.email),
            ipHash: input.ipHash,
            userAgentHash: input.userAgentHash,
            status: "DELIVERED",
            deliveredAt: new Date(),
          },
        });
        await tx.couponCode.update({ where: { id: coupon.id }, data: { status: "CLAIMED", claimedAt: new Date() } });
        await tx.deal.update({ where: { id: deal.id }, data: { availableCount: { decrement: 1 }, claimedCount: { increment: 1 } } });
        await tx.auditLog.create({
          data: { actorId: input.userId, action: "deal.claimed", targetType: "Deal", targetId: deal.id, requestId: input.requestId, ipHash: input.ipHash },
        });
        return { claim, coupon, redemptionUrl: deal.redemptionUrl, productName: deal.product.name, headline: deal.headline, repeated: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await replayExisting(input);
        if (winner) return winner;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new ApiError(503, "Claim traffic is unusually high. Try once more.", "claim_busy");
}
