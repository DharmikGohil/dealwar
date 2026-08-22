# DealWar production architecture

DealWar is a public, time-boxed marketplace where verified companies compete by committing fixed-dollar customer credits. The public score is the face value of a live, verified offer pool; redemptions are backed by unique coupon inventory.

## Trust boundaries

- Browsers are untrusted. Every authorization, price, rank, inventory, and ownership decision is recomputed on the server.
- Dodo Payments is authoritative for entry-fee payment state and acts as merchant of record. Webhooks follow Standard Webhooks signature verification and are deduplicated by webhook ID and payload hash.
- Coupon codes are encrypted at rest and separately hashed for uniqueness checks. Plaintext is revealed only once to the authenticated claimant.
- Claims are allocated in a database transaction with row locking, unique constraints, and idempotency keys.
- IP addresses and user agents are never stored raw; keyed hashes support abuse detection without retaining direct identifiers.
- Moderation approval and domain verification are required before a deal can become live.

## Core services

- Next.js 16 App Router for the web application and route handlers.
- PostgreSQL 17 as the system of record.
- Prisma 7 with the PostgreSQL driver adapter.
- Better Auth for password/social authentication, verified email, sessions, CSRF/origin protection, and auth rate limits.
- Dodo hosted Checkout Sessions with server-fixed dynamic pricing, signed webhooks, invoices, disputes, and refunds for one-time deal entry fees.
- Resend for email verification, password reset, claim receipts, and operational messages.

## Ranking rule

For the first public competition, only fixed USD credits are comparable:

`deal pool = credit amount in cents × verified coupon inventory`

The amount is never accepted from the browser at payment time. The server derives fees and public scores from stored, moderated deal data. Equal scores are ordered by the earliest `liveAt` timestamp.

## Lifecycle

`DRAFT → PENDING_PAYMENT → PENDING_REVIEW → SCHEDULED → LIVE → ENDED`

Operators may also move a deal to `PAUSED`, `REJECTED`, or `CANCELLED`. Every privileged transition writes an immutable audit record.

Lifecycle reconciliation is idempotent. It runs on public reads with a short in-process throttle, so a sleeping bootstrap instance corrects round state on the first request after waking. The authenticated lifecycle endpoint remains available for an external scheduler when exact wall-clock transitions are required.

## Production gates

- Required secrets validated on boot.
- HTTPS-only secure cookies in production.
- CSP and browser security headers.
- Rate limits on auth, submissions, claims, clicks, and webhooks.
- Database backups and point-in-time recovery configured by the chosen Postgres host.
- Error reporting and uptime monitoring configured before public launch.
- Terms, privacy policy, refund policy, acceptable-use rules, and advertiser disclosure published before accepting payments.
