import { describe, expect, it } from "vitest";
import { couponHash, decryptCoupon, encryptCoupon, secureEquals } from "@/lib/security";

describe("coupon protection", () => {
  it("round-trips with randomized authenticated encryption", () => {
    const first = encryptCoupon("DW-SECRET-42");
    const second = encryptCoupon("DW-SECRET-42");
    expect(first.encryptedCode).not.toBe(second.encryptedCode);
    expect(decryptCoupon(first)).toBe("DW-SECRET-42");
    expect(decryptCoupon(second)).toBe("DW-SECRET-42");
  });

  it("rejects modified ciphertext", () => {
    const protectedCode = encryptCoupon("DW-DO-NOT-TAMPER");
    const bytes = Buffer.from(protectedCode.encryptedCode, "base64url");
    bytes[0] = (bytes[0] ?? 0) ^ 1;
    expect(() => decryptCoupon({ ...protectedCode, encryptedCode: bytes.toString("base64url") })).toThrow();
  });

  it("uses scoped, case-normalized hashes and constant-time equality", () => {
    expect(couponHash(" CODE-1 ")).toBe(couponHash("code-1"));
    expect(secureEquals("same", "same")).toBe(true);
    expect(secureEquals("same", "different")).toBe(false);
  });
});
