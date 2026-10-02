import { describe, expect, it } from "vitest";
import { computeSocialDetails } from "./social";

const base = { period: "2026", quarter: "T2" as const, registrationDate: "" };

describe("4 combinations activity × employment", () => {
  it("other + independent → tranche available (T1 = 235.389)", () => {
    const d = computeSocialDetails({ ...base, activityCategory: "other", tranche: 1, employment: "independent" });
    expect(d.theoreticalQuarterly).toBe(235.389);
    expect(d.tranche).toBe(1);
  });
  it("other + private_employee → tranche available (T2 = 353.084)", () => {
    const d = computeSocialDetails({ ...base, activityCategory: "other", tranche: 2, employment: "private_employee" });
    expect(d.theoreticalQuarterly).toBe(353.084);
    expect(d.tranche).toBe(2);
  });
  it("craft + independent → 83.211, no tranche", () => {
    const d = computeSocialDetails({ ...base, activityCategory: "craft", tranche: 5, employment: "independent" });
    expect(d.theoreticalQuarterly).toBe(83.211);
    expect(d.tranche).toBeNull();
  });
  it("craft + private_employee → 83.211, no tranche", () => {
    const d = computeSocialDetails({ ...base, activityCategory: "craft", tranche: 5, employment: "private_employee" });
    expect(d.theoreticalQuarterly).toBe(83.211);
    expect(d.tranche).toBeNull();
  });
});
