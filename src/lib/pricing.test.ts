import { describe, expect, it } from "vitest";
import { calculateEntryFeeCents, maximumEntryFeeCents } from "@/lib/pricing";

describe("calculateEntryFeeCents", () => {
  it("applies the configured minimum", () => {
    expect(calculateEntryFeeCents(10_000)).toBe(1_900);
  });

  it("charges two percent rounded up", () => {
    expect(calculateEntryFeeCents(100_001)).toBe(2_001);
  });

  it("caps the operational fee", () => {
    expect(calculateEntryFeeCents(10_000_000)).toBe(maximumEntryFeeCents);
  });

  it("accepts bigint pools and rejects unsafe values", () => {
    expect(calculateEntryFeeCents(250_000n)).toBe(5_000);
    expect(() => calculateEntryFeeCents(-1)).toThrow(RangeError);
    expect(() => calculateEntryFeeCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});
