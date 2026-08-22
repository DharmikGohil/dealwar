import "server-only";
import { db } from "@/lib/db";
import { reconcileLifecycle } from "@/lib/lifecycle";

export type PublicDeal = {
  id: string;
  slug: string;
  rank: number;
  headline: string;
  creditAmountCents: number;
  inventoryCount: number;
  availableCount: number;
  claimedCount: number;
  scoreCents: number;
  currency: string;
  endsAt: Date | null;
  product: {
    name: string;
    slug: string;
    tagline: string;
    websiteUrl: string;
    logoUrl: string | null;
    accentColor: string;
  };
};

export async function getLiveRound() {
  await reconcileLifecycle();
  const now = new Date();
  return db.round.findFirst({
    where: {
      status: "LIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function getLeaderboard(limit = 50): Promise<{
  round: Awaited<ReturnType<typeof getLiveRound>>;
  deals: PublicDeal[];
}> {
  const round = await getLiveRound();
  if (!round) return { round: null, deals: [] };

  const deals = await db.deal.findMany({
    where: {
      roundId: round.id,
      status: "LIVE",
      availableCount: { gt: 0 },
    },
    orderBy: [{ scoreCents: "desc" }, { liveAt: "asc" }],
    take: Math.min(limit, 100),
    select: {
      id: true,
      slug: true,
      headline: true,
      creditAmountCents: true,
      inventoryCount: true,
      availableCount: true,
      claimedCount: true,
      scoreCents: true,
      currency: true,
      endsAt: true,
      product: {
        select: {
          name: true,
          slug: true,
          tagline: true,
          websiteUrl: true,
          logoUrl: true,
          accentColor: true,
        },
      },
    },
  });

  return {
    round,
    deals: deals.map((deal, index) => ({
      ...deal,
      rank: index + 1,
      scoreCents: Number(deal.scoreCents),
    })),
  };
}

export async function getPublicStats() {
  await reconcileLifecycle();
  const [liveDeals, claims, aggregate] = await Promise.all([
    db.deal.count({ where: { status: "LIVE" } }),
    db.claim.count({ where: { status: { in: ["DELIVERED", "REDEEMED"] } } }),
    db.deal.aggregate({
      where: { status: "LIVE" },
      _sum: { scoreCents: true },
    }),
  ]);
  return {
    liveDeals,
    claims,
    liveValueCents: Number(aggregate._sum.scoreCents ?? 0n),
  };
}

export async function getDealBySlug(slug: string) {
  await reconcileLifecycle();
  return db.deal.findUnique({
    where: { slug },
    include: {
      product: { include: { organization: true } },
      round: true,
      _count: { select: { clicks: true, claims: true } },
    },
  });
}
