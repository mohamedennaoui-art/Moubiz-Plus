import { describe, expect, it } from "vitest";
import {
  derivedStatus,
  invoiceOverdue,
  invoiceRemaining,
  paymentSummary,
  syncInvoiceStatus,
  financialSummary,
  toTND,
} from "./invoices";
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
    expect(paymentSummary(list, rates)).toEqual({ unpaidCount: 1, toCollect: 1000, missingCurrencies: [] });
  });
  it("F-2026-002: draft, 200 paid on 1000 total → partial saved, 800 remaining", () => {
    const draft: Invoice = { ...base, number: "F-2026-002", status: "draft", paid: 200 };
    const saved = syncInvoiceStatus(draft);
    expect(saved.status).toBe("partial");
    expect(invoiceRemaining(saved)).toBe(800);
    expect(syncInvoiceStatus({ ...draft, paid: 1000 }).status).toBe("paid");
    expect(syncInvoiceStatus({ ...draft, paid: 0 }).status).toBe("draft");
  });
});

describe("invoice overdue exclusions", () => {
  const now = new Date("2026-02-20T12:00:00Z");
  it("never marks an expired draft overdue", () => {
    expect(invoiceOverdue({ ...base, status: "draft" }, now)).toEqual({ late: false, days: 0 });
  });
  it("marks an expired sent invoice overdue", () => {
    expect(invoiceOverdue(base, now)).toEqual({ late: true, days: 10 });
  });
  it("marks an expired partial invoice overdue with 800 remaining", () => {
    expect(invoiceOverdue({ ...base, status: "partial", paid: 200 }, now).late).toBe(true);
    expect(invoiceRemaining({ ...base, paid: 200 })).toBe(800);
  });
  it("marks an expired unpaid invoice overdue", () => {
    expect(invoiceOverdue({ ...base, status: "unpaid" }, now).late).toBe(true);
  });
  it("never marks a recorded paid invoice overdue", () => {
    expect(invoiceOverdue({ ...base, status: "paid", paid: 1000 }, now).late).toBe(false);
    expect(invoiceOverdue({ ...base, status: "paid", paid: 200 }, now).late).toBe(false);
  });
  it.each(["2026-02-20", "2026-02-21", "", "invalid"])("does not mark due today, tomorrow, absent or invalid date %s overdue", (dueDate) => {
    expect(invoiceOverdue({ ...base, dueDate }, now)).toEqual({ late: false, days: 0 });
  });
});

describe("TND financial aggregates", () => {
  const exchange = { TND: 1, EUR: 3, USD: 2 };
  it.each([["TND", 100], ["EUR", 300], ["USD", 200]] as const)("converts %s before addition", (currency, expected) => {
    expect(toTND(100, currency, exchange)).toBe(expected);
  });
  it.each([0, -1, NaN, Infinity, undefined])("rejects missing or invalid rate %s", (rate) => {
    const invalid = { ...exchange, EUR: rate } as typeof exchange;
    expect(toTND(100, "EUR", invalid)).toBeNull();
    expect(financialSummary([{ ...base, currency: "EUR", paid: 200 }], invalid).totalInvoiced).toEqual({ amount: null, missingCurrencies: ["EUR"] });
  });
  it("excludes drafts, keeps all exercises and aligns remaining with to collect", () => {
    const invoices: Invoice[] = [
      { ...base, paid: 200 },
      { ...base, currency: "EUR", paid: 200, status: "partial" },
      { ...base, currency: "USD", paid: 1000, status: "paid", date: "2025-01-01" },
      { ...base, status: "draft", paid: 0 },
    ];
    const snapshot = JSON.stringify(invoices);
    const result = financialSummary(invoices, exchange);
    expect(result.totalInvoiced.amount).toBe(6000);
    expect(result.totalPaid.amount).toBe(2800);
    expect(result.totalRemaining.amount).toBe(3200);
    expect(result.payments.toCollect).toBe(3200);
    expect(result.payments.unpaidCount).toBe(2);
    expect(invoices.length).toBe(4);
    expect(JSON.stringify(invoices)).toBe(snapshot);
  });
  it("does not present incomplete sums as exact", () => {
    const result = financialSummary([base, { ...base, currency: "EUR", paid: 200 }], rates);
    expect(result.totalInvoiced.amount).toBeNull();
    expect(result.totalPaid.amount).toBeNull();
    expect(result.totalRemaining.amount).toBeNull();
    expect(result.payments.toCollect).toBeNull();
    expect(result.payments.missingCurrencies).toEqual(["EUR"]);
    expect(result.payments.unpaidCount).toBe(2);
  });
});
