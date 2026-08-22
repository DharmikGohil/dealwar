import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Refund policy" };

export default function RefundPolicyPage() {
  return <LegalPage kicker="Refunds / effective August 22, 2026" title="Clear outcomes. Fair refunds." intro="A company entry fee pays for processing, verification, moderation, and access to a DealWar competition round. It never purchases rank.">
    <h2>Rejected entries</h2><p>If DealWar rejects an entry during its initial moderation review, DealWar initiates a full refund of the entry fee through Dodo Payments. The company’s bank or payment method controls how quickly the returned funds appear.</p>
    <h2>Cancelled or unavailable rounds</h2><p>If DealWar cancels a round or cannot provide the paid entry service, DealWar will provide a full or proportionate refund as appropriate. This does not limit any refund right required by applicable law.</p>
    <h2>Approved entries</h2><p>Once an entry has been reviewed and approved, the fee is ordinarily non-refundable because the verification and moderation service has been performed and round access has been provided. Removal caused by false information, unusable coupon inventory, prohibited content, abuse, or breach of the rules is not eligible for a refund.</p>
    <h2>Duplicate or incorrect charges</h2><p>Contact support promptly with the invoice, payment identifier, company name, and a description of the problem. Do not send full card details. DealWar and Dodo Payments will investigate confirmed duplicate or incorrect charges.</p>
    <h2>Customer claims</h2><p>Customers do not pay DealWar to claim company coupon codes. Questions about a participating company’s product, redemption, or underlying purchase must first be directed to that company, while claim-allocation problems can be reported to DealWar.</p>
    <h2>How to request help</h2><p>Use the contact page and choose “Company entry.” Dodo Payments may appear as the merchant on the invoice or payment statement and may communicate directly about payment, tax, refund, or dispute processing.</p>
  </LegalPage>;
}
