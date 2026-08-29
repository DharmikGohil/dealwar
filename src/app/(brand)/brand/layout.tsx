import { headers } from "next/headers";
import { BrandArenaShell } from "@/components/dashboard/brand-arena-shell";
import { safeReturnPath } from "@/lib/safe-return-path";
import { requireUser } from "@/lib/session";

export default async function BrandArenaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestPath = safeReturnPath((await headers()).get("x-dealwar-pathname"), "/brand");
  const signInPath = `/sign-in?intent=brand&next=${encodeURIComponent(requestPath)}`;
  const user = await requireUser(signInPath);

  return <BrandArenaShell user={user}>{children}</BrandArenaShell>;
}
