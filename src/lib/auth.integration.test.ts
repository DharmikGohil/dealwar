import { afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminEmails } from "@/lib/env";

const suffix = crypto.randomUUID().slice(0, 8);
const email = `auth-${suffix}@example.com`;
const adminEmail = `auth-admin-${suffix}@example.com`;

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
});
