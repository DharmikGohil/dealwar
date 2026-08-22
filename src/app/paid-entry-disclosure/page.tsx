import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Paid entry disclosure" };

export default function PaidEntryDisclosurePage() {
  return <LegalPage kicker="Advertising transparency" title="Payment cannot buy the board." intro="Companies pay DealWar for entry processing, verification, moderation, and access to a time-boxed promotional competition. That commercial relationship is disclosed publicly.">
    <h2>What the fee buys</h2><p>The fee buys an eligibility review and, if approved, participation in the selected round. It does not guarantee publication, traffic, clicks, claims, sales, a particular position, or favorable editorial treatment.</p>
    <h2>How ranking works</h2><p>For a fixed-USD-credit round, score equals the credit available to each customer multiplied by the number of unique verified coupon codes committed. Ties follow the published rulebook. Entry fees, company size, and private commercial relationships never add score.</p>
    <h2>What customers receive</h2><p>Customers can claim limited company-provided coupon codes without paying DealWar. Each listing identifies the participating company, the offered credit, remaining inventory, material terms, and destination website. DealWar does not endorse participating companies or their products.</p>
    <h2>Merchant of record</h2><p>Dodo Payments acts as merchant of record for company entry fees. It processes checkout, applicable transaction taxes, invoices, refunds, and payment disputes. Participating companies remain responsible for their own customer offers and redemptions.</p>
  </LegalPage>;
}
