import { LoadingStatus } from "@/components/ui/loading-status";

function Block({ className = "" }: { className?: string }) {
  return <span className={`dw-skeleton-block ${className}`} />;
}

function BoardRows({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-board-rows">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-board-row" key={index}>
          <Block className="skeleton-rank" />
          <Block className="skeleton-avatar" />
          <div className="skeleton-row-copy"><Block className="skeleton-line skeleton-line-strong" /><Block className="skeleton-line skeleton-line-short" /></div>
          <Block className="skeleton-meter" />
          <Block className="skeleton-value" />
          <Block className="skeleton-action" />
        </div>
      ))}
    </div>
  );
}

export function PublicBoardSkeleton() {
  return (
    <div className="skeleton-page skeleton-public" aria-busy="true">
      <LoadingStatus label="Loading the live DealWar leaderboard" />
      <section className="skeleton-public-hero" aria-hidden="true">
        <div className="skeleton-hero-copy">
          <Block className="skeleton-kicker" />
          <Block className="skeleton-display skeleton-display-wide" />
          <Block className="skeleton-display skeleton-display-mid" />
          <Block className="skeleton-copy-line" />
          <Block className="skeleton-copy-line skeleton-copy-line-short" />
          <div className="skeleton-button-row"><Block className="skeleton-button" /><Block className="skeleton-button skeleton-button-light" /></div>
        </div>
        <div className="skeleton-score-poster">
          <Block className="skeleton-poster-stamp" />
          <div><Block className="skeleton-kicker skeleton-invert" /><Block className="skeleton-poster-number skeleton-invert" /></div>
          <div className="skeleton-poster-grid"><Block className="skeleton-invert" /><Block className="skeleton-invert" /><Block className="skeleton-invert" /></div>
        </div>
      </section>
      <section className="skeleton-public-board" aria-hidden="true">
        <div className="skeleton-section-head"><div><Block className="skeleton-kicker" /><Block className="skeleton-section-title" /></div><Block className="skeleton-rule-card" /></div>
        <BoardRows />
      </section>
    </div>
  );
}

export function BrandLandingSkeleton() {
  return (
    <div className="skeleton-page skeleton-brand-landing" aria-busy="true">
      <LoadingStatus label="Loading the DealWar brand entry guide" />
      <section aria-hidden="true">
        <div>
          <Block className="skeleton-kicker" />
          <Block className="skeleton-display skeleton-display-wide" />
          <Block className="skeleton-display skeleton-display-mid skeleton-signal" />
          <Block className="skeleton-copy-line" />
          <Block className="skeleton-copy-line skeleton-copy-line-short" />
          <div className="skeleton-button-row"><Block className="skeleton-button" /><Block className="skeleton-button skeleton-button-light" /></div>
        </div>
        <div className="skeleton-round-card"><Block className="skeleton-kicker" /><Block className="skeleton-round-title" /><Block className="skeleton-copy-line" /><Block className="skeleton-round-list" /></div>
      </section>
    </div>
  );
}

export function BrandArenaSkeleton() {
  return (
    <div className="dashboard-content skeleton-workspace" aria-busy="true">
      <LoadingStatus label="Loading your Brand Arena workspace" />
      <div aria-hidden="true">
        <div className="skeleton-workspace-head"><div><Block className="skeleton-kicker" /><Block className="skeleton-workspace-title" /></div><Block className="skeleton-button" /></div>
        <Block className="skeleton-copy-line skeleton-workspace-intro" />
        <div className="skeleton-stat-grid">{Array.from({ length: 3 }, (_, index) => <div key={index}><Block className="skeleton-kicker" /><Block className="skeleton-stat-number" /></div>)}</div>
        <div className="skeleton-list-head"><Block className="skeleton-line skeleton-line-strong" /><Block className="skeleton-kicker" /></div>
        <BoardRows count={4} />
      </div>
    </div>
  );
}

export function CollectorSkeleton() {
  return (
    <div className="claims-page skeleton-collector" aria-busy="true">
      <LoadingStatus label="Loading your claimed deals" />
      <div aria-hidden="true">
        <div className="skeleton-collector-head"><div><Block className="skeleton-kicker" /><Block className="skeleton-collector-title" /><Block className="skeleton-copy-line skeleton-copy-line-short" /></div><div className="skeleton-count-card"><Block className="skeleton-stat-number" /><Block className="skeleton-kicker" /></div></div>
        <div className="skeleton-vault-list">{Array.from({ length: 3 }, (_, index) => <div className="skeleton-vault-row" key={index}><div><Block className="skeleton-kicker" /><Block className="skeleton-line skeleton-line-strong" /><Block className="skeleton-line skeleton-line-short" /></div><Block className="skeleton-value" /><Block className="skeleton-code" /><Block className="skeleton-action" /></div>)}</div>
      </div>
    </div>
  );
}

export function DealSkeleton() {
  return (
    <div className="skeleton-deal" aria-busy="true">
      <LoadingStatus label="Loading this verified deal" />
      <div className="skeleton-deal-main" aria-hidden="true"><Block className="skeleton-kicker" /><div className="skeleton-brand-lockup"><Block className="skeleton-brand-logo" /><div><Block className="skeleton-kicker" /><Block className="skeleton-deal-title" /></div></div><Block className="skeleton-deal-headline" /><Block className="skeleton-copy-line" /><Block className="skeleton-copy-line skeleton-copy-line-short" /><div className="skeleton-fact-grid">{Array.from({ length: 4 }, (_, index) => <Block key={index} />)}</div></div>
      <aside className="skeleton-deal-side" aria-hidden="true"><div className="skeleton-availability"><Block className="skeleton-kicker" /><Block className="skeleton-poster-number" /><Block className="skeleton-meter" /></div><div className="skeleton-claim-card"><Block className="skeleton-kicker" /><Block className="skeleton-section-title" /><Block className="skeleton-copy-line" /><Block className="skeleton-button" /></div></aside>
    </div>
  );
}

export function OperatorSkeleton() {
  return (
    <div className="admin-page skeleton-operator" aria-busy="true">
      <LoadingStatus label="Loading the operator moderation queue" />
      <div aria-hidden="true"><Block className="skeleton-kicker" /><Block className="skeleton-operator-title" /><div className="skeleton-operator-grid">{Array.from({ length: 4 }, (_, index) => <article key={index}><div><Block className="skeleton-kicker" /><Block className="skeleton-line skeleton-line-strong" /><Block className="skeleton-line skeleton-line-short" /></div><div className="skeleton-card-facts"><Block /><Block /><Block /><Block /></div><Block className="skeleton-copy-line" /><Block className="skeleton-button" /></article>)}</div></div>
    </div>
  );
}
