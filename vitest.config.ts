import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

const testEnvironment = loadEnv("test", import.meta.dirname, "");
for (const [key, value] of Object.entries(testEnvironment)) {
  if (process.env[key] === undefined) process.env[key] = value;
}
export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/*.integration.test.ts", "**/node_modules/**", "**/.git/**"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
      "server-only": `${import.meta.dirname}/src/test/server-only.ts`,
    },
  },
});
