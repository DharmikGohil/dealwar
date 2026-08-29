import { describe, expect, it } from "vitest";
import { buildEntryCheckoutPayload, requiredDodoWebhookEvents } from "@/lib/payments/dodo";

describe("Dodo entry checkout", () => {
  it("locks checkout to the server-calculated USD amount", () => {
    const checkout = buildEntryCheckoutPayload({
      dealId: "deal_123",
      paymentId: "payment_123",
      userId: "user_123",
      customerEmail: "buyer@example.com",
      customerName: "Buyer",
      amountCents: 3750,
    });

    expect(checkout.product_cart).toHaveLength(1);
    expect(checkout.product_cart[0]).toMatchObject({ quantity: 1, amount: 3750 });
    expect(checkout.billing_currency).toBe("USD");
    expect(checkout.feature_flags).toMatchObject({
      allow_currency_selection: false,
      allow_discount_code: false,
      allow_customer_editing_email: false,
      redirect_immediately: true,
    });
    expect(checkout.metadata).toMatchObject({
      dealwar_deal_id: "deal_123",
      dealwar_payment_id: "payment_123",
      dealwar_user_id: "user_123",
      dealwar_expected_amount_cents: "3750",
    });
    expect(checkout.return_url).toContain("/brand/entries/deal_123?payment=return");
    expect(checkout.cancel_url).toContain("/brand/entries/deal_123?payment=cancelled");
  });

  it("subscribes to every payment, refund, and dispute state DealWar handles", () => {
    expect(requiredDodoWebhookEvents).toEqual(expect.arrayContaining([
      "payment.succeeded",
      "payment.failed",
      "payment.processing",
      "payment.cancelled",
      "refund.succeeded",
      "refund.failed",
      "dispute.opened",
      "dispute.expired",
      "dispute.accepted",
      "dispute.cancelled",
      "dispute.challenged",
      "dispute.won",
      "dispute.lost",
    ]));
  });
});
