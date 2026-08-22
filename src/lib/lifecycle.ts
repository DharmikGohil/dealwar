import "server-only";
import { db } from "@/lib/db";

type LifecycleResult = {
  at: Date;
  endedDeals: number;
  endedRounds: number;
  startedRounds: number;
  startedDeals: number;
};

let recentRun: { startedAt: number; promise: Promise<LifecycleResult> } | null = null;

export function reconcileLifecycle(requestId = "request-driven", force = false) {
  const startedAt = Date.now();
  if (!force && recentRun && startedAt - recentRun.startedAt < 15_000) return recentRun.promise;

  const promise = db.$transaction(async (tx) => {
    const at = new Date(startedAt);
    const endedDeals = await tx.deal.updateMany({
      where: { status: { in: ["LIVE", "SCHEDULED", "PAUSED"] }, round: { endsAt: { lte: at } } },
      data: { status: "ENDED", endsAt: at },
    });
    const endedRounds = await tx.round.updateMany({
      where: { status: { in: ["LIVE", "SCHEDULED"] }, endsAt: { lte: at } },
      data: { status: "ENDED" },
    });
    const startedRounds = await tx.round.updateMany({
      where: { status: "SCHEDULED", startsAt: { lte: at }, endsAt: { gt: at } },
      data: { status: "LIVE" },
    });
    const startedDeals = await tx.deal.updateMany({
      where: { status: "SCHEDULED", round: { status: "LIVE", startsAt: { lte: at }, endsAt: { gt: at } } },
      data: { status: "LIVE", liveAt: at },
    });
    if (endedDeals.count || endedRounds.count || startedRounds.count || startedDeals.count) {
      await tx.auditLog.create({
        data: {
          action: "round.lifecycle_tick",
          targetType: "System",
          targetId: "round-lifecycle",
          requestId,
          metadata: {
            endedDeals: endedDeals.count,
            endedRounds: endedRounds.count,
            startedRounds: startedRounds.count,
            startedDeals: startedDeals.count,
          },
        },
      });
    }
    return {
      at,
      endedDeals: endedDeals.count,
      endedRounds: endedRounds.count,
      startedRounds: startedRounds.count,
      startedDeals: startedDeals.count,
    };
  });

  recentRun = { startedAt, promise };
  void promise.catch(() => {
    if (recentRun?.promise === promise) recentRun = null;
  });
  return promise;
}
