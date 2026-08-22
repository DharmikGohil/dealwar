import { z } from "zod";

const blockedHosts = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
]);

const privateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

export function normalizePublicUrl(input: string) {
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS destinations are supported.");
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    blockedHosts.has(hostname) ||
    privateIpv4.test(hostname) ||
    !hostname.includes(".") ||
    /^\d+(\.\d+){3}$/.test(hostname) ||
    hostname.includes(":") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid")
  ) {
    throw new Error("Private network destinations are not allowed.");
  }
  if (url.username || url.password) throw new Error("URLs with embedded credentials are not allowed.");
  url.hash = "";
  return url.toString();
}

export const publicUrlSchema = z
  .string()
  .trim()
  .min(4)
  .max(2048)
  .transform((value, context) => {
    try {
      return normalizePublicUrl(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid URL",
      });
      return z.NEVER;
    }
  });

export function hostnameFromUrl(input: string) {
  return new URL(normalizePublicUrl(input)).hostname.replace(/^www\./, "");
}
