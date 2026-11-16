import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./auth-navigation";

describe("authentication return destination", () => {
  it("preserves the requested invoice URL including search and hash", () => {
    expect(safeReturnTo("/factures/F-2026-002?view=detail#payment")).toBe("/factures/F-2026-002?view=detail#payment");
  });
  it("rejects external destinations", () => {
    for (const value of ["https://example.com", "//example.com", "/\\example.com", "/%2f%2fexample.com"]) {
      expect(safeReturnTo(value)).not.toMatch(/^https?:|^\/\/|^\/\\/);
    }
    expect(safeReturnTo("//example.com")).toBe("/");
  });
  it("avoids returning to the sign-in page", () => {
    expect(safeReturnTo("/auth?redirect=/factures")).toBe("/");
    expect(safeReturnTo(undefined)).toBe("/");
  });
});