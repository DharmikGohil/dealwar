# Bootstrap deployment: Render, Supabase, Storage, and Resend

## Render

Create a Blueprint from `render.yaml`. Supply every `sync: false` value in the Render dashboard. The service intentionally launches with payments disabled and does not require Dodo credentials, so Dodo can review a complete public website without accepting money. Add the four Dodo credential variables after merchant approval.

## Supabase

Use a Singapore-region project to match the Render service. Put the Supabase session-pooler URL in Render as `DATABASE_URL`; require TLS in the connection string. Do not expose the database password to the browser.

The free plan has no automatic backups. Add `SUPABASE_DIRECT_URL` and a long random `BACKUP_ENCRYPTION_PASSWORD` as GitHub Actions secrets, run the database-backup workflow manually once, download the encrypted artifact, and prove a restore into a temporary database before launch.

## Supabase Storage

In the same Supabase project, create a public file bucket named `dealwar-assets`. Set its file-size limit to 2 MB and allow only `image/png`, `image/jpeg`, and `image/webp`. Public reads are intentional because approved company logos appear on the public leaderboard; writes still use five-minute, server-generated presigned URLs.

Open **Storage > S3 Configuration**, enable the S3 protocol, and create a dedicated S3 access-key pair. Put only the access-key ID and secret in Render. These credentials bypass Storage RLS and can access every bucket in the project, so never expose them to the browser, commit them, or reuse them outside DealWar. The endpoint, region, bucket, and public URL are already set in `render.yaml` for this Supabase project.

## Resend

Use an existing verified sender on `dharmikgohil.in`, or verify a dedicated sending subdomain, and create the API key. The `EMAIL_FROM` domain must match the verified sending domain. `SUPPORT_EMAIL` must be a monitored mailbox or forwarding address.

## Temporary domain

1. Deploy the Render Blueprint and copy the exact `*.onrender.com` hostname assigned to the service.
2. In Render, open the DealWar service, go to **Settings > Custom Domains**, and add `dealwar.dharmikgohil.in`.
3. In Cloudflare DNS, add one record: type `CNAME`, name `dealwar`, target the exact Render hostname, proxy status `DNS only`, and TTL `Auto`. Do not change the apex, `www`, mail, or existing verification records.
4. Return to Render and verify the domain. Wait for the TLS certificate to be issued and confirm `https://dealwar.dharmikgohil.in` loads successfully.
5. Cloudflare proxying is optional after Render reports a valid certificate. Keep the record DNS-only for the initial production rehearsal.

Use `https://dealwar.dharmikgohil.in` as the website submitted for Dodo merchant review. Keep payments disabled until the test-mode drill is complete.

## Moving to dealwar.lol

Before launch, add and verify `dealwar.lol` in Render without removing the temporary domain. Update the Dodo website and webhook, update OAuth callback URLs if OAuth is enabled, and then change `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` in Render. Redeploy and test auth, uploads, checkout, webhooks, email links, and legal pages on the new domain. Only remove the temporary domain after those checks pass.
