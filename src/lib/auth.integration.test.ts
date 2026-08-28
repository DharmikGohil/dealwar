import { afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEmails } from "@/lib/env";

const suffix = crypto.randomUUID().slice(0, 8);
const email = `auth-${suffix}@example.com`;
const adminEmail = `auth-admin-${suffix}@example.com`;
const missingEmail = `auth-missing-${suffix}@example.com`;

describe("email/password authentication", () => {
  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { in: [email, adminEmail] } } });
    await db.$disconnect();
  });

  it("creates an issuer-scoped credential account and session", async () => {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        name: "Authentication Test",
        password: "DealWar-Integration!2026",
        callbackURL: "/dashboard",
      },
      headers: new Headers({ origin: "http://localhost:3000" }),
    });

    expect(result.user.email).toBe(email);
    expect(result.token).toBeTruthy();

    const account = await db.account.findFirstOrThrow({
      where: { userId: result.user.id, providerId: "credential" },
    });
    expect(account.issuer).toBe("local:credential");
    expect(account.accountId).toBe(result.user.id);
  });

  it("grants operator access only to a configured admin email", async () => {
    adminEmails.add(adminEmail);
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          name: "Admin Authentication Test",
          password: "DealWar-Admin-Integration!2026",
          callbackURL: "/dashboard",
        },
        headers: new Headers({ origin: "http://localhost:3000" }),
      });

      const user = await db.user.findUniqueOrThrow({ where: { id: result.user.id } });
      expect(user.role).toBe("ADMIN");
    } finally {
      adminEmails.delete(adminEmail);
    }
  });

  it("creates a single-use reset token for an existing account", async () => {
    const result = await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: new Headers({ origin: "http://localhost:3000" }),
    });

    expect(result.status).toBe(true);
    const resetToken = await db.verification.findFirst({
      where: {
        identifier: { startsWith: "reset-password:" },
        value: (await db.user.findUniqueOrThrow({ where: { email } })).id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(resetToken).not.toBeNull();
    expect(resetToken!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("uses the same public response without creating a token for an unknown email", async () => {
    const before = await db.verification.count({
      where: { identifier: { startsWith: "reset-password:" } },
    });
    const result = await auth.api.requestPasswordReset({
      body: { email: missingEmail, redirectTo: "/reset-password" },
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    const after = await db.verification.count({
      where: { identifier: { startsWith: "reset-password:" } },
    });

    expect(result.status).toBe(true);
    expect(after).toBe(before);
  });
});
