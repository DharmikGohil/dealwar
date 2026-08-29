import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarClock, MousePointerClick, ShieldCheck, TicketCheck } from "lucide-react";
import { ClaimPanel } from "@/components/deals/claim-panel";
import { getDealBySlug } from "@/lib/deals";
import { formatMoney, initials, timeLeft } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ claim?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  if (!deal) return { title: "Deal not found" };
  return {
    title: `${deal.product.name}: ${deal.headline}`,
    description: deal.product.tagline,
  };
}

export default async function DealPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const [{ claim }, deal, user] = await Promise.all([searchParams, getDealBySlug(slug), getCurrentUser()]);
  if (!deal || !["LIVE", "ENDED"].includes(deal.status)) notFound();
  const available = deal.status === "LIVE" && deal.availableCount > 0 && (!deal.endsAt || deal.endsAt > new Date());
  return (
    <section className="deal-page">
      <div className="deal-page-main">
        <div className="deal-breadcrumb">LIVE BOARD / {deal.round.name.toUpperCase()} / {deal.product.name.toUpperCase()}</div>
        <div className="deal-brand-lockup">
          <div className="deal-logo" style={{ background: deal.product.accentColor }}>
            {deal.product.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- company logo URL is manually moderated before publication
              <img src={deal.product.logoUrl} alt="" />
            ) : initials(deal.product.name)}
          </div>
          <div><span>Verified company</span><h1>{deal.product.name}</h1></div>
        </div>
        <p className="deal-headline">{deal.headline}</p>
        <p className="deal-description">{deal.product.description}</p>
        <a href={`/r/${deal.slug}`} target="_blank" rel="noopener noreferrer sponsored" className="company-link">
          Visit {deal.product.name} <ArrowUpRight size={18} />
        </a>
        <div className="deal-facts">
          <div><ShieldCheck /><span>Pool value</span><strong>{formatMoney(deal.scoreCents)}</strong></div>
          <div><TicketCheck /><span>Credit</span><strong>{formatMoney(deal.creditAmountCents)}</strong></div>
          <div><CalendarClock /><span>Time left</span><strong>{deal.endsAt ? timeLeft(deal.endsAt) : "—"}</strong></div>
          <div><MousePointerClick /><span>Verified clicks</span><strong>{deal._count.clicks}</strong></div>
        </div>
        <div className="deal-terms">
          <span className="eyebrow">Company terms</span>
          <p>{deal.terms}</p>
          <small>DealWar verifies inventory and company control. The company is responsible for honoring the published credit terms.</small>
        </div>
      </div>
      <aside className="deal-claim-side">
        <div className="availability-meter">
          <span>Available now</span>
          <strong>{deal.availableCount}</strong>
          <small>of {deal.inventoryCount} codes remain</small>
          <div><i style={{ width: `${Math.round((deal.availableCount / deal.inventoryCount) * 100)}%` }} /></div>
        </div>
        <ClaimPanel slug={deal.slug} signedIn={Boolean(user)} available={available} autoClaim={claim === "1"} />
      </aside>
    </section>
  );
}
