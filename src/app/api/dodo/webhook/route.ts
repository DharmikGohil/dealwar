import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env, paymentsConfigured } from "@/lib/env";
import { dodo, paymentProvider } from "@/lib/payments/dodo";
import { resolveStoredPayment, validateDodoSucceededPayment } from "@/lib/payments/reconciliation";
import {
  recordDodoPaymentFailed,
  recordDodoPaymentProcessing,
  recordDodoPaymentSucceeded,
} from "@/lib/payments/state";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!paymentsConfigured || !dodo || !env.DODO_PAYMENTS_WEBHOOK_KEY) {
    return NextResponse.json({ error: "Dodo Payments is not configured." }, { status: 503 });
  }
  const webhookId = request.headers.get("webhook-id");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json({ error: "Missing webhook signature headers." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  if (event.business_id !== env.DODO_PAYMENTS_BUSINESS_ID) {
    return NextResponse.json({ error: "Webhook business does not match." }, { status: 403 });
  }

  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const stored = await db.webhookEvent.upsert({
    where: { provider_externalId: { provider: paymentProvider, externalId: webhookId } },
    create: { provider: paymentProvider, externalId: webhookId, eventType: event.type, payloadHash },
    update: {},
  });
  if (stored.payloadHash !== payloadHash || stored.eventType !== event.type) {
    return NextResponse.json({ error: "Webhook identifier was reused with different content." }, { status: 409 });
  }
  const lock = await db.webhookEvent.updateMany({
    where: {
      id: stored.id,
      OR: [
        { status: { in: ["RECEIVED", "FAILED"] } },
        { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 60_000) } },
      ],
    },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });
  if (lock.count === 0) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "payment.succeeded") {
      const storedPayment = await validateDodoSucceededPayment(event.data);
      await recordDodoPaymentSucceeded(storedPayment, event.data, "webhook", webhookId);
    } else if (event.type === "payment.processing") {
      const storedPayment = await resolveStoredPayment(event.data);
      if (storedPayment) await recordDodoPaymentProcessing(storedPayment, event.data.payment_id);
    } else if (event.type === "payment.failed" || event.type === "payment.cancelled") {
      const storedPayment = await resolveStoredPayment(event.data);
      if (storedPayment) {
        await recordDodoPaymentFailed(storedPayment, event.data.payment_id, event.type, "webhook", webhookId);
      }
    } else if (event.type === "refund.succeeded") {
      const storedPayment = await db.payment.findUnique({ where: { providerPaymentId: event.data.payment_id } });
      if (storedPayment) {
        await db.$transaction([
          db.payment.update({
            where: { id: storedPayment.id },
            data: {
              status: event.data.is_partial ? "PARTIALLY_REFUNDED" : "REFUNDED",
              refundedAt: event.data.is_partial ? null : new Date(event.timestamp),
              providerRefundId: event.data.refund_id,
            },
          }),
          db.deal.updateMany({
            where: { id: storedPayment.dealId, status: { notIn: ["REJECTED", "CANCELLED", "ENDED"] } },
            data: { status: "PAUSED" },
          }),
          db.auditLog.create({
            data: {
              action: event.data.is_partial ? "payment.partially_refunded" : "payment.refunded",
              targetType: "Deal",
              targetId: storedPayment.dealId,
              metadata: { provider: paymentProvider, webhookId, refundId: event.data.refund_id, amount: event.data.amount },
            },
          }),
        ]);
      }
    } else if (event.type === "refund.failed") {
      const storedPayment = await db.payment.findUnique({ where: { providerPaymentId: event.data.payment_id } });
      if (storedPayment) {
        await db.$transaction([
          db.payment.update({
            where: { id: storedPayment.id },
            data: { providerRefundId: event.data.refund_id },
          }),
          db.auditLog.create({
            data: {
              action: "payment.refund_failed",
              targetType: "Deal",
              targetId: storedPayment.dealId,
              metadata: {
                provider: paymentProvider,
                webhookId,
                refundId: event.data.refund_id,
                reason: event.data.reason,
              },
            },
          }),
        ]);
      }
    } else if (
      event.type === "dispute.opened" ||
      event.type === "dispute.expired" ||
      event.type === "dispute.accepted" ||
      event.type === "dispute.challenged" ||
      event.type === "dispute.lost"
    ) {
      const storedPayment = await db.payment.findUnique({ where: { providerPaymentId: event.data.payment_id } });
      if (storedPayment) {
        await db.$transaction([
          db.payment.update({ where: { id: storedPayment.id }, data: { status: "DISPUTED" } }),
          db.deal.updateMany({
            where: { id: storedPayment.dealId, status: { notIn: ["REJECTED", "CANCELLED", "ENDED"] } },
            data: { status: "PAUSED" },
          }),
          db.auditLog.create({
            data: {
              action: event.type,
              targetType: "Deal",
              targetId: storedPayment.dealId,
              metadata: { provider: paymentProvider, webhookId, disputeId: event.data.dispute_id },
            },
          }),
        ]);
      }
    } else if (event.type === "dispute.cancelled" || event.type === "dispute.won") {
      const storedPayment = await db.payment.findUnique({ where: { providerPaymentId: event.data.payment_id } });
      if (storedPayment?.status === "DISPUTED") {
        await db.$transaction([
          db.payment.update({ where: { id: storedPayment.id }, data: { status: "SUCCEEDED" } }),
          db.deal.updateMany({
            where: { id: storedPayment.dealId, status: "PAUSED" },
            data: { status: "PENDING_REVIEW" },
          }),
          db.auditLog.create({
            data: {
              action: event.type,
              targetType: "Deal",
              targetId: storedPayment.dealId,
              metadata: { provider: paymentProvider, webhookId, disputeId: event.data.dispute_id },
            },
          }),
        ]);
      }
    }

    await db.webhookEvent.update({
      where: { id: stored.id },
      data: { status: "PROCESSED", processedAt: new Date(), lastError: null },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    await db.webhookEvent.update({
      where: { id: stored.id },
      data: { status: "FAILED", lastError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error" },
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
