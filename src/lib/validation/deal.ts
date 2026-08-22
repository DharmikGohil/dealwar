import { z } from "zod";
import { publicUrlSchema } from "@/lib/urls";

const couponCode = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[\x21-\x7E]+$/, "Codes may only contain visible ASCII characters.");

export const createDealSchema = z
  .object({
    companyName: z.string().trim().min(2).max(80),
    companyWebsite: publicUrlSchema,
    productName: z.string().trim().min(2).max(64),
    tagline: z.string().trim().min(10).max(120),
    description: z.string().trim().min(40).max(1000),
    headline: z.string().trim().min(8).max(100),
    redemptionUrl: publicUrlSchema,
    terms: z.string().trim().min(20).max(2000),
    creditAmountDollars: z.coerce.number().int().min(1).max(10_000),
    couponCodes: z.array(couponCode).min(5).max(10_000),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#FF4F1F"),
    logoUrl: z.url().max(2048).optional(),
    roundId: z.string().cuid(),
  })
  .superRefine((input, context) => {
    const normalized = input.couponCodes.map((code) => code.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      context.addIssue({
        code: "custom",
        path: ["couponCodes"],
        message: "Coupon codes must be unique.",
      });
    }
    const companyHost = new URL(input.companyWebsite).hostname.replace(/^www\./, "");
    const redemptionHost = new URL(input.redemptionUrl).hostname.replace(/^www\./, "");
    if (companyHost !== redemptionHost && !redemptionHost.endsWith(`.${companyHost}`)) {
      context.addIssue({
        code: "custom",
        path: ["redemptionUrl"],
        message: "The redemption URL must use the company domain.",
      });
    }
  });

export type CreateDealInput = z.infer<typeof createDealSchema>;
