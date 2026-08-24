import "server-only";
import type { Payment as DodoPayment } from "dodopayments/resources/payments";
import type { Payment as StoredPayment } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { paymentProvider } from "@/lib/payments/dodo";

function eventDate(value?: string | null) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function recordDodoPaymentSucceeded(
  storedPayment: StoredPayment,
  providerPayment: DodoPayment,
  source: "webhook" | "return_reconciliation",
  webhookId?: string,
) {
  return db.$transaction(async (tx) => {
    const transitioned = await tx.payment.updateMany({
      where: { id: storedPayment.id, status: { in: ["PENDING", "FAILED"] } },
      data: {
        status: "SUCCEEDED",
        paidAt: eventDate(providerPayment.updated_at),
        providerPaymentId: providerPayment.payment_id,
        receiptUrl: providerPayment.invoice_url,
      },
    });

    if (transitioned.count === 0) {
      await tx.payment.updateMany({
        where: { id: storedPayment.id, status: "SUCCEEDED" },
        data: {
          providerPaymentId: providerPayment.payment_id,
          receiptUrl: providerPayment.invoice_url,
        },
      });
      return { transitioned: false };
    }

    await tx.deal.updateMany({
      where: { id: storedPayment.dealId, status: { in: ["PENDING_PAYMENT", "CANCELLED"] } },
      data: { status: "PENDING_REVIEW" },
    });
    await tx.auditLog.create({
      data: {
        action: "payment.succeeded",
        targetType: "Deal",
        targetId: storedPayment.dealId,
        metadata: {
          provider: paymentProvider,
          providerPaymentId: providerPayment.payment_id,
          source,
          webhookId,
        },
      },
    });
    return { transitioned: true };
  });
}

export async function recordDodoPaymentProcessing(storedPayment: StoredPayment, providerPaymentId: string) {
  await db.payment.updateMany({
    where: { id: storedPayment.id, status: "PENDING" },
    data: { providerPaymentId },
  });
}

export async function recordDodoPaymentFailed(
  storedPayment: StoredPayment,
  providerPaymentId: string,
  eventType: "payment.failed" | "payment.cancelled",
  source: "webhook" | "return_reconciliation",
  webhookId?: string,
) {
  return db.$transaction(async (tx) => {
    const transitioned = await tx.payment.updateMany({
      where: { id: storedPayment.id, status: "PENDING" },
      data: { status: "FAILED", providerPaymentId },
    });
    if (transitioned.count === 0) return { transitioned: false };

    await tx.deal.updateMany({
      where: { id: storedPayment.dealId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    });
    await tx.auditLog.create({
      data: {
        action: eventType,
        targetType: "Deal",
        targetId: storedPayment.dealId,
        metadata: {
          provider: paymentProvider,
          providerPaymentId,
          source,
          webhookId,
        },
      },
    });
    return { transitioned: true };
  });
}
