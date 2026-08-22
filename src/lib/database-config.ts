import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PoolConfig } from "pg";

const supabaseRootCertificatePath = join(
  process.cwd(),
  "certs",
  "supabase-root-2021-ca.pem",
);

export function databasePoolConfig(connectionString: string): PoolConfig {
  const parsed = new URL(connectionString);
  const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");

  if (isSupabasePooler) {
    // pg-connection-string replaces an explicit `ssl` object whenever an SSL
    // query parameter is present. Remove those parameters so the pinned CA and
    // hostname verification below cannot be silently discarded.
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("sslrootcert");
    parsed.searchParams.delete("uselibpqcompat");
  }

  return {
    connectionString: parsed.toString(),
    application_name: "dealwar",
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ...(isSupabasePooler
      ? {
          ssl: {
            ca: readFileSync(supabaseRootCertificatePath, "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {}),
  };
}
