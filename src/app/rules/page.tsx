import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Competition rules", description: "How ranking, verification, claims, and company entries work on DealWar." };

export default function RulesPage() {
  return <LegalPage kicker="Public rulebook / version 1.0" title="The rules of engagement." intro="The board is loud. The scoring is deliberately boring: auditable, comparable, and impossible to buy directly.">
    <h2>1. Rank follows committed customer value</h2><p>For the current USD credit round, score equals the fixed credit per customer multiplied by the number of unique, verified codes submitted. Entry fees do not count toward score. Ties are ordered by the time an approved entry goes live.</p>
    <h2>2. Companies must prove control</h2><p>An owner must verify the company domain by publishing the supplied DNS TXT record. DealWar may ask for additional evidence when the domain, offer, or submitter presents risk.</p>
    <h2>3. Inventory must be real</h2><p>Every public unit is backed by one unique coupon code encrypted at rest. Duplicate, malformed, previously issued, or non-functional codes may cause rejection, pause, refund denial, or removal.</p>
    <h2>4. Offers must be honest</h2><p>The headline and terms must agree. Material restrictions—including customer eligibility, minimum spend, supported products, geography, and expiry—must be stated before publication. Bait-and-switch offers are prohibited.</p>
    <h2>5. One claim per person, per deal</h2><p>Claims require an authenticated account and, in production, a verified email. DealWar applies rate limits and privacy-preserving abuse signals. Circumventing limits, reselling codes, automation, or multi-accounting can result in revoked claims and account suspension.</p>
    <h2>6. Humans can stop the board</h2><p>Moderators may reject, pause, end, or remove any entry to protect customers or the integrity of the competition. Material moderation actions are logged. Companies can contact support to appeal.</p>
    <h2>7. Disclosure</h2><p>Companies pay a disclosed entry and verification fee. Payment buys review and access to the competition; it never buys placement, rank, clicks, endorsements, or favorable moderation.</p>
  </LegalPage>;
}
