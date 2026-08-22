import { describe, expect, it } from "vitest";
import { hostnameFromUrl, normalizePublicUrl } from "@/lib/urls";

describe("public URL validation", () => {
  it("normalizes public domains and removes fragments", () => {
    expect(normalizePublicUrl("Example.com/path#private")).toBe("https://example.com/path");
    expect(hostnameFromUrl("https://www.example.com/path")).toBe("example.com");
  });

  it.each([
    "http://localhost:3000",
    "http://app.local",
    "http://service.internal",
    "http://127.0.0.1",
    "http://10.1.2.3",
    "http://192.168.1.4",
    "http://172.31.2.1",
    "http://[::1]",
    "http://[fd00::1]",
    "http://singlelabel",
  ])("rejects private or ambiguous destination %s", (url) => {
    expect(() => normalizePublicUrl(url)).toThrow("Private network destinations are not allowed.");
  });

  it("rejects embedded credentials and non-web protocols", () => {
    expect(() => normalizePublicUrl("https://user:pass@example.com")).toThrow("embedded credentials");
    expect(() => normalizePublicUrl("javascript:alert(1)")).toThrow();
  });
});
