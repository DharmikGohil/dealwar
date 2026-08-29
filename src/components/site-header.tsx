import Link from "next/link";
import { ArrowUpRight, Building2, Shield, TicketCheck, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
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
        <Link href="/#board">Live deals</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/brands">For brands</Link>
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <Link href="/my-deals" className="header-role-link"><TicketCheck size={15} /> My deals</Link>
            <Link href="/brand" className="header-role-link"><Building2 size={15} /> Brand Arena</Link>
            <details className="account-menu">
              <summary aria-label="Open account menu"><UserRound size={16} /><span>{user.name.split(/\s+/)[0]}</span></summary>
              <div>
                <strong>{user.name}</strong><small>{user.email}</small>
                <Link href="/my-deals"><TicketCheck size={14} /> My deals</Link>
                <Link href="/brand"><Building2 size={14} /> Brand Arena</Link>
                {["ADMIN", "MODERATOR"].includes(user.role) && <Link href="/admin"><Shield size={14} /> Operator Console</Link>}
                <SignOutButton />
              </div>
            </details>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="sign-in-link">
              Sign in
            </Link>
            <ButtonLink href="/#board" variant="dark">
              Explore deals <ArrowUpRight size={16} strokeWidth={2.5} />
            </ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}
