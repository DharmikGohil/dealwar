import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("produces stable, bounded ASCII slugs", () => {
    expect(slugify("  Crème & Signal™  ")).toBe("creme-signal");
    expect(slugify("A".repeat(100))).toHaveLength(64);
  });
});
