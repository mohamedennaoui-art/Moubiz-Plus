import { describe, expect, it } from "vitest";
import {
  buildYear,
  declarationStatus,
  dueDateFor,
  emptyEntry,
  exemptionEnd,
  isExempt,
  notificationFor,
  paymentStatus,
  quarterRange,
  unpaidContributionCount,
  zeroDeclarationCount,
} from "./deadline-engine";

const iso = (d: Date) => d.toISOString().slice(0, 10);

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

describe("exemption engine", () => {
  it("extends registration + 12 months to the quarter end", () => {
    expect(iso(exemptionEnd("2026-02-10")!)).toBe("2027-03-31");
  });
  it("marks quarters within the exemption window", () => {
    expect(isExempt(2026, "T3", "2026-02-10")).toBe(true);
    expect(isExempt(2027, "T1", "2026-02-10")).toBe(true);
    expect(isExempt(2027, "T2", "2026-02-10")).toBe(false);
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
});
