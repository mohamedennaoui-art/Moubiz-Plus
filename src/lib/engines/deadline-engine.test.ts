import { describe, expect, it } from "vitest";
import {
  buildRange,
  buildYear,
  consecutiveUnpaidContributions,
  consecutiveZeroDeclarations,
  declarationStatus,
  dueDateFor,
  emptyEntry,
  exemptionEnd,
  hasObligation,
  isPaymentExempt,
  notificationFor,
  paymentStatus,
  quarterRange,
  unpaidContributionCount,
  zeroDeclarationCount,
} from "./deadline-engine";

const iso = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10);

describe("quarter engine", () => {
  it("returns quarter boundaries", () => {
    expect(iso(quarterRange(2026, "T1").start)).toBe("2026-01-01");
    expect(iso(quarterRange(2026, "T1").end)).toBe("2026-03-31");
    expect(iso(quarterRange(2026, "T4").end)).toBe("2026-12-31");
  });
});

describe("due date engine", () => {
  it("adds 15 days after quarter end", () => {
    expect(iso(dueDateFor(2026, "T1"))).toBe("2026-04-15");
    expect(iso(dueDateFor(2026, "T2"))).toBe("2026-07-15");
    expect(iso(dueDateFor(2026, "T3"))).toBe("2026-10-15");
    expect(iso(dueDateFor(2026, "T4"))).toBe("2027-01-15");
  });
});

describe("pre-registration periods", () => {
  it("never creates an obligation for a period starting before registration", () => {
    expect(hasObligation(2026, "T1", "2026-09-20")).toBe(false);
    expect(hasObligation(2026, "T2", "2026-09-20")).toBe(false);
    expect(hasObligation(2026, "T3", "2026-09-20")).toBe(false);
    expect(hasObligation(2026, "T4", "2026-09-20")).toBe(true);
    expect(hasObligation(2026, "T4", "2026-10-01")).toBe(true);
    expect(hasObligation(2026, "T1", "2026-01-01")).toBe(true);
  });
});

describe("exemption engine", () => {
  it("extends registration + 12 months to the quarter end", () => {
    expect(iso(exemptionEnd("2026-09-20")!)).toBe("2027-09-30");
    expect(iso(exemptionEnd("2026-02-10")!)).toBe("2027-03-31");
    expect(iso(exemptionEnd("2026-01-01")!)).toBe("2027-03-31");
  });

  it("TEST 1 — registration 20/09/2026", () => {
    const list = buildRange(2026, 2028, "2026-09-20", {}, new Date("2026-09-25T00:00:00Z"));
    expect(list.map((o) => `${o.quarter} ${o.year}`).slice(0, 5)).toEqual([
      "T4 2026",
      "T1 2027",
      "T2 2027",
      "T3 2027",
      "T4 2027",
    ]);
    expect(iso(list[0]!.dueDate)).toBe("2027-01-15");
    expect(list[0]!.paymentExempt).toBe(true);
    expect(list[1]!.paymentExempt).toBe(true);
    expect(list[2]!.paymentExempt).toBe(true);
    expect(list[3]!.paymentExempt).toBe(true);
    expect(iso(list[3]!.dueDate)).toBe("2027-10-15");
    expect(list[4]!.paymentExempt).toBe(false);
    expect(iso(list[4]!.dueDate)).toBe("2028-01-15");
    // Declaration stays required during the exemption window.
    expect(list.every((o) => o.declarationRequired)).toBe(true);
  });

  it("TEST 3 — registration 01/10/2026", () => {
    const list = buildYear(2026, "2026-10-01", {}, new Date("2026-10-05T00:00:00Z"));
    expect(list).toHaveLength(1);
    expect(list[0]!.quarter).toBe("T4");
    expect(list[0]!.paymentExempt).toBe(true);
    expect(iso(exemptionEnd("2026-10-01")!)).toBe("2027-12-31");
    expect(isPaymentExempt(2028, "T1", "2026-10-01")).toBe(false);
  });
});

describe("statuses", () => {
  const due = new Date("2026-04-15T00:00:00Z");
  it("declaration", () => {
    expect(declarationStatus(emptyEntry, due, new Date("2026-04-01T00:00:00Z"))).toBe("todo");
    expect(declarationStatus(emptyEntry, due, new Date("2026-05-01T00:00:00Z"))).toBe("late");
    expect(
      declarationStatus({ ...emptyEntry, declared: true }, due, new Date("2026-05-01T00:00:00Z")),
    ).toBe("declared");
  });
  it("payment", () => {
    expect(paymentStatus(emptyEntry, due, new Date("2026-04-01T00:00:00Z"))).toBe("to_pay");
    expect(paymentStatus(emptyEntry, due, new Date("2026-05-01T00:00:00Z"))).toBe("late");
    expect(paymentStatus({ ...emptyEntry, paid: true }, due, new Date("2026-05-01T00:00:00Z"))).toBe(
      "paid",
    );
  });
});

describe("notification engine", () => {
  const due = new Date("2026-04-15T00:00:00Z");
  it("fires on thresholds", () => {
    for (const d of [30, 15, 7, 3, 1]) {
      const now = new Date(due.getTime() - d * 86400000);
      expect(notificationFor(due, now)).toEqual({ kind: "before", days: d });
    }
  });
  it("is silent off-threshold", () => {
    expect(notificationFor(due, new Date("2026-04-05T00:00:00Z"))).toBeNull();
  });
  it("reports overdue", () => {
    expect(notificationFor(due, new Date("2026-04-18T00:00:00Z"))).toEqual({
      kind: "overdue",
      days: 3,
    });
  });
});

describe("counters", () => {
  it("counts zero declarations and unpaid contributions", () => {
    const list = buildYear(
      2026,
      "2020-01-01",
      {
        "2026-T1": { declared: true, paid: true, turnover: 0 },
        "2026-T2": { declared: true, paid: false, turnover: 1200 },
      },
      new Date("2026-12-01T00:00:00Z"),
    );
    expect(zeroDeclarationCount(list)).toBe(1);
    expect(unpaidContributionCount(list)).toBe(3);
  });

  it("tracks consecutive runs", () => {
    const entries = {
      "2026-T1": { declared: true, paid: false, turnover: 0 },
      "2026-T2": { declared: true, paid: false, turnover: 0 },
      "2026-T3": { declared: true, paid: false, turnover: 0 },
      "2026-T4": { declared: true, paid: false, turnover: 0 },
      "2027-T1": { declared: true, paid: false, turnover: 0 },
    };
    const list = buildRange(2026, 2027, "2020-01-01", entries, new Date("2027-08-01T00:00:00Z"));
    expect(consecutiveZeroDeclarations(list)).toBe(5);
    expect(consecutiveUnpaidContributions(list, new Date("2027-08-01T00:00:00Z"))).toBe(6);
  });
});
