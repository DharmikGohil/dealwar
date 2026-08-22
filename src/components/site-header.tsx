import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <Link href="/" aria-label="DealWar home">
        <Wordmark />
      </Link>
      <nav aria-label="Primary navigation" className="primary-nav">
        <Link href="/#board">Live board</Link>
        <Link href="/rules">Rules</Link>
        <Link href="/about">Why this exists</Link>
      </nav>
      <div className="header-actions">
        {user ? (
          <ButtonLink href="/dashboard" variant="secondary">
            Control room <ArrowUpRight size={16} strokeWidth={2.5} />
          </ButtonLink>
        ) : (
          <>
            <Link href="/sign-in" className="sign-in-link">
              Sign in
            </Link>
            <ButtonLink href="/join" variant="dark">
              Enter the war <ArrowUpRight size={16} strokeWidth={2.5} />
            </ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}
