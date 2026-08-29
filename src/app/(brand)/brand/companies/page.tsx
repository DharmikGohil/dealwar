import { ExternalLink, ShieldCheck, ShieldQuestion } from "lucide-react";
import { DomainVerification } from "@/components/dashboard/domain-verification";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Companies" };
export const dynamic = "force-dynamic";

export default async function BrandCompaniesPage() {
  const user = await requireUser("/sign-in?intent=brand&next=%2Fbrand%2Fcompanies");
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: { include: { products: { select: { id: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="dashboard-content brand-companies-page">
      <header><div><span className="eyebrow">Brand Arena / companies</span><h2>Company control.</h2></div></header>
      <p className="workspace-intro">Every public offer must be tied to a company domain you control.</p>
      {memberships.length ? <div className="company-control-list">{memberships.map(({ organization, role }) => (
        <article className="company-control-card" key={organization.id}>
          <header><div className={organization.verifiedAt ? "company-control-icon verified" : "company-control-icon"}>{organization.verifiedAt ? <ShieldCheck /> : <ShieldQuestion />}</div><div><span>{organization.verifiedAt ? "Verified contender" : "Verification required"}</span><h3>{organization.name}</h3><a href={organization.website} target="_blank" rel="noopener noreferrer">{new URL(organization.website).hostname} <ExternalLink size={13} /></a></div></header>
          <dl><div><dt>Billing email</dt><dd>{organization.billingEmail}</dd></div><div><dt>Products</dt><dd>{organization.products.length}</dd></div><div><dt>Your access</dt><dd>{role}</dd></div></dl>
          <DomainVerification organizationId={organization.id} verified={Boolean(organization.verifiedAt)} />
        </article>
      ))}</div> : <div className="dashboard-empty"><ShieldQuestion size={30} /><h3>No company profile yet.</h3><p>Your first company is created when you submit an entry.</p></div>}
    </section>
  );
}
