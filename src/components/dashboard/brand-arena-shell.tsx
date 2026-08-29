"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type BrandArenaUser = {
  name: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
};

type BrandArenaShellProps = {
  user: BrandArenaUser;
  children: React.ReactNode;
};

export function BrandArenaShell({ user, children }: BrandArenaShellProps) {
  const pathname = usePathname();
  const navigation = [
    { key: "overview" as const, href: "/brand", label: "Overview" },
    { key: "entries" as const, href: "/brand/entries", label: "Entries" },
    { key: "companies" as const, href: "/brand/companies", label: "Companies" },
    { key: "billing" as const, href: "/brand/billing", label: "Billing" },
  ];
  const active = pathname === "/brand"
    ? "overview"
    : pathname.startsWith("/brand/entries")
      ? "entries"
      : pathname === "/brand/companies"
        ? "companies"
        : pathname === "/brand/billing"
          ? "billing"
          : undefined;

  return (
    <section className="brand-arena-shell">
      <aside className="brand-sidebar">
        <div className="brand-arena-identity">
          <span className="eyebrow">Brand arena</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <span className="brand-arena-role">Contender workspace</span>
        </div>
        <nav aria-label="Brand Arena navigation">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={active === item.key ? "active" : undefined}
              aria-current={active === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="brand-sidebar-entry" href="/brand/entries/new"><Plus size={15} /> New entry</Link>
        <Link className="brand-sidebar-exit" href="/#board"><ArrowLeft size={15} /> Live deals</Link>
        <SignOutButton />
      </aside>
      <div className="brand-arena-workspace">{children}</div>
    </section>
  );
}
