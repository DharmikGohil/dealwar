import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiError, assertTrustedOrigin, requestId } from "@/lib/api";
import { requireApiRole } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { env, paymentsConfigured } from "@/lib/env";
import { paymentProvider, refundEntry } from "@/lib/payments/dodo";
import { requestFingerprint } from "@/lib/security";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "pause", "resume"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestIdentifier = requestId(request);
  try {
    assertTrustedOrigin(request);
    const moderator = await requireApiRole(["ADMIN", "MODERATOR"]);
    const { id } = await context.params;
    const input = actionSchema.parse(await request.json());
    const deal = await db.deal.findUnique({
      where: { id },
      include: { product: { include: { organization: true } }, round: true, payments: true },
    });
    if (!deal) throw new ApiError(404, "Deal not found.", "not_found");
    const fingerprint = requestFingerprint(request);

    if (input.action === "approve") {
      if (deal.status !== "PENDING_REVIEW") throw new ApiError(409, "Only entries awaiting review can be approved.", "invalid_transition");
      if (!deal.product.organization.verifiedAt) throw new ApiError(409, "Verify the company domain before approval.", "domain_unverified");
      if (!deal.payments.some((payment) => payment.status === "SUCCEEDED")) throw new ApiError(409, "A successful entry payment is required.", "payment_missing");
      if (deal.availableCount < 1) throw new ApiError(409, "Coupon inventory is empty.", "inventory_empty");
      const now = new Date();
      if (deal.round.endsAt <= now || !["LIVE", "SCHEDULED"].includes(deal.round.status)) {
        throw new ApiError(409, "The competition round is no longer publishable.", "round_closed");
      }
      const nextStatus = deal.round.status === "LIVE" ? "LIVE" : "SCHEDULED";
      await db.$transaction([
        db.product.update({ where: { id: deal.productId }, data: { status: "ACTIVE", rejectionNote: null } }),
        db.deal.update({ where: { id }, data: { status: nextStatus, reviewedAt: now, liveAt: nextStatus === "LIVE" ? now : null } }),
        db.moderationCase.updateMany({ where: { dealId: id, status: "OPEN" }, data: { status: "APPROVED", actorId: moderator.id, notes: input.reason, resolvedAt: now } }),
        db.auditLog.create({ data: { actorId: moderator.id, action: "deal.approved", targetType: "Deal", targetId: id, requestId: requestIdentifier, ipHash: fingerprint.ipHash, metadata: { reason: input.reason } } }),
      ]);
    } else if (input.action === "reject") {
      if (deal.status !== "PENDING_REVIEW") throw new ApiError(409, "Only entries awaiting review can be rejected.", "invalid_transition");
      if (!input.reason) throw new ApiError(422, "A rejection reason is required.", "reason_required");
      const now = new Date();
      const successfulPayment = deal.payments.find((payment) => payment.status === "SUCCEEDED");
      let providerRefundId: string | undefined;
      let refundStatus: "succeeded" | "pending" | "review" | undefined;
      if (successfulPayment && paymentsConfigured) {
        if (successfulPayment.provider !== paymentProvider || !successfulPayment.providerPaymentId) {
          throw new ApiError(409, "The Dodo payment is missing its payment identifier.", "refund_unavailable");
        }
        const refund = await refundEntry({
          paymentId: successfulPayment.providerPaymentId,
          dealId: deal.id,
          reason: `DealWar entry rejected during moderation: ${input.reason}`,
        });
        if (refund.status === "failed") {
          throw new ApiError(502, "Dodo Payments did not accept the rejection refund.", "refund_failed");
        }
        providerRefundId = refund.refund_id;
        refundStatus = refund.status;
      } else if (successfulPayment && env.NODE_ENV === "production") {
        throw new ApiError(503, "Refund processing is temporarily unavailable.", "refund_unavailable");
      }
      await db.$transaction([
        db.product.update({ where: { id: deal.productId }, data: { status: "REJECTED", rejectionNote: input.reason } }),
        db.deal.update({ where: { id }, data: { status: "REJECTED", reviewedAt: now } }),
        ...(successfulPayment ? [db.payment.update({
          where: { id: successfulPayment.id },
          data: {
            ...(refundStatus === "pending" || refundStatus === "review"
              ? { providerRefundId }
              : { status: "REFUNDED" as const, refundedAt: now, providerRefundId }),
          },
        })] : []),
        db.moderationCase.updateMany({ where: { dealId: id, status: "OPEN" }, data: { status: "REJECTED", actorId: moderator.id, notes: input.reason, resolvedAt: now } }),
        db.auditLog.create({ data: { actorId: moderator.id, action: "deal.rejected", targetType: "Deal", targetId: id, requestId: requestIdentifier, ipHash: fingerprint.ipHash, metadata: { reason: input.reason, provider: paymentProvider, providerRefundId, refundStatus } } }),
      ]);
    } else {
      if (input.action === "pause" && !["LIVE", "SCHEDULED"].includes(deal.status)) {
        throw new ApiError(409, "Only published or scheduled deals can be paused.", "invalid_transition");
      }
      if (input.action === "resume" && deal.status !== "PAUSED") {
        throw new ApiError(409, "Only paused deals can be resumed.", "invalid_transition");
      }
      const targetStatus = input.action === "pause" ? "PAUSED" : "LIVE";
      if (input.action === "resume" && (!deal.product.organization.verifiedAt || !deal.payments.some((payment) => payment.status === "SUCCEEDED"))) {
        throw new ApiError(409, "The deal no longer satisfies publication requirements.", "requirements_failed");
      }
      if (input.action === "resume" && (deal.round.status !== "LIVE" || deal.round.endsAt <= new Date())) {
        throw new ApiError(409, "The competition round is not live.", "round_closed");
      }
      await db.$transaction([
        db.deal.update({ where: { id }, data: { status: targetStatus } }),
        db.auditLog.create({ data: { actorId: moderator.id, action: `deal.${input.action}d`, targetType: "Deal", targetId: id, requestId: requestIdentifier, ipHash: fingerprint.ipHash, metadata: { reason: input.reason } } }),
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, requestIdentifier);
  }
}
