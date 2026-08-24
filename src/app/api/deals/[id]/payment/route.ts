import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiError, assertTrustedOrigin, requestId } from "@/lib/api";
import { requireOrganizationAccess } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { paymentsActive } from "@/lib/env";
import { createEntryCheckout, paymentProvider } from "@/lib/payments/dodo";
import { reconcileDodoPayment } from "@/lib/payments/reconciliation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestFingerprint } from "@/lib/security";

export const runtime = "nodejs";

const paymentActionSchema = z.object({
  action: z.enum(["reconcile", "checkout"]),
});

async function ownedDeal(id: string) {
  const deal = await db.deal.findUnique({
    where: { id },
    include: {
      product: { include: { organization: true } },
      round: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!deal) throw new ApiError(404, "Deal not found.", "not_found");
  const access = await requireOrganizationAccess(deal.product.organizationId);
  return { deal, ...access };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = requestId(request);
  try {
    assertTrustedOrigin(request);
    if (!paymentsActive) {
      throw new ApiError(503, "Payments are temporarily unavailable.", "payments_unavailable");
    }

    const { id: dealId } = await params;
    const { action } = paymentActionSchema.parse(await request.json());
    const { deal, user } = await ownedDeal(dealId);
    const latestPayment = deal.payments[0];
    const successfulPayment = deal.payments.find((payment) => payment.status === "SUCCEEDED");

    if (successfulPayment) {
      return NextResponse.json({ status: "succeeded", receiptUrl: successfulPayment.receiptUrl });
    }
    if (action === "reconcile") {
      if (!latestPayment || latestPayment.provider !== paymentProvider || !latestPayment.providerSessionId) {
        return NextResponse.json({ status: latestPayment?.status.toLowerCase() || "unpaid" });
      }
      const result = await reconcileDodoPayment(latestPayment);
      return NextResponse.json(result);
    }

    const fingerprint = requestFingerprint(request);
    await enforceRateLimit({
      key: `payment-checkout:${user.id}:${fingerprint.ipHash}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!['SCHEDULED', 'LIVE'].includes(deal.round.status) || deal.round.endsAt <= new Date()) {
      throw new ApiError(409, "This competition round is no longer accepting payment.", "round_closed");
    }
    if (!["PENDING_PAYMENT", "CANCELLED"].includes(deal.status)) {
      throw new ApiError(409, "This deal is not awaiting payment.", "invalid_deal_state");
    }

    let reusable = deal.payments.find(
      (payment) => payment.provider === paymentProvider && payment.status === "PENDING",
    );
    if (reusable?.providerSessionId) {
      const reconciled = await reconcileDodoPayment(reusable);
      if (reconciled.status === "succeeded" || reconciled.status === "processing") {
        return NextResponse.json(reconciled);
      }
    }

    let createdNew = false;
    if (!reusable) {
      reusable = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Deal" WHERE "id" = ${deal.id} FOR UPDATE`;
        const existing = await tx.payment.findFirst({
          where: { dealId: deal.id, status: { in: ["PENDING", "SUCCEEDED"] } },
          orderBy: { createdAt: "desc" },
        });
        if (existing?.status === "SUCCEEDED") return existing;
        if (existing) return existing;

        createdNew = true;
        const payment = await tx.payment.create({
          data: {
            dealId: deal.id,
            provider: paymentProvider,
            amountCents: deal.entryFeeCents,
            currency: "usd",
          },
        });
        await tx.deal.update({ where: { id: deal.id }, data: { status: "PENDING_PAYMENT" } });
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "payment.checkout_retried",
            targetType: "Deal",
            targetId: deal.id,
            requestId: id,
            ipHash: fingerprint.ipHash,
            metadata: { provider: paymentProvider, paymentId: payment.id },
          },
        });
        return payment;
      });
    }
    if (reusable.status === "SUCCEEDED") {
      return NextResponse.json({ status: "succeeded", receiptUrl: reusable.receiptUrl });
    }

    const hadSession = Boolean(reusable.providerSessionId);
    try {
      const checkout = await createEntryCheckout({
        dealId: deal.id,
        paymentId: reusable.id,
        userId: user.id,
        customerEmail: user.email,
        customerName: user.name,
        amountCents: reusable.amountCents,
      });
      if (!checkout.checkout_url) throw new Error("Dodo checkout did not return a secure URL.");
      await db.payment.updateMany({
        where: { id: reusable.id, status: "PENDING" },
        data: { providerSessionId: checkout.session_id },
      });
      return NextResponse.json({ status: "pending", checkoutUrl: checkout.checkout_url });
    } catch (error) {
      console.error("Dodo retry checkout creation failed", { error, requestId: id, dealId: deal.id });
      if (createdNew || !hadSession) {
        await db.$transaction([
          db.payment.updateMany({
            where: { id: reusable.id, status: "PENDING" },
            data: { status: "FAILED" },
          }),
          db.deal.updateMany({
            where: { id: deal.id, status: "PENDING_PAYMENT" },
            data: { status: "CANCELLED" },
          }),
          db.auditLog.create({
            data: {
              actorId: user.id,
              action: "payment.checkout_failed",
              targetType: "Deal",
              targetId: deal.id,
              requestId: id,
              ipHash: fingerprint.ipHash,
              metadata: { provider: paymentProvider, paymentId: reusable.id },
            },
          }),
        ]);
      }
      throw new ApiError(502, "Secure checkout could not be started. Please try again.", "checkout_unavailable");
    }
  } catch (error) {
    return apiError(error, id);
  }
}
