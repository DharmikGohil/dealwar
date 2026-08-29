import { ExternalLink, ReceiptText } from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Brand billing" };
export const dynamic = "force-dynamic";

export default async function BrandBillingPage() {
  const user = await requireUser("/sign-in?intent=brand&next=%2Fbrand%2Fbilling");
  const payments = await db.payment.findMany({
    where: { deal: { product: { organization: { memberships: { some: { userId: user.id } } } } } },
    include: { deal: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="dashboard-content brand-billing-page">
      <header><div><span className="eyebrow">Brand Arena / billing</span><h2>Payments.</h2></div></header>
      <p className="workspace-intro">Entry fees fund verification and operations. They never affect leaderboard rank.</p>
      {payments.length ? <div className="billing-list">{payments.map((payment) => (
        <article key={payment.id}>
          <ReceiptText />
          <div><strong>{payment.deal.product.name}</strong><span>{payment.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span></div>
          <div><span>Amount</span><strong>{formatMoney(payment.amountCents, payment.currency.toUpperCase())}</strong></div>
          <div><span>Status</span><strong>{payment.status.replaceAll("_", " ")}</strong></div>
          {payment.receiptUrl ? <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">Receipt <ExternalLink size={14} /></a> : <span className="billing-no-receipt">—</span>}
        </article>
      ))}</div> : <div className="dashboard-empty"><ReceiptText size={30} /><h3>No payments yet.</h3><p>Entry payments and receipts will appear here.</p></div>}
    </section>
  );
}
