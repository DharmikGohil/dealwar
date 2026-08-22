# DealWar

DealWar is a production-oriented, time-boxed marketplace where verified companies compete by committing fixed-dollar customer credits. Customers claim unique inventory; company entry fees never influence rank.

## What is implemented

- Public live leaderboard, deal detail pages, outbound click deduplication, and dynamic social/search metadata.
- Email/password authentication, email verification, password recovery, secure sessions, optional Google/GitHub sign-in, and banned-user enforcement.
- Company entry workflow with server-derived score and fee, signed logo uploads, encrypted coupon inventory, Dodo hosted Checkout, DNS ownership verification, and human moderation.
- Transactional claim allocation with deterministic database locks, one-claim constraints, idempotency, abuse limits, email receipts, and an authenticated claim vault.
- Dodo Standard Webhooks signature verification, atomic event locking, line-item reconciliation, payment failures, disputes, full/partial refunds, and idempotent rejection refunds.
- Admin moderation and round scheduling, automatic lifecycle transitions, immutable audit events, legal/support surfaces, strict CSP nonces, and health/readiness checks.

## Local development

Requirements: Node.js 24+, npm, and Docker.

```bash
cp .env.example .env
# Replace every local secret. Generate independent values; do not reuse them.
docker compose up -d postgres
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The seed creates a populated live board and an `admin@dealwar.local` database row for display/operations fixtures; it intentionally does not create a known password. Create a normal account through the UI, then explicitly promote it in the database for local admin testing:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-address@example.com';
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration  # requires the local PostgreSQL container
npm run build
```

The integration suite uses isolated temporary rows and proves concurrent claims receive distinct coupon inventory while counters remain consistent.

## Production configuration

Set every required variable in `.env.example`. A production `/api/health` response remains `503 degraded` until PostgreSQL, Resend, and S3-compatible object storage are configured. Payments can remain deliberately disabled while Dodo reviews the public website; enabling payments makes complete Dodo configuration a readiness requirement.

Operational requirements outside this repository:

1. Use the Supabase session-pooler PostgreSQL URL for the application. On the free plan, run encrypted off-site dumps and test restores; upgrade before requiring built-in point-in-time recovery.
2. Create one Dodo single-payment USD product named “DealWar company entry,” enable Pay What You Want with a $19 minimum and $500 maximum, and configure relevant payment, refund, and dispute events to `/api/dodo/webhook`.
3. Configure the object-storage bucket for browser PUT CORS from the exact app origin. Permit `Content-Type` and `Cache-Control`, expose no listing API, and add a lifecycle rule that removes unreferenced uploads after a short retention period.
4. Request-driven lifecycle reconciliation keeps free hosting correct when traffic resumes. For exact transitions under continuous traffic, call `GET /api/cron/lifecycle` with `Authorization: Bearer $CRON_SECRET` from a trusted scheduler.
5. Run `npm run db:deploy` as a release step before routing traffic to the new application image. Never run `prisma migrate dev` in production.
6. Terminate TLS at the load balancer, overwrite forwarded-IP headers from untrusted clients, set the canonical HTTPS URL in both app URL variables, and keep application instances on a private network.
7. Connect error reporting, log aggregation, uptime checks, Dodo payment alerts, domain-abuse support, and a documented incident-response rotation.
8. Have qualified counsel review the terms, privacy policy, refund language, promotion/advertising rules, and jurisdiction-specific tax and consumer obligations before accepting real payments.

## Release checklist

- Rotate all development secrets and verify the coupon key is backed up in a restricted secret manager. Losing it makes existing coupon inventory unrecoverable.
- Verify Dodo webhook signatures in test mode and complete payment, cancellation, refund, rejection, dispute, duplicate-webhook, and amount-mismatch drills before switching to `live_mode` and enabling payments.
- Verify DNS ownership with multiple providers and test email deliverability (SPF, DKIM, DMARC, bounces, and complaints).
- Run accessibility and responsive visual checks on representative browsers and real mobile devices.
- Load-test the hottest deal against a staging database sized like production.
- Confirm the readiness endpoint is healthy, migrations are applied, lifecycle ticks are running, and database restore has been rehearsed.

Architecture and trust boundaries are documented in [docs/architecture.md](docs/architecture.md).
