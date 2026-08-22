import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

const datasourceUrl = new URL(env("DATABASE_URL"));
if (datasourceUrl.hostname.endsWith(".pooler.supabase.com")) {
  datasourceUrl.searchParams.set("sslmode", "verify-full");
  datasourceUrl.searchParams.set(
    "sslrootcert",
    resolve("certs/supabase-root-2021-ca.pem"),
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl.toString(),
  },
});
