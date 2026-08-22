import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return <LegalPage kicker="Terms / effective August 22, 2026" title="Platform terms." intro="By using DealWar, you agree to these terms and the public competition rules. If you enter on behalf of a company, you confirm you can bind it.">
    <h2>Accounts</h2><p>Provide accurate information, protect your credentials, and notify DealWar of suspected compromise. You are responsible for activity under your account. You must be legally able to enter into this agreement.</p>
    <h2>Customer claims</h2><p>A claim allocates a company-provided code under that company’s displayed terms. DealWar facilitates allocation but is not the seller of the company’s product. Do not automate claims, evade limits, resell codes, or interfere with other users.</p>
    <h2>Company entries</h2><p>Companies warrant that they control the submitted domain, have authority to publish the offer, own or may use uploaded branding, and will honor every valid claim exactly as described. Submitted materials must not infringe rights, mislead customers, or contain malicious content.</p>
    <h2>Fees, merchant of record, and refunds</h2><p>The checkout price is disclosed before payment and covers entry processing, verification, and platform operations. Rank is never purchased. Dodo Payments acts as merchant of record for paid entries and may collect billing details and applicable taxes, issue invoices, and process refunds or disputes. The separate refund policy forms part of these terms.</p>
    <h2>Moderation and suspension</h2><p>DealWar may investigate, reject, pause, remove, or end content and accounts to enforce these terms, protect users, respond to legal demands, or preserve platform integrity. Serious abuse may be reported to affected providers or authorities.</p>
    <h2>Disclaimers and liability</h2><p>The service is provided on an “as available” basis. To the extent permitted by law, DealWar disclaims implied warranties and is not responsible for a company’s products or failure to honor an offer. DealWar’s aggregate liability relating to the service will not exceed the greater of fees you paid to DealWar in the prior 12 months or USD $100. These limits do not apply where prohibited by law.</p>
    <h2>Changes and contact</h2><p>DealWar may update these terms prospectively. Continued use after an effective date constitutes acceptance. Contact support before using the service if you do not agree.</p>
  </LegalPage>;
}
