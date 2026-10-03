import { describe, expect, it } from "vitest";
import { derivedStatus, invoiceOverdue, invoiceRemaining, paymentSummary } from "./invoices";
import type { Invoice } from "./types";

const base: Invoice = {
  id: "i1",
  number: "F-2026-001",
  date: "2026-01-10",
  dueDate: "2026-02-10",
  currency: "TND",
  customer: { name: "A", identifier: "", address: "", contact: "" },
  items: [{ id: "l1", description: "x", quantity: 2, unitPrice: 500 }],
  paid: 0,
  status: "sent",
};

const rates = { TND: 1, EUR: 0, USD: 0 };

describe("invoice payment tracking", () => {
  it("keeps workflow status when nothing paid", () => {
    expect(derivedStatus(base)).toBe("sent");
    expect(derivedStatus({ ...base, status: "unpaid" })).toBe("unpaid");
    expect(derivedStatus({ ...base, status: "draft" })).toBe("draft");
    expect(invoiceRemaining(base)).toBe(1000);
  });
  it("F-2026-001: 5000 paid on 20000 total → partial, 15000 remaining", () => {
    const inv: Invoice = {
      ...base,
      number: "F-2026-001",
      items: [{ id: "l1", description: "x", quantity: 1, unitPrice: 20000 }],
      paid: 5000,
    };
    expect(derivedStatus(inv)).toBe("partial");
    expect(invoiceRemaining(inv)).toBe(15000);
    expect(derivedStatus({ ...inv, paid: 20000 })).toBe("paid");
    expect(invoiceRemaining({ ...inv, paid: 20000 })).toBe(0);
  });
  it("partially paid", () => {
    const inv = { ...base, paid: 400 };
    expect(derivedStatus(inv)).toBe("partial");
    expect(invoiceRemaining(inv)).toBe(600);
  });
  it("fully paid, remaining never negative", () => {
    const inv = { ...base, paid: 1200 };
    expect(derivedStatus(inv)).toBe("paid");
    expect(invoiceRemaining(inv)).toBe(0);
  });
  it("overdue unpaid invoice", () => {
    expect(invoiceOverdue(base, new Date("2026-02-20T00:00:00Z"))).toEqual({
      late: true,
      days: 10,
    });
    expect(invoiceOverdue({ ...base, paid: 1000 }, new Date("2026-02-20T00:00:00Z")).late).toBe(
      false,
    );
  });
  it("dashboard summary ignores drafts", () => {
    const list = [base, { ...base, id: "i2", status: "draft" as const }];
    expect(paymentSummary(list, rates)).toEqual({ unpaidCount: 1, toCollect: 1000 });
  });
});
