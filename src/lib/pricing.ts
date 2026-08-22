export const maximumEntryFeeCents = 50_000;

export function calculateEntryFeeCents(poolCents: number | bigint, minimumFeeCents = 1_900) {
  const pool = typeof poolCents === "bigint" ? Number(poolCents) : poolCents;
  if (!Number.isSafeInteger(pool) || pool < 0) {
    throw new RangeError("Pool value must be a non-negative safe integer.");
  }
  return Math.max(minimumFeeCents, Math.min(maximumEntryFeeCents, Math.ceil(pool * 0.02)));
}
