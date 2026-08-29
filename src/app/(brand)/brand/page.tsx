import Link from "next/link";
import { ArrowRight, CircleDollarSign, Plus, ShieldCheck, Swords } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Brand Arena" };
export const dynamic = "force-dynamic";

export default async function BrandOverviewPage() {
  const user = await requireUser("/sign-in?intent=brand&next=%2Fbrand");
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: { include: { products: { include: { deals: { include: { round: true, payments: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  const entries = memberships.flatMap((membership) =>
    membership.organization.products.flatMap((product) =>
      product.deals.map((deal) => ({ ...deal, product, organization: membership.organization })),
    ),
  );
  const liveEntries = entries.filter((entry) => entry.status === "LIVE");
  const attentionEntries = entries.filter((entry) => ["PENDING_PAYMENT", "PENDING_REVIEW", "REJECTED"].includes(entry.status));
  const totalPool = entries.reduce((total, entry) => total + entry.scoreCents, BigInt(0));

  return (
    <section className="dashboard-content brand-overview">
      <header><div><span className="eyebrow">Contender headquarters</span><h2>Brand Arena.</h2></div><ButtonLink href="/brand/entries/new" variant="dark"><Plus size={16} /> New entry</ButtonLink></header>
      <p className="workspace-intro">Manage the companies, offer pools, verification and payments that put your brand on the live board.</p>
      <div className="dashboard-stats"><div><span>Companies</span><strong>{memberships.length}</strong></div><div><span>Live entries</span><strong>{liveEntries.length}</strong></div><div><span>Customer value</span><strong>{formatMoney(totalPool)}</strong></div></div>
      <section className="dashboard-section">
        <div className="dashboard-section-title"><h3>Needs attention</h3><span>{attentionEntries.length} entries</span></div>
        {attentionEntries.length ? <div className="dashboard-list">{attentionEntries.slice(0, 5).map((entry) => <Link href={`/brand/entries/${entry.id}`} key={entry.id} className="dashboard-row"><div className={`status-swatch status-${entry.status.toLowerCase()}`} /><div><strong>{entry.product.name}</strong><span>{entry.organization.name}</span></div><div><span>round</span><strong>{entry.round.name}</strong></div><div><span>next step</span><strong>{entry.status === "PENDING_PAYMENT" ? "Finish payment" : entry.status === "PENDING_REVIEW" ? "Await review" : "Read decision"}</strong></div><ArrowRight size={18} /></Link>)}</div> : <div className="dashboard-empty compact"><ShieldCheck size={25} /><p>Everything is clear. Your live entries need no action.</p></div>}
      </section>
      {entries.length === 0 && <section className="brand-start-card"><Swords /><div><span className="eyebrow">Your first campaign</span><h3>Put real customer value on the board.</h3><p>Create a verified offer, load unique coupon inventory and enter the active round.</p></div><ButtonLink href="/brand/entries/new">Create first entry <ArrowRight size={16} /></ButtonLink></section>}
      <div className="brand-quick-links"><Link href="/brand/entries"><Swords /><span>All entries</span><strong>Track every offer</strong></Link><Link href="/brand/companies"><ShieldCheck /><span>Company control</span><strong>Manage verification</strong></Link><Link href="/brand/billing"><CircleDollarSign /><span>Billing</span><strong>Payments and receipts</strong></Link></div>
    </section>
  );
}
