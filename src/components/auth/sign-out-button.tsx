"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return <button className="dashboard-signout" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}><LogOut size={15} /> Sign out</button>;
}
