import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keyedHash, requestFingerprint } from "@/lib/security";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const deal = await db.deal.findUnique({
    where: { slug },
    select: { id: true, redemptionUrl: true, status: true },
  });
  if (!deal || deal.status !== "LIVE") return NextResponse.redirect(new URL("/", request.url));
  const fingerprint = requestFingerprint(request);
  await enforceRateLimit({ key: `redirect:${fingerprint.ipHash}`, limit: 180, windowSeconds: 3600 });
  const hour = new Date();
  hour.setMinutes(0, 0, 0);
  const visitorHash = keyedHash("click", `${fingerprint.ipHash}:${fingerprint.userAgentHash}:${hour.toISOString()}`);
  await db.clickEvent.upsert({
    where: { dealId_visitorHash_occurredAt: { dealId: deal.id, visitorHash, occurredAt: hour } },
    create: { dealId: deal.id, visitorHash, destination: deal.redemptionUrl, occurredAt: hour },
    update: {},
  });
  return NextResponse.redirect(deal.redemptionUrl, 302);
}
