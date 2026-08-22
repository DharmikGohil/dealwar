import { describe, expect, it } from "vitest";
import { databasePoolConfig } from "./database-config";

describe("databasePoolConfig", () => {
  it("pins the Supabase CA and removes URL SSL settings that would override it", () => {
    const config = databasePoolConfig(
      "postgresql://postgres.project:encoded%40password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
    );

    expect(config.connectionString).not.toContain("sslmode");
    expect(config.max).toBe(5);
    expect(config.ssl).toMatchObject({ rejectUnauthorized: true });
    expect((config.ssl as { ca: string }).ca).toContain("BEGIN CERTIFICATE");
  });

  it("does not force Supabase TLS settings onto local PostgreSQL", () => {
    const config = databasePoolConfig(
      "postgresql://dealwar:dealwar@localhost:5434/dealwar",
    );

    expect(config.ssl).toBeUndefined();
    expect(config.connectionString).toBe(
      "postgresql://dealwar:dealwar@localhost:5434/dealwar",
    );
  });
});
