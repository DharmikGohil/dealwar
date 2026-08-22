-- Domain invariants that Prisma represents in application types but does not
-- currently express in schema.prisma.
ALTER TABLE "Round"
  ADD CONSTRAINT "Round_valid_window" CHECK ("startsAt" < "endsAt");

ALTER TABLE "Deal"
  ADD CONSTRAINT "Deal_credit_positive" CHECK ("creditAmountCents" > 0),
  ADD CONSTRAINT "Deal_inventory_nonnegative" CHECK ("inventoryCount" >= 0),
  ADD CONSTRAINT "Deal_available_nonnegative" CHECK ("availableCount" >= 0),
  ADD CONSTRAINT "Deal_claimed_nonnegative" CHECK ("claimedCount" >= 0),
  ADD CONSTRAINT "Deal_inventory_accounted" CHECK ("availableCount" + "claimedCount" <= "inventoryCount"),
  ADD CONSTRAINT "Deal_score_matches_inventory" CHECK ("scoreCents" = "creditAmountCents"::bigint * "inventoryCount"::bigint),
  ADD CONSTRAINT "Deal_entry_fee_nonnegative" CHECK ("entryFeeCents" >= 0);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_nonnegative" CHECK ("amountCents" >= 0);
