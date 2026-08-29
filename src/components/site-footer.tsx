import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Wordmark />
        <p>Companies compete. Customers collect.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/#board">Live deals</Link>
        <Link href="/brands">For brands</Link>
        <Link href="/rules">Rules</Link>
        <Link href="/paid-entry-disclosure">Paid entry disclosure</Link>
        <Link href="/acceptable-use">Acceptable use</Link>
        <Link href="/refund-policy">Refunds</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <p className="footer-note">Paid entries are disclosed. Rank follows verified customer value.</p>
    </footer>
  );
}
