import type { CurrencyCode, Invoice, InvoiceItem, InvoiceStatus } from "./types";

export const lineAmount = (item: InvoiceItem) => (item.quantity || 0) * (item.unitPrice || 0);

export const invoiceSubtotal = (inv: Invoice) => inv.items.reduce((s, i) => s + lineAmount(i), 0);

export const invoiceTotal = (inv: Invoice) => invoiceSubtotal(inv);

export const invoiceRemaining = (inv: Invoice) =>
  Math.max(invoiceTotal(inv) - (inv.paid || 0), 0);

export function derivedStatus(inv: Invoice): InvoiceStatus {
  const total = invoiceTotal(inv);
  const paid = inv.paid || 0;
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0) return "partial";
  // Nothing paid: keep the current workflow status (draft/sent/unpaid) as-is.
  return inv.status;
}

/** Overdue tracking: due date passed and something is still owed. */
export function invoiceOverdue(inv: Invoice, now = new Date()): { late: boolean; days: number } {
  const due = inv.dueDate ? new Date(inv.dueDate) : null;
  if (!due || Number.isNaN(due.getTime()) || invoiceRemaining(inv) <= 0) {
    return { late: false, days: 0 };
  }
  const a = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const b = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const days = Math.round((a - b) / 86400000);
  return days > 0 ? { late: true, days } : { late: false, days: 0 };
}

/**
 * Dashboard payment summary: unpaid invoice count and amount still to collect,
 * expressed in TND using the user-configured rates (unconvertible ones skipped).
 */
export function paymentSummary(invoices: Invoice[], rates: Record<CurrencyCode, number>) {
  const open = invoices.filter((i) => i.status !== "draft" && invoiceRemaining(i) > 0);
  const toCollect = open.reduce((s, i) => {
    const rest = invoiceRemaining(i);
    if (i.currency === "TND") return s + rest;
    const conv = toTND(rest, i.currency, rates);
    return conv == null ? s : s + conv;
  }, 0);
  return { unpaidCount: open.length, toCollect };
}

/** Currency conversion component — rates are configurable, none invented. */
export function toTND(amount: number, currency: CurrencyCode, rates: Record<CurrencyCode, number>) {
  const rate = rates[currency];
  if (!rate || !Number.isFinite(rate)) return null;
  return amount * rate;
}

export function nextInvoiceNumber(invoices: Invoice[]) {
  const year = new Date().getFullYear();
  const n = invoices.length + 1;
  return `F-${year}-${String(n).padStart(3, "0")}`;
}

/** Persist the payment-derived status into the invoice data itself. */
export const syncInvoiceStatus = (inv: Invoice): Invoice => {
  const status = derivedStatus(inv);
  return status === inv.status ? inv : { ...inv, status };
};
