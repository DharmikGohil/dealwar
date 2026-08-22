import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

const testEnvironment = loadEnv("test", import.meta.dirname, "");
for (const [key, value] of Object.entries(testEnvironment)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
      "server-only": `${import.meta.dirname}/src/test/server-only.ts`,
    },
  },
});
