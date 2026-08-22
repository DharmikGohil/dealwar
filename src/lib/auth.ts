import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { emailConfigured, env } from "@/lib/env";
import { sendEmail } from "@/lib/email";

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: "DealWar",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  advanced: {
    database: { joins: true },
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 15,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/request-password-reset": { window: 3600, max: 3 },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailConfigured,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your DealWar password",
        preview: "A password reset was requested for your DealWar account.",
        heading: "Reset your password",
        body: "This link expires shortly. If you did not request a reset, you can safely ignore this email.",
        actionLabel: "Reset password",
        actionUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: emailConfigured,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your DealWar email",
        preview: "Verify your email before claiming a live deal.",
        heading: "Prove you’re human.",
        body: "Verify this address to claim deals and publish offers on DealWar.",
        actionLabel: "Verify email",
        actionUrl: url,
      });
    },
  },
  socialProviders,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  plugins: [nextCookies()],
});
