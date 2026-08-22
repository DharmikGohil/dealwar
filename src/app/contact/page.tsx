import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return <section className="contact-page"><header><span className="eyebrow">Support / operations / press</span><h1>Talk to a human.</h1><p>Claim trouble, company verification, security reports, or a genuinely good question. Send it here.</p></header><ContactForm /></section>;
}
