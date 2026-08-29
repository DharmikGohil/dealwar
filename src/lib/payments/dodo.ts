import "server-only";
import DodoPayments from "dodopayments";
import type { CheckoutSessionCreateParams } from "dodopayments/resources/checkout-sessions";
import { env } from "@/lib/env";
export { requiredDodoWebhookEvents } from "@/lib/payments/config";

export const paymentProvider = "dodo" as const;

export const dodo = env.DODO_PAYMENTS_API_KEY
  ? new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
      environment: env.DODO_PAYMENTS_ENVIRONMENT,
      maxRetries: 2,
      timeout: 15_000,
    })
  : null;

export function requireDodo() {
  if (!dodo || !env.DODO_PAYMENTS_PRODUCT_ID) {
    throw new Error("Dodo Payments is not configured.");
  }
  return dodo;
}

export type EntryCheckoutInput = {
  dealId: string;
  paymentId: string;
  userId: string;
  customerEmail: string;
  customerName?: string | null;
  amountCents: number;
};

export function buildEntryCheckoutPayload(input: EntryCheckoutInput): CheckoutSessionCreateParams {
  return {
    product_cart: [
      {
        product_id: env.DODO_PAYMENTS_PRODUCT_ID!,
        quantity: 1,
        amount: input.amountCents,
      },
    ],
    customer: {
      email: input.customerEmail,
      name: input.customerName || undefined,
    },
    billing_currency: "USD",
    feature_flags: {
      allow_currency_selection: false,
      allow_discount_code: false,
      allow_customer_editing_email: false,
      redirect_immediately: true,
    },
    metadata: {
      dealwar_deal_id: input.dealId,
      dealwar_payment_id: input.paymentId,
      dealwar_user_id: input.userId,
      dealwar_expected_amount_cents: String(input.amountCents),
    },
    return_url: `${env.NEXT_PUBLIC_APP_URL}/brand/entries/${input.dealId}?payment=return`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/brand/entries/${input.dealId}?payment=cancelled`,
    short_link: false,
    show_saved_payment_methods: false,
  };
}

export async function createEntryCheckout(input: EntryCheckoutInput) {
  const client = requireDodo();
  return client.checkoutSessions.create(
    buildEntryCheckoutPayload(input),
    { idempotencyKey: `deal-entry:${input.paymentId}` },
  );
}

export async function refundEntry(input: {
  paymentId: string;
  dealId: string;
  reason: string;
}) {
  return requireDodo().refunds.create(
    {
      payment_id: input.paymentId,
      reason: input.reason,
      metadata: { deal_id: input.dealId, reason_code: "moderation_rejected" },
    },
    { idempotencyKey: `moderation-rejection:${input.dealId}` },
  );
}
