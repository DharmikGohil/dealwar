import Link from "next/link";
import { ArrowUpRight, TicketCheck } from "lucide-react";
import { ClaimCode } from "@/components/dashboard/claim-code";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { decryptCoupon } from "@/lib/security";
import { requireUser } from "@/lib/session";

export const metadata = { title: "My deals" };
export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const user = await requireUser("/sign-in?next=%2Fmy-deals");
  const claims = await db.claim.findMany({
    where: { userId: user.id },
    include: { couponCode: true, deal: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="claims-page collector-page">
        <header>
          <div><span className="eyebrow">Collector vault</span><h1>My deals.</h1><p>Every code you claim stays secured here.</p></div>
          <div className="claims-count"><TicketCheck /><strong>{claims.length}</strong><span>codes claimed</span></div>
        </header>
        <div className="collector-actions"><ButtonLink href="/#board" variant="dark">Explore live deals</ButtonLink></div>
        {claims.length ? (
          <div className="claim-vault">
            {claims.map((claim) => (
              <article className="claim-vault-row" key={claim.id}>
                <div className="claim-vault-brand" style={{ borderColor: claim.deal.product.accentColor }}>
                  <span>{claim.status}</span>
                  <h2>{claim.deal.product.name}</h2>
                  <p>{claim.deal.headline}</p>
                </div>
                <div className="claim-vault-value"><span>Credit</span><strong>{formatMoney(claim.deal.creditAmountCents)}</strong></div>
                <div className="claim-vault-code"><span>Private coupon code</span><ClaimCode code={decryptCoupon(claim.couponCode)} /></div>
                <div className="claim-vault-actions">
                  <span>Claimed {claim.createdAt.toLocaleDateString("en-US")}</span>
                  <a href={claim.deal.redemptionUrl} target="_blank" rel="noopener noreferrer sponsored">Redeem <ArrowUpRight size={16} /></a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty"><TicketCheck /><h2>Your vault is ready.</h2><p>Claim a live offer and its private code will stay here.</p><Link className="text-link" href="/#board">Browse live deals</Link></div>
        )}
        <p className="vault-security-note">Codes are decrypted only while rendering this authenticated, uncached page. DealWar never includes them in public pages or analytics.</p>
    </section>
  );
}
