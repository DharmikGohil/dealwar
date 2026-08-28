import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

type ControlRoomUser = {
  name: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
};

type ActiveSection = "overview" | "companies" | "claims" | "new-entry" | "moderation";

type ControlRoomShellProps = {
  user: ControlRoomUser;
  active: ActiveSection;
  children: React.ReactNode;
};

export function ControlRoomShell({ user, active, children }: ControlRoomShellProps) {
  const navigation = [
    { key: "overview" as const, href: "/dashboard", label: "Overview" },
    { key: "companies" as const, href: "/dashboard#company-entries", label: "Company entries" },
    { key: "claims" as const, href: "/dashboard/claims", label: "My claims" },
    { key: "new-entry" as const, href: "/join", label: "New company entry" },
    ...(["ADMIN", "MODERATOR"].includes(user.role)
      ? [{ key: "moderation" as const, href: "/admin", label: "Moderation" }]
      : []),
  ];

  return (
    <section className="control-room-shell">
      <aside className="dashboard-sidebar">
        <div className="control-room-identity">
          <span className="eyebrow">Control room</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <span className="control-room-role">{user.role === "USER" ? "Member" : user.role}</span>
        </div>
        <nav aria-label="Control room navigation">
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
        <SignOutButton />
      </aside>
      <div className="control-room-workspace">{children}</div>
    </section>
  );
}
