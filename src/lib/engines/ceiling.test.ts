import { describe, expect, it } from "vitest";
import { annualTurnover, annualTurnoverSummary, ceilingStatus, ceilingRules, ceilingLevel } from "./ceiling";
import type { Invoice } from "./types";

const inv = (over: Partial<Invoice>): Invoice => ({
  id: "i",
  number: "F-2026-001",
  date: "2026-03-01",
  dueDate: "2026-03-31",
  currency: "TND",
  customer: { name: "", identifier: "", address: "", contact: "" },
  items: [{ id: "l", description: "x", quantity: 1, unitPrice: 1000 }],
  paid: 0,
  status: "sent",
  ...over,
});

describe("configured ceiling and annual currency completeness", () => {
  it.each([[60000, "p80"], [67500, "p90"], [71250, "p95"], [75000, "p100"]] as const)("preserves the threshold at %s", (amount, level) => {
    expect(ceilingLevel(amount)).toBe(level);
  });
  it("uses the configured thresholds rather than duplicate constants", () => {
    expect(ceilingRules.thresholds).toEqual([100, 95, 90, 80]);
    expect(ceilingLevel(37500, { ...ceilingRules, thresholds: [100, 70, 60, 50] })).toBe("p80");
  });
  it("converts EUR and USD and filters drafts and other exercises", () => {
    expect(annualTurnover([inv({}), inv({ currency: "EUR" }), inv({ currency: "USD" }), inv({ date: "2025-01-01" }), inv({ status: "draft" })], 2026, { TND: 1, EUR: 3, USD: 2 })).toBe(6000);
  });
  it("returns unknown annual totals with the affected currency", () => {
    const list = [inv({}), inv({ currency: "USD" })];
    expect(annualTurnover(list, 2026, { TND: 1, EUR: 3, USD: 0 })).toBeNull();
    expect(annualTurnoverSummary(list, 2026, { TND: 1, EUR: 3, USD: 0 })).toEqual({ amount: null, missingCurrencies: ["USD"] });
  });
  it("does not require a rate for excluded exercises or drafts", () => {
    expect(annualTurnover([inv({}), inv({ currency: "EUR", date: "2025-01-01" }), inv({ currency: "USD", status: "draft" })], 2026, { TND: 1, EUR: 0, USD: 0 })).toBe(1000);
  });
});

describe("ceiling engine", () => {
  it("levels", () => {
    expect(ceilingStatus(50000).level).toBe("ok");
    expect(ceilingStatus(60000).level).toBe("p80");
    expect(ceilingStatus(67500).level).toBe("p90");
    expect(ceilingStatus(71250).level).toBe("p95");
    expect(ceilingStatus(75000).level).toBe("p100");
    expect(ceilingStatus(75001).level).toBe("above");
  });
  it("percent", () => {
    expect(Math.round(ceilingStatus(60000).percent)).toBe(80);
    expect(ceilingStatus(75000).messageKey).toBe("ceiling_100");
    expect(ceilingStatus(50000).messageKey).toBeNull();
  });
  it("annual turnover ignores drafts and other years", () => {
    const list = [
      inv({ id: "a" }),
      inv({ id: "b", status: "draft" }),
      inv({ id: "c", date: "2025-03-01" }),
    ];
    expect(annualTurnover(list, 2026, { TND: 1, EUR: 0, USD: 0 })).toBe(1000);
  });
});
