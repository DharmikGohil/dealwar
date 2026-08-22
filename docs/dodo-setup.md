# Dodo Payments setup

Do not enable production payments until the Dodo merchant review is approved and the complete test-mode drill passes.

## Product

Create one product with these settings:

- Name: `DealWar company entry`
- Description: `One-time processing, company-domain verification, moderation, and participation in a DealWar customer-value competition round. Payment never affects rank.`
- Pricing: Single payment
- Base currency: USD
- Pay What You Want: enabled (the server always supplies the exact fee)
- Minimum: USD 19
- Maximum: USD 500
- Tax category: choose the Dodo-approved category from the merchant review
- Tax display: confirm the chosen inclusive/exclusive setting in test-mode reconciliation
- License keys, subscriptions, and Dodo digital-file delivery: disabled

Copy the product, business, API, and webhook identifiers into the matching Render environment variables. Never commit their values.

## Webhook

Create an HTTPS endpoint at:

`https://dealwar.dharmikgohil.in/api/dodo/webhook`

Subscribe to:

- `payment.succeeded`
- `payment.processing`
- `payment.failed`
- `payment.cancelled`
- `refund.succeeded`
- `refund.failed`
- `dispute.opened`
- `dispute.accepted`
- `dispute.cancelled`
- `dispute.won`
- `dispute.lost`

DealWar verifies the Standard Webhooks signature, business ID, internal metadata, checkout session, product ID, currency, and server-derived line-item amount. The webhook—not the browser redirect—is authoritative for fulfillment.

## Activation

1. Keep `DODO_PAYMENTS_ENVIRONMENT=test_mode` and `PAYMENTS_ENABLED=false` for the public review site.
2. After Dodo approval, set all Dodo environment variables and temporarily enable test payments.
3. Test success, cancellation, failure, rejection refund, partial/full refund, dispute, duplicate delivery, invalid signature, and mismatched amount handling.
4. Set `DODO_PAYMENTS_ENVIRONMENT=live_mode`, rotate to live credentials, and set `PAYMENTS_ENABLED=true` in the same controlled release.

When moving to `dealwar.lol`, add the new webhook endpoint and prove test delivery before disabling the temporary endpoint.
