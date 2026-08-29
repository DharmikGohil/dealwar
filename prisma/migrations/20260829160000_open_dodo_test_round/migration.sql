-- Open a transparent, time-limited round for the controlled Dodo test-mode
-- payment drill. Never overlap an operator-scheduled active round.
INSERT INTO "Round" (
  "id",
  "slug",
  "name",
  "strapline",
  "startsAt",
  "endsAt",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  'round_dodo_test_drill_202608',
  'dodo-test-flight-2026-08',
  'Dodo Test Flight',
  'Explore the full DealWar journey in sandbox mode — no real charges.',
  NOW(),
  NOW() + INTERVAL '30 days',
  'LIVE',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM "Round"
  WHERE "status" IN ('SCHEDULED', 'LIVE')
    AND "endsAt" > NOW()
);
