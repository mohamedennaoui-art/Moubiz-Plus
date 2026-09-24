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

describe("exemption period (registration 01/01/2026)", () => {
  const reg = "2026-01-01";

  it("TEST 1: municipal / T3 2026 → 0 TND due", () => {
    const r = computeTaxDetails(base({ registrationDate: reg, period: "2026", taxPeriod: "Q3" }));
    expect(r.paymentExempt).toBe(true);
    expect(r.calculatedTax).toBe(0);
    expect(r.theoreticalTax).toBe(50);
  });

  it("TEST 2: municipal / T1 2027 → 0 TND due", () => {
    const r = computeTaxDetails(base({ registrationDate: reg, period: "2027", taxPeriod: "Q1" }));
    expect(r.calculatedTax).toBe(0);
  });

  it("TEST 3: municipal / T2 2027 → 50 TND due", () => {
    const r = computeTaxDetails(base({ registrationDate: reg, period: "2027", taxPeriod: "Q2" }));
    expect(r.paymentExempt).toBe(false);
    expect(r.calculatedTax).toBe(50);
  });

  it("TEST 4: outside / T3 2026 → 0 TND due", () => {
    const r = computeTaxDetails(
      base({
        registrationDate: reg,
        locationType: "OUTSIDE_MUNICIPAL",
        period: "2026",
        taxPeriod: "Q3",
      }),
    );
    expect(r.calculatedTax).toBe(0);
  });

  it("TEST 5: outside / T2 2027 → 25 TND due", () => {
    const r = computeTaxDetails(
      base({
        registrationDate: reg,
        locationType: "OUTSIDE_MUNICIPAL",
        period: "2027",
        taxPeriod: "Q2",
      }),
    );
    expect(r.calculatedTax).toBe(25);
  });

  it("exemption ends 31/03/2027", () => {
    const r = computeTaxDetails(base({ registrationDate: reg }));
    expect(r.exemptionEndDate?.slice(0, 10)).toBe("2027-03-31");
  });
});
