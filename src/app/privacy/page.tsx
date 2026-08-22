import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <LegalPage kicker="Privacy / effective August 22, 2026" title="Collect less. Protect more." intro="This policy describes the information DealWar processes to operate accounts, competitions, payments, security, and support.">
    <h2>Information we process</h2><p>We process account details such as name, email, verification state, and session information; company-submitted identity, offer, and billing information; claims and payment records; and support messages. We do not store full payment-card details.</p>
    <h2>Security and abuse signals</h2><p>We use network address and user-agent information transiently to produce keyed, non-reversible abuse hashes. Raw values are not retained in DealWar’s claim and click records. Essential cookies maintain secure sessions and fraud controls.</p>
    <h2>Coupon inventory</h2><p>Company coupon codes are encrypted with authenticated encryption. Separate keyed hashes detect duplicates. Plaintext is revealed only to the entitled claimant and within authorized account views or operational investigations.</p>
    <h2>Why we process information</h2><p>We use information to provide accounts and claims, verify companies, collect fees, prevent abuse, resolve disputes, communicate transactional events, comply with law, and improve reliability. We do not sell personal information or use coupon codes for advertising profiles.</p>
    <h2>Payments and invoicing</h2><p>Dodo Payments acts as merchant of record for paid company entries. Dodo collects billing details, processes payment methods, calculates applicable transaction taxes, issues invoices, handles refunds and disputes, and pays DealWar the resulting proceeds. DealWar receives payment status, customer identity and contact details, invoice information, and transaction identifiers, but never receives or stores full card numbers.</p>
    <h2>Processors and transfers</h2><p>DealWar also relies on infrastructure, database, email, object-storage, authentication, and monitoring providers. They process limited information under their own contractual safeguards and only as needed to provide those services.</p>
    <h2>Retention and your choices</h2><p>We retain operational and financial records only as long as reasonably needed for service, fraud prevention, disputes, and legal obligations. You may request access, correction, or deletion through the contact page. Some records may be retained where legally required or necessary to protect the platform.</p>
    <h2>Changes</h2><p>Material changes will be posted here with a new effective date. Contact support with privacy questions or rights requests.</p>
  </LegalPage>;
}
