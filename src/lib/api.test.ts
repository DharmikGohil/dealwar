import { describe, expect, it } from "vitest";
import { ApiError, assertTrustedOrigin, requestId } from "@/lib/api";

describe("API request trust", () => {
  it("accepts the configured application origin", () => {
    const request = new Request("http://localhost:3000/api/test", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertTrustedOrigin(request)).not.toThrow();
  });

  it.each([undefined, "null", "https://attacker.example"])(
    "rejects an untrusted origin %s",
    (origin) => {
      const headers = origin ? { origin } : undefined;
      const request = new Request("http://localhost:3000/api/test", { method: "POST", headers });
      expect(() => assertTrustedOrigin(request)).toThrow(ApiError);
    },
  );

  it("uses a valid Render request ID and rejects unsafe values", () => {
    expect(requestId(new Request("http://localhost", { headers: { "rndr-id": "render_123-abc" } }))).toBe("render_123-abc");
    expect(requestId(new Request("http://localhost", { headers: { "x-request-id": "contains spaces" } }))).not.toBe("contains spaces");
  });
});
