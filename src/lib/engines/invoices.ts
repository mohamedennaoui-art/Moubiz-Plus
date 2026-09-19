import type { CurrencyCode, Invoice, InvoiceItem, InvoiceStatus } from "./types";

export const lineAmount = (item: InvoiceItem) => (item.quantity || 0) * (item.unitPrice || 0);

export const invoiceSubtotal = (inv: Invoice) => inv.items.reduce((s, i) => s + lineAmount(i), 0);

export const invoiceTotal = (inv: Invoice) => invoiceSubtotal(inv);

export const invoiceRemaining = (inv: Invoice) =>
  Math.max(invoiceTotal(inv) - (inv.paid || 0), 0);

export function derivedStatus(inv: Invoice): InvoiceStatus {
  if (inv.status === "draft") return "draft";
  const total = invoiceTotal(inv);
  if (total > 0 && inv.paid >= total) return "paid";
  if (inv.paid > 0) return "partial";
  return inv.status;
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
