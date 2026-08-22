import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { Payment } from "dodopayments/resources/payments";
import { db } from "@/lib/db";
import { env, paymentsConfigured } from "@/lib/env";
import { dodo, paymentProvider } from "@/lib/payments/dodo";

export const runtime = "nodejs";

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : null;
}

async function resolveStoredPayment(payment: Payment) {
  const internalPaymentId = metadataString(payment.metadata, "dealwar_payment_id");
  if (internalPaymentId) return db.payment.findUnique({ where: { id: internalPaymentId } });
  if (payment.checkout_session_id) {
    return db.payment.findUnique({ where: { providerSessionId: payment.checkout_session_id } });
  }
  return db.payment.findUnique({ where: { providerPaymentId: payment.payment_id } });
}

async function validateSucceededPayment(payment: Payment) {
  if (!dodo || !env.DODO_PAYMENTS_PRODUCT_ID) throw new Error("Dodo Payments is not configured.");
  const storedPayment = await resolveStoredPayment(payment);
  if (!storedPayment || storedPayment.provider !== paymentProvider) {
    throw new Error("Payment does not match a DealWar order.");
  }
  const dealId = metadataString(payment.metadata, "dealwar_deal_id");
  const expectedAmount = metadataString(payment.metadata, "dealwar_expected_amount_cents");
  if (
    !dealId ||
    dealId !== storedPayment.dealId ||
    expectedAmount !== String(storedPayment.amountCents) ||
    payment.status !== "succeeded" ||
    (payment.checkout_session_id && storedPayment.providerSessionId !== payment.checkout_session_id)
  ) {
    throw new Error("Payment metadata, state, or checkout session is invalid.");
  }
  if (
    !payment.product_cart?.some(
      (item) => item.product_id === env.DODO_PAYMENTS_PRODUCT_ID && item.quantity === 1,
    )
  ) {
    throw new Error("Payment does not contain the configured DealWar entry product.");
  }

  const lineItems = await dodo.payments.retrieveLineItems(payment.payment_id);
  const entryItem = lineItems.items.find((item) => item.items_id === env.DODO_PAYMENTS_PRODUCT_ID);
  const amountBeforeExclusiveTax = entryItem ? entryItem.amount - entryItem.tax : -1;
  if (
    lineItems.currency !== "USD" ||
    lineItems.items.length !== 1 ||
    !entryItem ||
    (entryItem.amount !== storedPayment.amountCents && amountBeforeExclusiveTax !== storedPayment.amountCents)
  ) {
    throw new Error("Payment currency or line-item amount does not match the DealWar order.");
  }
  return storedPayment;
}

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
    where: { id: stored.id, status: { in: ["RECEIVED", "FAILED"] } },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });
  if (lock.count === 0) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type === "payment.succeeded") {
      const storedPayment = await validateSucceededPayment(event.data);
      await db.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: storedPayment.id },
          data: {
            status: "SUCCEEDED",
            paidAt: new Date(event.data.updated_at || event.timestamp),
            providerPaymentId: event.data.payment_id,
            receiptUrl: event.data.invoice_url,
          },
        });
        await tx.deal.updateMany({
          where: { id: storedPayment.dealId, status: { in: ["PENDING_PAYMENT", "CANCELLED"] } },
          data: { status: "PENDING_REVIEW" },
        });
        await tx.auditLog.create({
          data: {
            action: "payment.succeeded",
            targetType: "Deal",
            targetId: storedPayment.dealId,
            metadata: { provider: paymentProvider, webhookId, providerPaymentId: event.data.payment_id },
          },
        });
      });
    } else if (event.type === "payment.processing") {
      const storedPayment = await resolveStoredPayment(event.data);
      if (storedPayment?.status === "PENDING") {
        await db.payment.update({
          where: { id: storedPayment.id },
          data: { providerPaymentId: event.data.payment_id },
        });
      }
    } else if (event.type === "payment.failed" || event.type === "payment.cancelled") {
      const storedPayment = await resolveStoredPayment(event.data);
      if (storedPayment?.status === "PENDING") {
        await db.$transaction([
          db.payment.update({
            where: { id: storedPayment.id },
            data: { status: "FAILED", providerPaymentId: event.data.payment_id },
          }),
          db.deal.updateMany({
            where: { id: storedPayment.dealId, status: "PENDING_PAYMENT" },
            data: { status: "CANCELLED" },
          }),
          db.auditLog.create({
            data: {
              action: event.type === "payment.failed" ? "payment.failed" : "payment.cancelled",
              targetType: "Deal",
              targetId: storedPayment.dealId,
              metadata: { provider: paymentProvider, webhookId, providerPaymentId: event.data.payment_id },
            },
          }),
        ]);
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
    } else if (event.type === "dispute.opened" || event.type === "dispute.accepted" || event.type === "dispute.lost") {
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
