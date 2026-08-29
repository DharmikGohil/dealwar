import Link from "next/link";
import { ArrowUpRight, TicketCheck } from "lucide-react";
import { ClaimCode } from "@/components/dashboard/claim-code";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { decryptCoupon } from "@/lib/security";
import { requireUser } from "@/lib/session";

export const metadata = { title: "My claims" };
export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const user = await requireUser();
  const claims = await db.claim.findMany({
    where: { userId: user.id },
    include: { couponCode: true, deal: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="claims-page">
        <header>
          <div><span className="eyebrow">Your secured credits</span><h1>My claims.</h1></div>
          <div className="claims-count"><TicketCheck /><strong>{claims.length}</strong><span>codes claimed</span></div>
        </header>
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
          <div className="dashboard-empty"><TicketCheck /><h2>The vault is empty.</h2><p>Claim a live offer and its code will stay here.</p><Link className="text-link" href="/#board">Browse the board</Link></div>
        )}
        <p className="vault-security-note">Codes are decrypted only while rendering this authenticated, uncached page. DealWar never includes them in public pages or analytics.</p>
    </section>
  );
}
