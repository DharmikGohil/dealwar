import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck, TicketCheck } from "lucide-react";
import type { PublicDeal } from "@/lib/deals";
import { formatCompactMoney, formatMoney, initials } from "@/lib/format";

function Rank({ value }: { value: number }) {
  return (
    <div className={`rank rank-${value <= 3 ? value : "other"}`} aria-label={`Rank ${value}`}>
      <span>#</span>{value.toString().padStart(2, "0")}
    </div>
  );
}

export function Leaderboard({ deals }: { deals: PublicDeal[] }) {
  if (deals.length === 0) {
    return (
      <div className="empty-board">
        <span className="eyebrow">Round preparing</span>
        <h3>The board opens when the first verified pools are loaded.</h3>
        <p>No fake activity and no house listings. Every live offer is backed by unique claim inventory.</p>
        <Link href="/brands" className="text-link">
          Enter your brand <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  return (
    <div className="leaderboard" role="list">
      {deals.map((deal) => {
        const claimedPercent = Math.round((deal.claimedCount / deal.inventoryCount) * 100);
        return (
          <article className="deal-row" key={deal.id} role="listitem">
            <Rank value={deal.rank} />
            <div
              className="product-avatar"
              style={{ "--product-accent": deal.product.accentColor } as React.CSSProperties}
            >
              {deal.product.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- externally moderated logo URL
                <img src={deal.product.logoUrl} alt="" />
              ) : (
                initials(deal.product.name)
              )}
            </div>
            <div className="deal-identity">
              <div className="deal-name-line">
                <h3>{deal.product.name}</h3>
                {deal.rank <= 3 && (
                  <span className="verified-pill"><ShieldCheck size={13} /> verified pool</span>
                )}
              </div>
              <p>{deal.headline}</p>
              <div className="deal-meta">
                <span><TicketCheck size={14} /> {deal.availableCount} left</span>
                <span><Clock3 size={14} /> this round</span>
              </div>
            </div>
            <div className="deal-progress" aria-label={`${claimedPercent}% claimed`}>
              <div><span>claimed</span><strong>{deal.claimedCount}/{deal.inventoryCount}</strong></div>
              <div className="progress-track"><span style={{ width: `${claimedPercent}%` }} /></div>
            </div>
            <div className="deal-value">
              <span>live pool</span>
              <strong>{formatCompactMoney(deal.scoreCents)}</strong>
              <small>{formatMoney(deal.creditAmountCents)} each</small>
            </div>
            <Link href={`/deals/${deal.slug}`} className="claim-button" aria-label={`Claim ${deal.product.name} deal`}>
              Claim <ArrowRight size={17} strokeWidth={2.5} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}
