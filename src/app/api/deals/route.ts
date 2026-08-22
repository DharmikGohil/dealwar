import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError, apiError, requestId } from "@/lib/api";
import { requireApiUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { env, paymentsActive } from "@/lib/env";
import { createEntryCheckout, paymentProvider } from "@/lib/payments/dodo";
import { enforceRateLimit } from "@/lib/rate-limit";
import { calculateEntryFeeCents } from "@/lib/pricing";
import { couponHash, encryptCoupon, requestFingerprint } from "@/lib/security";
import { slugify } from "@/lib/slug";
import { assertOwnedLogoExists } from "@/lib/storage";
import { createDealSchema } from "@/lib/validation/deal";

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    if (!paymentsActive && env.NODE_ENV === "production") {
      throw new ApiError(503, "Company entries are temporarily unavailable.", "payments_unavailable");
    }
    const user = await requireApiUser();
    if (!user.emailVerified && env.NODE_ENV === "production") {
      throw new ApiError(403, "Verify your email before submitting a deal.", "email_unverified");
    }

    const fingerprint = requestFingerprint(request);
    await enforceRateLimit({ key: `deal-submit:${fingerprint.ipHash}`, limit: 5, windowSeconds: 3600 });
    const input = createDealSchema.parse(await request.json());
    if (input.logoUrl && !(await assertOwnedLogoExists(input.logoUrl, user.id))) {
      throw new ApiError(400, "The company logo was not uploaded by this account.", "invalid_logo");
    }
    const round = await db.round.findUnique({ where: { id: input.roundId } });
    if (!round || !["SCHEDULED", "LIVE"].includes(round.status)) {
      throw new ApiError(409, "That competition round is not accepting entries.", "round_closed");
    }
    if (round.endsAt <= new Date()) {
      throw new ApiError(409, "That competition round has ended.", "round_ended");
    }

    const scoreCents = BigInt(input.creditAmountDollars * 100) * BigInt(input.couponCodes.length);
    const entryFeeCents = calculateEntryFeeCents(scoreCents, env.DEAL_ENTRY_FEE_CENTS);
    const suffix = randomBytes(3).toString("hex");
    const productSlug = `${slugify(input.productName)}-${suffix}`;
    const dealSlug = `${productSlug}-${round.slug}`;
    const organizationSlug = `${slugify(input.companyName)}-${suffix}`;

    const created = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.companyName,
          slug: organizationSlug,
          website: input.companyWebsite,
          billingEmail: user.email,
          createdById: user.id,
          memberships: {
            create: { userId: user.id, role: "OWNER" },
          },
        },
      });
      const product = await tx.product.create({
        data: {
          organizationId: organization.id,
          slug: productSlug,
          name: input.productName,
          tagline: input.tagline,
          description: input.description,
          websiteUrl: input.companyWebsite,
          accentColor: input.accentColor,
          logoUrl: input.logoUrl,
          status: "PENDING_REVIEW",
        },
      });
      const deal = await tx.deal.create({
        data: {
          productId: product.id,
          roundId: round.id,
          slug: dealSlug,
          headline: input.headline,
          terms: input.terms,
          redemptionUrl: input.redemptionUrl,
          creditAmountCents: input.creditAmountDollars * 100,
          inventoryCount: input.couponCodes.length,
          availableCount: input.couponCodes.length,
          scoreCents,
          entryFeeCents,
          endsAt: round.endsAt,
          status: paymentsActive ? "PENDING_PAYMENT" : "PENDING_REVIEW",
          coupons: {
            create: input.couponCodes.map((code) => ({
              codeHash: couponHash(code),
              ...encryptCoupon(code),
            })),
          },
          moderationCases: { create: { status: "OPEN" } },
        },
      });
      const payment = await tx.payment.create({
        data: {
          dealId: deal.id,
          provider: paymentProvider,
          amountCents: entryFeeCents,
          status: paymentsActive ? "PENDING" : "SUCCEEDED",
          paidAt: paymentsActive ? null : new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "deal.created",
          targetType: "Deal",
          targetId: deal.id,
          requestId: id,
          ipHash: fingerprint.ipHash,
          metadata: { roundId: round.id, scoreCents: scoreCents.toString(), inventory: input.couponCodes.length },
        },
      });
      return { organization, deal, payment };
    });

    if (!paymentsActive) {
      return NextResponse.json({
        dealId: created.deal.id,
        status: "pending_review",
      });
    }

    let checkout;
    try {
      checkout = await createEntryCheckout({
        dealId: created.deal.id,
        paymentId: created.payment.id,
        userId: user.id,
        customerEmail: user.email,
        customerName: user.name,
        amountCents: entryFeeCents,
      });
      if (!checkout.checkout_url) throw new Error("Dodo checkout did not return a secure URL.");
    } catch (checkoutError) {
      console.error("Dodo checkout creation failed", { error: checkoutError, requestId: id });
      await db.$transaction([
        db.payment.update({ where: { id: created.payment.id }, data: { status: "FAILED" } }),
        db.deal.update({ where: { id: created.deal.id }, data: { status: "CANCELLED" } }),
        db.auditLog.create({
          data: {
            actorId: user.id,
            action: "payment.checkout_failed",
            targetType: "Deal",
            targetId: created.deal.id,
            requestId: id,
            ipHash: fingerprint.ipHash,
            metadata: { provider: paymentProvider },
          },
        }),
      ]);
      throw new ApiError(502, "Payment checkout could not be started. Please try again.", "checkout_unavailable");
    }
    await db.payment.update({
      where: { id: created.payment.id },
      data: { providerSessionId: checkout.session_id },
    });

    return NextResponse.json({
      dealId: created.deal.id,
      checkoutUrl: checkout.checkout_url,
    });
  } catch (error) {
    return apiError(error, id);
  }
}
