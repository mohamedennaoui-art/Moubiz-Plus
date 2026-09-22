/**
 * Turnover ceiling engine — Moubiz Plus.
 *
 * The Auto-Entrepreneur annual turnover ceiling is a REGIME ceiling, not a tax base.
 * It is never multiplied by a rate and is calculated separately from the tax engine.
 * Rules are versioned so a future Finance Law can change them in one place.
 */

import type { CurrencyCode, Invoice } from "./types";
import { invoiceTotal, toTND } from "./invoices";

export type CeilingRules = {
  version: string;
  annualCeiling: number;
  /** Percent thresholds, descending. */
  thresholds: number[];
};

export const ceilingRules: CeilingRules = {
  version: "2026",
  annualCeiling: 75000,
  thresholds: [100, 95, 90, 80],
};

export type CeilingLevel = "ok" | "p80" | "p90" | "p95" | "p100" | "above";

/**
 * Annual turnover from finalised invoices of a calendar year.
 * Drafts and cancelled invoices are excluded; foreign currencies use the
 * user-configured rates (an invoice with no rate available is skipped).
 */
export function annualTurnover(
  invoices: Invoice[],
  year: number,
  rates: Record<CurrencyCode, number>,
): number {
  return invoices.reduce((sum, inv) => {
    if (inv.status === "draft") return sum;
    const d = new Date(inv.date);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return sum;
    const total = invoiceTotal(inv);
    if (inv.currency === "TND") return sum + total;
    const converted = toTND(total, inv.currency, rates);
    return converted == null ? sum : sum + converted;
  }, 0);
}

export function ceilingPercent(turnover: number, rules: CeilingRules = ceilingRules): number {
  if (!rules.annualCeiling) return 0;
  return (turnover / rules.annualCeiling) * 100;
}

export function ceilingLevel(turnover: number, rules: CeilingRules = ceilingRules): CeilingLevel {
  const p = ceilingPercent(turnover, rules);
  if (turnover > rules.annualCeiling) return "above";
  if (p >= 100) return "p100";
  if (p >= 95) return "p95";
  if (p >= 90) return "p90";
  if (p >= 80) return "p80";
  return "ok";
}

export type CeilingStatus = {
  rulesVersion: string;
  ceiling: number;
  turnover: number;
  percent: number;
  level: CeilingLevel;
  /** i18n key of the warning, null below 80%. */
  messageKey: string | null;
};

const messageKeys: Record<CeilingLevel, string | null> = {
  ok: null,
  p80: "ceiling_80",
  p90: "ceiling_90",
  p95: "ceiling_95",
  p100: "ceiling_100",
  above: "ceiling_above",
};

export function ceilingStatus(turnover: number, rules: CeilingRules = ceilingRules): CeilingStatus {
  const level = ceilingLevel(turnover, rules);
  return {
    rulesVersion: rules.version,
    ceiling: rules.annualCeiling,
    turnover,
    percent: ceilingPercent(turnover, rules),
    level,
    messageKey: messageKeys[level],
  };
}
