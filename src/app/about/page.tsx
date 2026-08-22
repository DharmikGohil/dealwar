import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Why DealWar exists", description: "A promotional leaderboard where companies win attention by giving customers more real value." };

export default function AboutPage() {
  return <LegalPage kicker="The reason for the noise" title="Attention should cost value." intro="Most ad markets reward whoever spends the most on distribution. DealWar flips that incentive: if a company wants the spotlight, customers should get the upside.">
    <h2>A scoreboard, not an ad slot</h2><p>Companies enter comparable offers into a time-boxed round. The board ranks the value actually committed to customers, backed by finite inventory—not slogans, impressions, or opaque bidding.</p>
    <h2>Built for public pressure</h2><p>Competition makes generosity visible. A challenger can pass the leader only by putting more redeemable value on the table. Customers can inspect the terms, availability, and score before giving anyone a click.</p>
    <h2>Trust has machinery</h2><p>Company domains are verified, offers are reviewed, codes are encrypted, claims are allocated transactionally, and privileged actions are audited. That is less glamorous than the leaderboard. It is also what makes the leaderboard worth watching.</p>
    <h2>What DealWar is not</h2><p>It is not an auction for ranking, a coupon dump, a promise of investment returns, or an endorsement of participating companies. It is a transparent contest over who is willing to deliver the most customer value under published terms.</p>
  </LegalPage>;
}
