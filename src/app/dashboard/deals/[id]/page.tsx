import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, CircleDollarSign, Clock3, ShieldCheck, TicketCheck } from "lucide-react";
import Link from "next/link";
import { DomainVerification } from "@/components/dashboard/domain-verification";
import { PaymentControl } from "@/components/dashboard/payment-control";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Deal status" };
export const dynamic = "force-dynamic";

export default async function DashboardDealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const deal = await db.deal.findUnique({
    where: { id },
    include: { product: { include: { organization: { include: { memberships: true } } } }, round: true, payments: true, moderationCases: { orderBy: { createdAt: "desc" } } },
  });
  if (!deal) notFound();
  if (!deal.product.organization.memberships.some((membership) => membership.userId === user.id) && !["ADMIN", "MODERATOR"].includes(user.role)) redirect("/dashboard");
  const latestPayment = [...deal.payments].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
  const successfulPayment = deal.payments.find((payment) => payment.status === "SUCCEEDED");
  const paid = Boolean(successfulPayment);
  const { payment: paymentReturn } = await searchParams;
  const returnState = paymentReturn === "return" || paymentReturn === "cancelled" ? paymentReturn : undefined;
  return (
    <section className="deal-status-page">
      <Link href="/dashboard" className="back-link"><ArrowLeft size={16} /> Control room</Link>
      <header className="deal-status-header"><div><span className="eyebrow">{deal.round.name} / entry status</span><h1>{deal.product.name}</h1><p>{deal.headline}</p></div><div className={`big-status status-${deal.status.toLowerCase()}`}><span>Current state</span><strong>{deal.status.replaceAll("_", " ")}</strong></div></header>
      <div className="gate-grid">
        <div className={paid ? "gate done" : "gate"}><CircleDollarSign /><span>Entry payment</span><strong>{paid ? "Paid" : latestPayment?.status === "FAILED" ? "Retry needed" : "Pending"}</strong><small>{formatMoney(deal.entryFeeCents)}</small></div>
        <div className={deal.product.organization.verifiedAt ? "gate done" : "gate"}><ShieldCheck /><span>Company control</span><strong>{deal.product.organization.verifiedAt ? "Verified" : "Required"}</strong><small>{new URL(deal.product.organization.website).hostname}</small></div>
        <div className={deal.reviewedAt ? "gate done" : "gate"}><Check /><span>Human review</span><strong>{deal.reviewedAt ? "Complete" : "In queue"}</strong><small>Offer, inventory and terms</small></div>
        <div className={deal.status === "LIVE" ? "gate done" : "gate"}><Clock3 /><span>Publication</span><strong>{deal.status === "LIVE" ? "Live" : "Waiting"}</strong><small>{deal.round.endsAt.toLocaleString("en-US")}</small></div>
      </div>
      <PaymentControl
        dealId={deal.id}
        paid={paid}
        paymentStatus={latestPayment?.status || "UNPAID"}
        receiptUrl={successfulPayment?.receiptUrl}
        returnState={returnState}
      />
      <div className="status-columns">
        <DomainVerification organizationId={deal.product.organization.id} verified={Boolean(deal.product.organization.verifiedAt)} />
        <div className="inventory-summary"><TicketCheck size={24} /><span className="eyebrow">Encrypted inventory</span><strong>{deal.availableCount}/{deal.inventoryCount}</strong><p>codes still available</p><div><i style={{ width: `${Math.round((deal.availableCount / deal.inventoryCount) * 100)}%` }} /></div></div>
      </div>
      {deal.product.rejectionNote && <div className="rejection-note"><strong>Review note</strong><p>{deal.product.rejectionNote}</p></div>}
      <div className="entry-receipt"><div><span>Credit each</span><strong>{formatMoney(deal.creditAmountCents)}</strong></div><div><span>Published pool</span><strong>{formatMoney(deal.scoreCents)}</strong></div><div><span>Claims</span><strong>{deal.claimedCount}</strong></div><div><span>Entry created</span><strong>{deal.createdAt.toLocaleDateString("en-US")}</strong></div></div>
    </section>
  );
}
