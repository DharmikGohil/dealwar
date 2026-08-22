import { describe, expect, it } from "vitest";
import { createDealSchema } from "@/lib/validation/deal";

const validDeal = {
  companyName: "Signal Forge",
  companyWebsite: "https://signalforge.example.com",
  productName: "Pulse",
  tagline: "Monitor production incidents without losing context.",
  description: "Pulse gives engineering teams a complete, chronological incident record with clear ownership and durable operational notes.",
  headline: "Get $25 in credit toward any paid plan",
  redemptionUrl: "https://redeem.signalforge.example.com/dealwar",
  terms: "New paid accounts only. Credit expires 30 days after the claim date.",
  creditAmountDollars: 25,
  couponCodes: ["SF-001", "SF-002", "SF-003", "SF-004", "SF-005"],
  accentColor: "#ff4f1f",
  roundId: "cm12345678901234567890123",
};

describe("deal submission validation", () => {
  it("normalizes and accepts a same-company redemption subdomain", () => {
    const parsed = createDealSchema.parse(validDeal);
    expect(parsed.companyWebsite).toBe("https://signalforge.example.com/");
  });

  it("rejects duplicate codes without leaking them", () => {
    const result = createDealSchema.safeParse({ ...validDeal, couponCodes: ["SAME", "same", "A-3", "A-4", "A-5"] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.couponCodes).toContain("Coupon codes must be unique.");
  });

  it("rejects redemption on an unrelated domain", () => {
    const result = createDealSchema.safeParse({ ...validDeal, redemptionUrl: "https://attacker.example/redeem" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.redemptionUrl).toContain("The redemption URL must use the company domain.");
  });
});
