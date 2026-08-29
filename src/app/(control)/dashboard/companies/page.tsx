import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Company entries" };
export const dynamic = "force-dynamic";

export default async function CompanyEntriesPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: { include: { products: { include: { deals: { include: { round: true } } } } } } },
    orderBy: { createdAt: "desc" },
  });
  const deals = memberships.flatMap((membership) =>
    membership.organization.products.flatMap((product) =>
      product.deals.map((deal) => ({ ...deal, product })),
    ),
  );

  return (
    <section className="dashboard-content company-entries-page">
      <header>
        <div><span className="eyebrow">Advertiser workspace</span><h2>Company entries.</h2></div>
        <ButtonLink href="/join">Enter a company</ButtonLink>
      </header>
      <section className="dashboard-section">
        <div className="dashboard-section-title"><h3>Your entries</h3><span>{deals.length} total</span></div>
        {deals.length ? (
          <div className="dashboard-list">
            {deals.map((deal) => (
              <Link href={`/dashboard/deals/${deal.id}`} key={deal.id} className="dashboard-row">
                <div className={`status-swatch status-${deal.status.toLowerCase()}`} />
                <div><strong>{deal.product.name}</strong><span>{deal.round.name}</span></div>
                <div><span>pool</span><strong>{formatMoney(deal.scoreCents)}</strong></div>
                <div><span>status</span><strong>{deal.status.replaceAll("_", " ")}</strong></div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <ShieldAlert size={30} />
            <h4>No company is in the ring yet.</h4>
            <p>Create your first verified offer pool.</p>
            <ButtonLink href="/join">Enter a company</ButtonLink>
          </div>
        )}
      </section>
    </section>
  );
}
