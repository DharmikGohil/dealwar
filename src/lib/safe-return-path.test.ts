import { describe, expect, it } from "vitest";
import { safeReturnPath } from "@/lib/safe-return-path";

describe("safeReturnPath", () => {
  it("keeps local paths with query strings and fragments", () => {
    expect(safeReturnPath("/deals/acme?claim=1")).toBe("/deals/acme?claim=1");
    expect(safeReturnPath("/#board")).toBe("/#board");
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "/%5cevil.example/steal",
    "javascript:alert(1)",
    "dashboard",
  ])("rejects unsafe return destination %s", (destination) => {
    expect(safeReturnPath(destination)).toBe("/my-deals");
  });

  it("supports a caller-defined fallback", () => {
    expect(safeReturnPath(undefined, "/")).toBe("/");
  });
});
