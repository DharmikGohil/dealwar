import { ArrowDown, ArrowRight, BadgeDollarSign, Building2, ShieldCheck, Swords, TicketCheck } from "lucide-react";
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
            <h1>The live deal leaderboard.</h1>
            <p className="hero-deck">
              Brands compete by giving customers more real value. Browse the rankings, claim one verified code and keep the win.
            </p>
            <div className="hero-actions">
              <ButtonLink href="#board" variant="dark">Explore live deals <ArrowDown size={18} /></ButtonLink>
              <ButtonLink href="/brands" variant="secondary">List your brand <ArrowRight size={18} /></ButtonLink>
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

      <section className="audience-section" id="how-it-works">
        <header><span className="eyebrow">One arena / two clear paths</span><h2>Collect a deal.<br />Or contend for the top.</h2></header>
        <div className="audience-grid">
          <article className="audience-card collector-card">
            <div className="audience-card-number">01</div><TicketCheck size={31} />
            <span>For customers / Collectors</span><h3>Find it. Claim it. Keep it.</h3>
            <ol><li><b>Browse</b> the live leaderboard</li><li><b>Claim</b> one verified code</li><li><b>Return</b> anytime from My Deals</li></ol>
            <ButtonLink href="#board" variant="dark">Browse deals <ArrowRight size={16} /></ButtonLink>
          </article>
          <article className="audience-card contender-card">
            <div className="audience-card-number">02</div><Building2 size={31} />
            <span>For brands / Contenders</span><h3>Put customer value on the board.</h3>
            <ol><li><b>Create</b> a verified offer pool</li><li><b>Complete</b> payment and domain checks</li><li><b>Compete</b> by giving customers more</li></ol>
            <ButtonLink href="/brands" variant="secondary">Enter Brand Arena <ArrowRight size={16} /></ButtonLink>
          </article>
        </div>
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
