import { redirect } from "next/navigation";
import { DealSubmissionForm } from "@/components/deals/deal-submission-form";
import { getLiveRound } from "@/lib/deals";
import { env, paymentsActive } from "@/lib/env";

export const metadata = { title: "Enter your company" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  if (!paymentsActive) {
    return (
      <section className="join-page">
          <header className="join-heading">
            <span className="eyebrow">Company entry / standby</span>
            <h1>Doors open<br />shortly.</h1>
            <p>Company entries are paused while secure checkout activation is completed. No inventory or payment details are being accepted yet.</p>
          </header>
          <div className="empty-board">
            <span className="eyebrow">Payments not active</span>
            <h3>Your offer stays with you until checkout is ready.</h3>
            <p>DealWar will open submissions only after payment processing, refunds, and webhook verification are fully active.</p>
          </div>
      </section>
    );
  }
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
