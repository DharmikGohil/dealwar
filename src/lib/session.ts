import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { GlobalRole } from "@/generated/prisma/client";

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      banned: true,
    },
  });
  if (!user || user.banned) return null;
  return user;
}

export async function requireUser(signInPath = "/sign-in") {
  const user = await getCurrentUser();
  if (!user) redirect(signInPath);
  return user;
}

export async function requireRole(roles: GlobalRole[], signInPath = "/sign-in") {
  const user = await requireUser(signInPath);
  if (!user.emailVerified) redirect("/my-deals");
  if (!roles.includes(user.role)) redirect("/my-deals");
  return user;
}
