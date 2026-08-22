import "server-only";
import { db } from "@/lib/db";

type LifecycleResult = {
  at: Date;
  endedDeals: number;
  endedRounds: number;
  startedRounds: number;
  startedDeals: number;
};

let recentRun: { startedAt: number; promise: Promise<LifecycleResult> } | null =
  null;

export function reconcileLifecycle(
  requestId = "request-driven",
  force = false,
) {
  const startedAt = Date.now();
  if (!force && recentRun && startedAt - recentRun.startedAt < 15_000)
    return recentRun.promise;

  const promise = (async () => {
    const at = new Date(startedAt);
    // Each transition is idempotent and guarded by its previous status. Keeping
    // these as short standalone statements avoids holding an interactive
    // transaction open across a shared pooler during a cold start. If a process
    // stops between statements, the next reconciliation safely resumes.
    const endedDeals = await db.deal.updateMany({
      where: {
        status: { in: ["LIVE", "SCHEDULED", "PAUSED"] },
        round: { endsAt: { lte: at } },
      },
      data: { status: "ENDED", endsAt: at },
    });
    const endedRounds = await db.round.updateMany({
      where: { status: { in: ["LIVE", "SCHEDULED"] }, endsAt: { lte: at } },
      data: { status: "ENDED" },
    });
    const startedRounds = await db.round.updateMany({
      where: { status: "SCHEDULED", startsAt: { lte: at }, endsAt: { gt: at } },
      data: { status: "LIVE" },
    });
    const startedDeals = await db.deal.updateMany({
      where: {
        status: "SCHEDULED",
        round: { status: "LIVE", startsAt: { lte: at }, endsAt: { gt: at } },
      },
      data: { status: "LIVE", liveAt: at },
    });
    if (
      endedDeals.count ||
      endedRounds.count ||
      startedRounds.count ||
      startedDeals.count
    ) {
      await db.auditLog.create({
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
  })();

  recentRun = { startedAt, promise };
  void promise.catch(() => {
    if (recentRun?.promise === promise) recentRun = null;
  });
  return promise;
}
