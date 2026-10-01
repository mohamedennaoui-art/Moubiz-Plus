import { describe, expect, it } from "vitest";
import { computeSocialDetails } from "./social";
import type { SocialInputs } from "./types";

const base = (p: Partial<SocialInputs>): SocialInputs => ({
  period: "2026", quarter: "T2", activityCategory: "other", tranche: 1, employment: "independent", ...p,
});

describe("social contribution 2026", () => {
  const cases: [string, Partial<SocialInputs>, number, number][] = [
    ["1 AE autres T1", {}, 235.389, 941.556],
    ["2 AE autres T2", { tranche: 2 }, 353.084, 1412.336],
    ["3 AE autres T3", { tranche: 3 }, 470.779, 1883.116],
    ["4 AE artisanat", { activityCategory: "craft" }, 83.211, 332.844],
    ["5 salarié autres T1", { employment: "private_employee" }, 235.389, 941.556],
    ["6 salarié autres T2", { employment: "private_employee", tranche: 2 }, 353.084, 1412.336],
    ["7 salarié autres T3", { employment: "private_employee", tranche: 3 }, 470.779, 1883.116],
    ["8 salarié artisanat", { employment: "private_employee", activityCategory: "craft" }, 83.211, 332.844],
  ];
  for (const [name, p, q, a] of cases) {
    it(name, () => {
      const d = computeSocialDetails(base(p));
      expect(d.quarterly).toBe(q);
      expect(d.annual).toBe(a);
      expect(d.paymentExempt).toBe(false);
    });
  }
  it("9 première année exonérée, paramètres conservés", () => {
    const d = computeSocialDetails(base({ registrationDate: "2026-01-01", quarter: "T3" }));
    expect(d.paymentExempt).toBe(true);
    expect(d.quarterly).toBe(0);
    expect(d.theoreticalQuarterly).toBe(235.389);
  });
  it("10 après exonération : calcul normal", () => {
    const d = computeSocialDetails(base({ period: "2027", registrationDate: "2026-01-01", tranche: 2 }));
    expect(d.paymentExempt).toBe(false);
    expect(d.quarterly).toBe(353.084);
  });
  it("tranche 1 par défaut", () => {
    expect(computeSocialDetails(base({ tranche: 0 })).tranche).toBe(1);
  });
});
