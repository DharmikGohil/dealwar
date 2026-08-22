import { redirect } from "next/navigation";
import { DealSubmissionForm } from "@/components/deals/deal-submission-form";
import { getLiveRound } from "@/lib/deals";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Enter your company" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  await requireUser();
  const round = await getLiveRound();
  if (!round) redirect("/?entry=closed");
  return (
    <section className="join-page">
      <header className="join-heading">
        <span className="eyebrow">Company entry / {round.name}</span>
        <h1>Put real value<br />on the table.</h1>
        <p>Your fee covers verification and operations. It never changes rank. Only verified customer credit moves the board.</p>
      </header>
      <DealSubmissionForm
        roundId={round.id}
        roundName={round.name}
        minimumFeeCents={env.DEAL_ENTRY_FEE_CENTS}
      />
    </section>
  );
}
