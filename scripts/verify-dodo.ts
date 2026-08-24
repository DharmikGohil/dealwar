import DodoPayments from "dodopayments";
import { env, paymentsConfigured } from "../src/lib/env";
import { requiredDodoWebhookEvents } from "../src/lib/payments/config";

async function main() {
  if (!paymentsConfigured) {
    throw new Error("Set the four DODO_PAYMENTS_* credentials before running this check.");
  }
  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY!,
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    maxRetries: 2,
    timeout: 15_000,
  });
  const product = await client.products.retrieve(env.DODO_PAYMENTS_PRODUCT_ID!);
  const errors: string[] = [];

  if (product.business_id !== env.DODO_PAYMENTS_BUSINESS_ID) errors.push("Product belongs to a different Dodo business.");
  if (product.is_recurring || product.price.type !== "one_time_price") errors.push("Product must use one-time pricing.");
  if (product.price.type === "one_time_price") {
    if (product.price.currency !== "USD") errors.push("Product base currency must be USD.");
    if (!product.price.pay_what_you_want) errors.push("Pay What You Want must be enabled for dynamic entry fees.");
    if (product.price.discount !== 0) errors.push("Product-level discount must be zero.");
    if (product.price.price > env.DEAL_ENTRY_FEE_CENTS) errors.push("Product minimum exceeds DealWar's minimum entry fee.");
  }
  if (product.license_key_enabled || product.entitlements.length || product.credit_entitlements.length) {
    errors.push("License, delivery, and credit entitlements must be disabled for this service product.");
  }

  const webhookUrl = `${env.NEXT_PUBLIC_APP_URL}/api/dodo/webhook`;
  const endpoints = [];
  for await (const webhook of client.webhooks.list()) endpoints.push(webhook);
  const endpoint = endpoints.find((webhook) => webhook.url === webhookUrl);
  if (!endpoint) {
    errors.push(`No Dodo webhook points to ${webhookUrl}.`);
  } else {
    if (endpoint.disabled) errors.push("The DealWar Dodo webhook is disabled.");
    const configuredEvents = new Set(endpoint.filter_types || []);
    const missing = requiredDodoWebhookEvents.filter((event) => !configuredEvents.has(event));
    if (missing.length) errors.push(`Webhook is missing events: ${missing.join(", ")}.`);
  }

  if (errors.length) {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ Dodo ${env.DODO_PAYMENTS_ENVIRONMENT} product ${product.product_id} is valid.`);
  console.log(`✓ Webhook ${endpoint?.id} covers all required payment, refund, and dispute events.`);
  console.log("✓ DealWar may be enabled for a controlled payment drill.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
