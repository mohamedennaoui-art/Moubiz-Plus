import { describe, expect, it } from "vitest";
import { annualTurnover, ceilingStatus } from "./ceiling";
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
