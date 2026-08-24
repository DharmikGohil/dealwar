import { NextResponse } from "next/server";
import { ApiError, apiError, assertTrustedOrigin, requestId } from "@/lib/api";
import { requireApiUser } from "@/lib/api-auth";
import { allocateClaim } from "@/lib/claim-allocation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { decryptCoupon, requestFingerprint } from "@/lib/security";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const id = requestId(request);
  try {
    assertTrustedOrigin(request);
    const user = await requireApiUser();
    if (!user.emailVerified && env.NODE_ENV === "production") {
      throw new ApiError(403, "Verify your email before claiming a deal.", "email_unverified");
    }
    const { slug } = await context.params;
    const fingerprint = requestFingerprint(request);
    await Promise.all([
      enforceRateLimit({ key: `claim-user:${user.id}`, limit: 8, windowSeconds: 86_400 }),
      enforceRateLimit({ key: `claim-ip:${fingerprint.ipHash}`, limit: 12, windowSeconds: 86_400 }),
    ]);
    const idempotencyKey = request.headers.get("idempotency-key") || id;
    if (idempotencyKey.length > 128) {
      throw new ApiError(400, "Invalid idempotency key.", "invalid_idempotency_key");
    }

    const allocated = await allocateClaim({
      slug,
      userId: user.id,
      email: user.email,
      idempotencyKey,
      requestId: id,
      ipHash: fingerprint.ipHash,
      userAgentHash: fingerprint.userAgentHash,
    });

    const revealedCode = decryptCoupon(allocated.coupon);
    if (!allocated.repeated) try {
      await sendEmail({
        to: user.email,
        subject: `Your ${allocated.productName} credit is secured`,
        preview: "Your DealWar claim is ready in your secure account.",
        heading: "Your code is secured.",
        body: `${allocated.headline}\n\nCode: ${revealedCode}\n\nThis code also remains available in My Claims. Company terms apply.`,
        actionLabel: `Redeem at ${allocated.productName}`,
        actionUrl: allocated.redemptionUrl,
      });
    } catch {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "claim.email_delivery_failed",
          targetType: "Claim",
          targetId: allocated.claim.id,
          requestId: id,
        },
      });
    }

    return NextResponse.json(
      {
        claimId: allocated.claim.id,
        code: revealedCode,
        redemptionUrl: allocated.redemptionUrl,
        repeated: allocated.repeated,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, id);
  }
}
