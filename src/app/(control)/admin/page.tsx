import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { RoundManager } from "@/components/admin/round-manager";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Moderation" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole(["ADMIN", "MODERATOR"]);
  const [queue, rounds] = await Promise.all([
    db.deal.findMany({ where: { status: { in: ["PENDING_REVIEW", "LIVE", "PAUSED"] } }, include: { product: { include: { organization: true } }, payments: true, round: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] }),
    db.round.findMany({ include: { _count: { select: { deals: true } } }, orderBy: { startsAt: "desc" }, take: 12 }),
  ]);
  return <section className="admin-page"><header><div><span className="eyebrow"><ShieldAlert size={15} /> Operator console</span><h1>Moderation queue.</h1></div></header>{user.role === "ADMIN" && <RoundManager rounds={rounds.map((round) => ({ id: round.id, name: round.name, status: round.status, startsAt: round.startsAt.toISOString(), endsAt: round.endsAt.toISOString(), dealCount: round._count.deals }))} />}<div className="admin-queue">{queue.map((deal) => <article key={deal.id} className="admin-card"><div className="admin-card-head"><div><span>{deal.status.replaceAll("_", " ")}</span><h2>{deal.product.name}</h2><p>{deal.product.organization.name} · {new URL(deal.product.organization.website).hostname}</p></div><strong>{formatMoney(deal.scoreCents)} pool</strong></div><dl><div><dt>Offer</dt><dd>{deal.headline}</dd></div><div><dt>Inventory</dt><dd>{deal.availableCount} / {deal.inventoryCount} codes</dd></div><div><dt>Domain</dt><dd>{deal.product.organization.verifiedAt ? "Verified" : "Not verified"}</dd></div><div><dt>Payment</dt><dd>{deal.payments.some((payment) => payment.status === "SUCCEEDED") ? "Paid" : "Pending"}</dd></div></dl><p className="admin-terms">{deal.terms}</p><div className="admin-links">{["LIVE", "ENDED"].includes(deal.status) && <Link href={`/deals/${deal.slug}`}>Public page</Link>}<Link href={`/dashboard/deals/${deal.id}`}>Full record</Link></div><ModerationActions dealId={deal.id} status={deal.status} /></article>)}</div>{queue.length === 0 && <div className="dashboard-empty compact"><ShieldAlert size={28} /><h2>Queue clear.</h2><p>No company entries need moderation right now.</p></div>}</section>;
}
