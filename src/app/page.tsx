import { ArrowDown, ArrowRight, BadgeDollarSign, ShieldCheck, Swords } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { ButtonLink } from "@/components/ui/button";
import { getLeaderboard, getPublicStats } from "@/lib/deals";
import { formatCompactMoney, formatNumber, timeLeft } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ round, deals }, stats] = await Promise.all([
    getLeaderboard(),
    getPublicStats(),
  ]);

  return (
    <>
      <section className="hero-shell">
        <div className="ticker" aria-label="DealWar principles">
          <span>NO PAY-TO-RANK</span><i />
          <span>FIXED-DOLLAR CREDITS</span><i />
          <span>VERIFIED INVENTORY</span><i />
          <span>ONE HUMAN, ONE CLAIM</span><i />
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className={round ? "live-dot" : undefined} /> {round ? `${round.name} is live` : "The opening fight is forming"}</div>
            <h1>Outbid them by giving <em>more.</em></h1>
            <p className="hero-deck">
              Companies fight for the top spot with real customer credit. You take the deal. The strongest verified pool wins.
            </p>
            <div className="hero-actions">
              <ButtonLink href="#board" variant="dark">See the live fight <ArrowDown size={18} /></ButtonLink>
              <ButtonLink href="/join" variant="secondary">Enter your company <ArrowRight size={18} /></ButtonLink>
            </div>
            <p className="hero-footnote"><ShieldCheck size={15} /> Every offer is manually reviewed and backed by unique claim codes.</p>
          </div>
          <aside className="score-poster" aria-label="Live DealWar statistics">
            <div className="poster-stamp">DW / {round ? "LIVE" : "STANDBY"}</div>
            <span className="poster-kicker">Value on the table</span>
            <strong>{formatCompactMoney(stats.liveValueCents)}</strong>
            <div className="poster-grid">
              <div><span>live deals</span><b>{formatNumber(stats.liveDeals)}</b></div>
              <div><span>claimed</span><b>{formatNumber(stats.claims)}</b></div>
              <div><span>round ends</span><b>{round ? timeLeft(round.endsAt) : "not scheduled"}</b></div>
            </div>
            <div className="poster-strike">CUSTOMERS / WIN</div>
          </aside>
        </div>
      </section>

      <section className="board-section" id="board">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><Swords size={15} /> Live leaderboard</span>
            <h2>{round?.name ?? "The opening round"}</h2>
          </div>
          <div className="board-rule">
            <BadgeDollarSign size={22} />
            <p><strong>Rank = verified credit pool.</strong><br />Equal pools: earliest live offer leads.</p>
          </div>
        </div>
        <div className="board-labels" aria-hidden="true">
          <span>rank / company</span><span>redemptions</span><span>customer value</span><span>action</span>
        </div>
        <Leaderboard deals={deals} />
      </section>

      <section className="manifesto">
        <div className="manifesto-number">01</div>
        <div>
          <span className="eyebrow">The rule is the product</span>
          <h2>Money still talks.<br />This time, it talks to customers.</h2>
        </div>
        <div className="manifesto-copy">
          <p>A $20 credit for 100 people creates a $2,000 pool. Put up more verified value and take the position. When customers claim, companies gain real users—not an empty badge.</p>
          <ButtonLink href="/rules" variant="secondary">Read the rules <ArrowRight size={17} /></ButtonLink>
        </div>
      </section>
    </>
  );
}
