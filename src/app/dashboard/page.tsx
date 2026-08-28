import Link from "next/link";
import { ArrowRight, Plus, ShieldAlert, TicketCheck } from "lucide-react";
import { ControlRoomShell } from "@/components/dashboard/control-room-shell";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Control room" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [memberships, claims] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      include: { organization: { include: { products: { include: { deals: { include: { round: true } } } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.claim.findMany({
      where: { userId: user.id },
      include: { deal: { include: { product: true } }, couponCode: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const deals = memberships.flatMap((membership) => membership.organization.products.flatMap((product) => product.deals.map((deal) => ({ ...deal, product, organization: membership.organization }))));
  return (
    <ControlRoomShell user={user} active="overview">
      <section className="dashboard-content">
        <header><div><span className="eyebrow">Your activity</span><h2>Fight status.</h2></div><ButtonLink href="/join" variant="dark"><Plus size={16} /> New entry</ButtonLink></header>
        <div className="dashboard-stats"><div><span>Companies</span><strong>{memberships.length}</strong></div><div><span>Total entries</span><strong>{deals.length}</strong></div><div><span>Credits claimed</span><strong>{claims.length}</strong></div></div>
        <section className="dashboard-section" id="company-entries">
          <div className="dashboard-section-title"><h3>Company entries</h3><span>{deals.length} total</span></div>
          {deals.length ? <div className="dashboard-list">{deals.map((deal) => <Link href={`/dashboard/deals/${deal.id}`} key={deal.id} className="dashboard-row"><div className={`status-swatch status-${deal.status.toLowerCase()}`} /><div><strong>{deal.product.name}</strong><span>{deal.round.name}</span></div><div><span>pool</span><strong>{formatMoney(deal.scoreCents)}</strong></div><div><span>status</span><strong>{deal.status.replaceAll("_", " ")}</strong></div><ArrowRight size={18} /></Link>)}</div> : <div className="dashboard-empty"><ShieldAlert size={30} /><h4>No company is in the ring yet.</h4><p>Create the first verified offer pool.</p><ButtonLink href="/join">Enter a company</ButtonLink></div>}
        </section>
        <section className="dashboard-section">
          <div className="dashboard-section-title"><h3>Recent claims</h3><span>{claims.length} shown</span></div>
          {claims.length ? <div className="dashboard-list">{claims.map((claim) => <Link href={`/deals/${claim.deal.slug}`} key={claim.id} className="dashboard-row claim-row"><TicketCheck size={20} /><div><strong>{claim.deal.product.name}</strong><span>{claim.deal.headline}</span></div><div><span>credit</span><strong>{formatMoney(claim.deal.creditAmountCents)}</strong></div><div><span>claimed</span><strong>{claim.createdAt.toLocaleDateString("en-US")}</strong></div><ArrowRight size={18} /></Link>)}</div> : <div className="dashboard-empty compact"><p>You haven’t claimed a deal yet.</p><ButtonLink href="/#board" variant="secondary">Browse live board</ButtonLink></div>}
        </section>
      </section>
    </ControlRoomShell>
  );
}
