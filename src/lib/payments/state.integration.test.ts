import type { Payment as DodoPayment } from "dodopayments/resources/payments";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { recordDodoPaymentFailed, recordDodoPaymentSucceeded } from "@/lib/payments/state";

const suffix = crypto.randomUUID().slice(0, 8);
let userId = "";
let organizationId = "";
let productId = "";
let roundId = "";
let dealId = "";
let paymentId = "";

function providerPayment(): DodoPayment {
  return {
    payment_id: `provider-${suffix}`,
    invoice_url: `https://example.com/receipt/${suffix}`,
    updated_at: new Date().toISOString(),
  } as DodoPayment;
}

describe("payment state transitions", () => {
  beforeAll(async () => {
    const user = await db.user.create({
      data: { name: "Payment Test", email: `payment-${suffix}@example.com`, emailVerified: true },
    });
    userId = user.id;
    const organization = await db.organization.create({
      data: {
        name: "Payment Test",
        slug: `payment-org-${suffix}`,
        website: "https://example.com",
        billingEmail: user.email,
        createdById: user.id,
      },
    });
    organizationId = organization.id;
    const product = await db.product.create({
      data: {
        organizationId,
        slug: `payment-product-${suffix}`,
        name: "Payment Test",
        tagline: "Payment state test product.",
        description: "Temporary integration-test product for payment state transition checks.",
        websiteUrl: "https://example.com",
        status: "PENDING_REVIEW",
      },
    });
    productId = product.id;
    const round = await db.round.create({
      data: {
        slug: `payment-round-${suffix}`,
        name: "Payment Round",
        strapline: "Integration test",
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 3_600_000),
        status: "LIVE",
      },
    });
    roundId = round.id;
    const deal = await db.deal.create({
      data: {
        productId,
        roundId,
        slug: `payment-deal-${suffix}`,
        headline: "Payment transition test",
        terms: "Integration test only.",
        redemptionUrl: "https://example.com/redeem",
        creditAmountCents: 1000,
        inventoryCount: 1,
        availableCount: 1,
        scoreCents: 1000n,
        entryFeeCents: 1900,
        status: "PENDING_PAYMENT",
        endsAt: round.endsAt,
      },
    });
    dealId = deal.id;
    const payment = await db.payment.create({
      data: { dealId, provider: "dodo", amountCents: 1900, status: "PENDING" },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    if (dealId) await db.auditLog.deleteMany({ where: { targetId: dealId } });
    if (paymentId) await db.payment.deleteMany({ where: { id: paymentId } });
    if (dealId) await db.deal.deleteMany({ where: { id: dealId } });
    if (productId) await db.product.deleteMany({ where: { id: productId } });
    if (organizationId) await db.organization.deleteMany({ where: { id: organizationId } });
    if (roundId) await db.round.deleteMany({ where: { id: roundId } });
    if (userId) await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("promotes a paid deal exactly once and never regresses a terminal refund", async () => {
    const stored = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const first = await recordDodoPaymentSucceeded(stored, providerPayment(), "webhook", "event-success");
    const second = await recordDodoPaymentSucceeded(stored, providerPayment(), "webhook", "event-success-copy");
    expect(first.transitioned).toBe(true);
    expect(second.transitioned).toBe(false);

    let payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const deal = await db.deal.findUniqueOrThrow({ where: { id: dealId } });
    expect(payment.status).toBe("SUCCEEDED");
    expect(deal.status).toBe("PENDING_REVIEW");
    expect(await db.auditLog.count({ where: { targetId: dealId, action: "payment.succeeded" } })).toBe(1);

    await db.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED", refundedAt: new Date() } });
    await recordDodoPaymentSucceeded(stored, providerPayment(), "webhook", "event-late-success");
    payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment.status).toBe("REFUNDED");
  });

  it("records a cancelled checkout once and allows a later confirmed success", async () => {
    await db.payment.update({
      where: { id: paymentId },
      data: { status: "PENDING", refundedAt: null, paidAt: null, providerPaymentId: null, receiptUrl: null },
    });
    await db.deal.update({ where: { id: dealId }, data: { status: "PENDING_PAYMENT" } });
    const stored = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const failed = await recordDodoPaymentFailed(
      stored,
      `provider-${suffix}`,
      "payment.cancelled",
      "webhook",
      "event-cancelled",
    );
    const duplicate = await recordDodoPaymentFailed(
      stored,
      `provider-${suffix}`,
      "payment.cancelled",
      "webhook",
      "event-cancelled-copy",
    );
    expect(failed.transitioned).toBe(true);
    expect(duplicate.transitioned).toBe(false);
    expect((await db.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe("FAILED");
    expect((await db.deal.findUniqueOrThrow({ where: { id: dealId } })).status).toBe("CANCELLED");

    await recordDodoPaymentSucceeded(stored, providerPayment(), "webhook", "event-eventual-success");
    expect((await db.payment.findUniqueOrThrow({ where: { id: paymentId } })).status).toBe("SUCCEEDED");
    expect((await db.deal.findUniqueOrThrow({ where: { id: dealId } })).status).toBe("PENDING_REVIEW");
  });
});
