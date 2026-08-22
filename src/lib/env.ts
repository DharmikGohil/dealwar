import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const booleanFromString = z.preprocess(
  (value) => typeof value === "string" ? value.trim().toLowerCase() === "true" : value,
  z.boolean(),
);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  ABUSE_HASH_SECRET: z.string().min(32),
  COUPON_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().min(3),
  SUPPORT_EMAIL: z.email(),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  DODO_PAYMENTS_API_KEY: optionalString,
  DODO_PAYMENTS_WEBHOOK_KEY: optionalString,
  DODO_PAYMENTS_PRODUCT_ID: optionalString,
  DODO_PAYMENTS_BUSINESS_ID: optionalString,
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
  PAYMENTS_ENABLED: booleanFromString.default(false),
  OBJECT_STORAGE_ENDPOINT: optionalString,
  OBJECT_STORAGE_REGION: z.preprocess(emptyToUndefined, z.string().min(1).default("auto")),
  OBJECT_STORAGE_BUCKET: optionalString,
  OBJECT_STORAGE_ACCESS_KEY_ID: optionalString,
  OBJECT_STORAGE_SECRET_ACCESS_KEY: optionalString,
  OBJECT_STORAGE_PUBLIC_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  DEAL_ENTRY_FEE_CENTS: z.coerce.number().int().min(0).max(100_000).default(1900),
  ADMIN_EMAILS: z.string().default(""),
  CRON_SECRET: z.string().min(24),
}).superRefine((input, context) => {
  const storageValues = [
    input.OBJECT_STORAGE_ENDPOINT,
    input.OBJECT_STORAGE_BUCKET,
    input.OBJECT_STORAGE_ACCESS_KEY_ID,
    input.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    input.OBJECT_STORAGE_PUBLIC_URL,
  ];
  const configured = storageValues.filter(Boolean).length;
  if (configured > 0 && configured !== storageValues.length) {
    context.addIssue({
      code: "custom",
      path: ["OBJECT_STORAGE_ENDPOINT"],
      message: "Object storage settings must be configured together.",
    });
  }
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid DealWar environment:\n${issues}`);
}

export const env = parsed.data;
export const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const paymentsConfigured = Boolean(
  env.DODO_PAYMENTS_API_KEY &&
  env.DODO_PAYMENTS_WEBHOOK_KEY &&
  env.DODO_PAYMENTS_PRODUCT_ID &&
  env.DODO_PAYMENTS_BUSINESS_ID,
);
export const paymentsActive = env.PAYMENTS_ENABLED && paymentsConfigured;
export const paymentsReady = !env.PAYMENTS_ENABLED || paymentsConfigured;

export const emailConfigured = Boolean(env.RESEND_API_KEY);
export const objectStorageConfigured = Boolean(
  env.OBJECT_STORAGE_ENDPOINT &&
  env.OBJECT_STORAGE_BUCKET &&
  env.OBJECT_STORAGE_ACCESS_KEY_ID &&
  env.OBJECT_STORAGE_SECRET_ACCESS_KEY &&
  env.OBJECT_STORAGE_PUBLIC_URL,
);
