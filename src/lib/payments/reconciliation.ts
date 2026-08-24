import "server-only";
import type { Payment as DodoPayment } from "dodopayments/resources/payments";
import type { Payment as StoredPayment } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { dodo, paymentProvider, requireDodo } from "@/lib/payments/dodo";
import {
  recordDodoPaymentFailed,
  recordDodoPaymentProcessing,
  recordDodoPaymentSucceeded,
} from "@/lib/payments/state";

export function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : null;
}

export async function resolveStoredPayment(payment: DodoPayment) {
  const internalPaymentId = metadataString(payment.metadata, "dealwar_payment_id");
  if (internalPaymentId) return db.payment.findUnique({ where: { id: internalPaymentId } });
  if (payment.checkout_session_id) {
    return db.payment.findUnique({ where: { providerSessionId: payment.checkout_session_id } });
  }
  return db.payment.findUnique({ where: { providerPaymentId: payment.payment_id } });
}

export async function validateDodoSucceededPayment(payment: DodoPayment, expected?: StoredPayment) {
  if (!dodo || !env.DODO_PAYMENTS_PRODUCT_ID || !env.DODO_PAYMENTS_BUSINESS_ID) {
    throw new Error("Dodo Payments is not configured.");
  }
  const storedPayment = expected || await resolveStoredPayment(payment);
  if (!storedPayment || storedPayment.provider !== paymentProvider) {
    throw new Error("Payment does not match a DealWar order.");
  }
  const dealId = metadataString(payment.metadata, "dealwar_deal_id");
  const internalPaymentId = metadataString(payment.metadata, "dealwar_payment_id");
  const expectedAmount = metadataString(payment.metadata, "dealwar_expected_amount_cents");
  if (
    payment.business_id !== env.DODO_PAYMENTS_BUSINESS_ID ||
    !dealId ||
    dealId !== storedPayment.dealId ||
    internalPaymentId !== storedPayment.id ||
    expectedAmount !== String(storedPayment.amountCents) ||
    payment.status !== "succeeded" ||
    (payment.checkout_session_id && storedPayment.providerSessionId !== payment.checkout_session_id)
  ) {
    throw new Error("Payment metadata, state, business, or checkout session is invalid.");
  }
  if (
    payment.product_cart?.length !== 1 ||
    payment.product_cart[0]?.product_id !== env.DODO_PAYMENTS_PRODUCT_ID ||
    payment.product_cart[0]?.quantity !== 1
  ) {
    throw new Error("Payment does not contain exactly one DealWar entry product.");
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

export async function reconcileDodoPayment(storedPayment: StoredPayment) {
  if (!storedPayment.providerSessionId) {
    throw new Error("The checkout session has not been created yet.");
  }
  const client = requireDodo();
  const checkout = await client.checkoutSessions.retrieve(storedPayment.providerSessionId);
  if (!checkout.payment_id || !checkout.payment_status) {
    return { status: storedPayment.status.toLowerCase(), transitioned: false };
  }

  if (checkout.payment_status === "succeeded") {
    const providerPayment = await client.payments.retrieve(checkout.payment_id);
    const validated = await validateDodoSucceededPayment(providerPayment, storedPayment);
    const result = await recordDodoPaymentSucceeded(validated, providerPayment, "return_reconciliation");
    return { status: "succeeded", ...result };
  }
  if (checkout.payment_status === "failed" || checkout.payment_status === "cancelled") {
    const eventType = checkout.payment_status === "failed" ? "payment.failed" : "payment.cancelled";
    const result = await recordDodoPaymentFailed(
      storedPayment,
      checkout.payment_id,
      eventType,
      "return_reconciliation",
    );
    return { status: checkout.payment_status, ...result };
  }

  await recordDodoPaymentProcessing(storedPayment, checkout.payment_id);
  return { status: "processing", transitioned: false };
}
