import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { NextResponse } from "next/server";
import { ApiError, apiError, requestId } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { keyedHash, requestFingerprint } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: organizationId } = await context.params;
    const { user } = await requireOrganizationAccess(organizationId);
    const organization = await db.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new ApiError(404, "Company not found.", "not_found");
    if (organization.verifiedAt) return NextResponse.json({ verified: true });
    await enforceRateLimit({ key: `domain-create:${user.id}`, limit: 5, windowSeconds: 3600 });
    const token = `dealwar-verification=${randomBytes(24).toString("base64url")}`;
    const hostname = new URL(organization.website).hostname.replace(/^www\./, "");
    await db.domainChallenge.create({
      data: {
        organizationId,
        hostname,
        tokenHash: keyedHash("domain-challenge", token),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    return NextResponse.json({ verified: false, hostname, recordType: "TXT", name: "@", value: token, expiresIn: 86_400 });
  } catch (error) {
    return apiError(error, id);
  }
}

export async function PATCH(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: organizationId } = await context.params;
    const { user } = await requireOrganizationAccess(organizationId);
    const fingerprint = requestFingerprint(request);
    await enforceRateLimit({ key: `domain-check:${user.id}:${fingerprint.ipHash}`, limit: 10, windowSeconds: 3600 });
    const challenges = await db.domainChallenge.findMany({
      where: { organizationId, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    const challenge = challenges[0];
    if (!challenge) throw new ApiError(409, "Create a fresh DNS challenge first.", "challenge_missing");
    let records: string[][];
    try {
      records = await resolveTxt(challenge.hostname);
    } catch {
      throw new ApiError(409, "The verification TXT record is not visible yet.", "dns_not_ready");
    }
    const matching = records
      .map((parts) => parts.join(""))
      .some((value) => keyedHash("domain-challenge", value) === challenge.tokenHash);
    if (!matching) throw new ApiError(409, "The TXT record does not match the active challenge.", "dns_mismatch");
    await db.$transaction([
      db.domainChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } }),
      db.organization.update({ where: { id: organizationId }, data: { verifiedAt: new Date(), verificationMethod: "DNS_TXT" } }),
      db.auditLog.create({ data: { actorId: user.id, action: "organization.domain_verified", targetType: "Organization", targetId: organizationId, requestId: id, ipHash: fingerprint.ipHash } }),
    ]);
    return NextResponse.json({ verified: true });
  } catch (error) {
    return apiError(error, id);
  }
}
