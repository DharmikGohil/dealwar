import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import type { GlobalRole } from "@/generated/prisma/client";

export async function requireApiUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ApiError(401, "Authentication required.", "unauthorized");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.banned) throw new ApiError(403, "Account access is restricted.", "forbidden");
  return user;
}

export async function requireApiRole(roles: GlobalRole[]) {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) throw new ApiError(403, "Insufficient permission.", "forbidden");
  return user;
}

export async function requireOrganizationAccess(organizationId: string) {
  const user = await requireApiUser();
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
  if (!membership) throw new ApiError(403, "You do not manage this company.", "forbidden");
  return { user, membership };
}
