import { describe, expect, it } from "vitest";
import { computeTaxDetails } from "./tax";
import type { TaxInputs } from "./types";

const base = (o: Partial<TaxInputs>): TaxInputs => ({
  period: "2026",
  taxPeriod: "Q1",
  locationType: "MUNICIPAL",
  turnover: 0,
  activity: "services",
  ...o,
});

describe("tax engine (rules 2026)", () => {
  it("TEST 1: municipal / Q1 / 18000 → 50 TND, within ceiling", () => {
    const r = computeTaxDetails(base({ turnover: 18000 }));
    expect(r.calculatedTax).toBe(50);
    expect(r.ceilingStatus).toBe("within");
  });

  it("TEST 2: outside / Q1 / 18000 → 25 TND, within ceiling", () => {
    const r = computeTaxDetails(base({ locationType: "OUTSIDE_MUNICIPAL", turnover: 18000 }));
    expect(r.calculatedTax).toBe(25);
    expect(r.ceilingStatus).toBe("within");
  });

  it("TEST 3: municipal / annual / 40000 → 200 TND, within ceiling", () => {
    const r = computeTaxDetails(base({ taxPeriod: "annual", turnover: 40000 }));
    expect(r.calculatedTax).toBe(200);
    expect(r.ceilingStatus).toBe("within");
  });

  it("TEST 4: outside / annual / 40000 → 100 TND, within ceiling", () => {
    const r = computeTaxDetails(
      base({ locationType: "OUTSIDE_MUNICIPAL", taxPeriod: "annual", turnover: 40000 }),
    );
    expect(r.calculatedTax).toBe(100);
    expect(r.ceilingStatus).toBe("within");
  });

  it("TEST 5: municipal / annual / 75000 → 200 TND, within ceiling", () => {
    const r = computeTaxDetails(base({ taxPeriod: "annual", turnover: 75000 }));
    expect(r.calculatedTax).toBe(200);
    expect(r.ceilingStatus).toBe("within");
  });

  it("TEST 6: municipal / annual / 75001 → 200 TND, above ceiling + warning", () => {
    const r = computeTaxDetails(base({ taxPeriod: "annual", turnover: 75001 }));
    expect(r.calculatedTax).toBe(200);
    expect(r.ceilingStatus).toBe("above");
    expect(r.ceilingWarning).toBe(
      "Le chiffre d'affaires dépasse le plafond annuel de 75 000 TND.",
    );
  });

  it("TEST 7: outside / Q4 / 15000 → 25 TND", () => {
    const r = computeTaxDetails(
      base({ locationType: "OUTSIDE_MUNICIPAL", taxPeriod: "Q4", turnover: 15000 }),
    );
    expect(r.calculatedTax).toBe(25);
  });

  it("stores the rules version", () => {
    expect(computeTaxDetails(base({})).rulesVersion).toBe("2026");
  });
});
