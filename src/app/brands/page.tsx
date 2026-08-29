import { ArrowRight, BadgeDollarSign, Check, ShieldCheck, Swords, TicketCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getLeaderboard } from "@/lib/deals";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "For brands",
  description: "Enter Brand Arena and compete by giving customers more verified value.",
};
export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const [{ round }, user] = await Promise.all([getLeaderboard(), getCurrentUser()]);
  const startHref = user
    ? "/brand/entries/new"
    : `/sign-in?intent=brand&next=${encodeURIComponent("/brand/entries/new")}`;

  return (
    <>
      <section className="brands-hero">
        <div>
          <span className="eyebrow"><Swords size={15} /> For brands / Contenders</span>
          <h1>Don’t buy attention.<br /><em>Earn the position.</em></h1>
          <p>Publish a real customer credit pool. DealWar verifies your company, inventory and payment, then ranks the strongest live offers by value—not ad spend.</p>
          <div className="hero-actions"><ButtonLink href={startHref} variant="dark">Create your entry <ArrowRight size={17} /></ButtonLink><ButtonLink href="/#board" variant="secondary">See the live board</ButtonLink></div>
        </div>
        <aside>
          <span>Active competition</span><strong>{round?.name ?? "Opening round"}</strong><p>{round ? "Accepting verified entries now." : "The first round is being prepared."}</p>
          <ul><li><Check /> Fixed-dollar customer credits</li><li><Check /> Unique encrypted coupon inventory</li><li><Check /> Human moderation before publication</li></ul>
        </aside>
      </section>
      <section className="brand-process">
        <header><span className="eyebrow">From company to contender</span><h2>Four gates. One honest ranking.</h2></header>
        <div><article><b>01</b><BadgeDollarSign /><h3>Build the offer</h3><p>Choose a fixed credit amount and load one unique code per customer.</p></article><article><b>02</b><ShieldCheck /><h3>Prove company control</h3><p>Verify the company domain with one DNS record.</p></article><article><b>03</b><TicketCheck /><h3>Pay the entry fee</h3><p>Fees begin at {formatMoney(env.DEAL_ENTRY_FEE_CENTS)} and never change rank.</p></article><article><b>04</b><Swords /><h3>Enter the board</h3><p>After human review, your verified customer pool determines position.</p></article></div>
      </section>
      <section className="brand-final-cta"><div><span className="eyebrow">Ready to contend?</span><h2>Put something real on the table.</h2><p>One account manages every company, entry, verification and receipt.</p></div><ButtonLink href={startHref} variant="dark">Enter Brand Arena <ArrowRight size={17} /></ButtonLink></section>
    </>
  );
}
