-- Better Auth 1.7 scopes account identities by issuer. Add and backfill the
-- required column before replacing the legacy provider/account constraint.
ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

UPDATE "Account"
SET "issuer" = CASE
  WHEN "providerId" = 'credential' THEN 'local:credential'
  WHEN "providerId" = 'google' THEN 'https://accounts.google.com'
  ELSE 'local:oauth:' || "providerId"
END;

ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;

DROP INDEX "Account_providerId_accountId_key";
CREATE UNIQUE INDEX "Account_issuer_accountId_key" ON "Account"("issuer", "accountId");

-- Better Auth 1.7 created the User row before the legacy adapter failed to
-- create its Account row. Remove only completely unused, accountless users so
-- their email addresses can register successfully after this migration.
DELETE FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "Account" WHERE "Account"."userId" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "Session" WHERE "Session"."userId" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "Membership" WHERE "Membership"."userId" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "Organization" WHERE "Organization"."createdById" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "Claim" WHERE "Claim"."userId" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "ModerationCase" WHERE "ModerationCase"."actorId" = "User"."id"
)
AND NOT EXISTS (
  SELECT 1 FROM "AuditLog" WHERE "AuditLog"."actorId" = "User"."id"
);
