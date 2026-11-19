/**
 * Turnover ceiling engine — Moubiz Plus.
 *
 * The Auto-Entrepreneur annual turnover ceiling is a REGIME ceiling, not a tax base.
 * It is never multiplied by a rate and is calculated separately from the tax engine.
 * Rules are versioned so a future Finance Law can change them in one place.
 */

import type { CurrencyCode, Invoice } from "./types";
import { invoiceTotal, sumInTND } from "./invoices";

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
 * Drafts are excluded; foreign currencies use the user-configured rates.
 * An unavailable conversion makes the total unknown, not artificially lower.
 */
export function annualTurnover(
  invoices: Invoice[],
  year: number,
  rates: Record<CurrencyCode, number>,
): number | null {
  return annualTurnoverSummary(invoices, year, rates).amount;
}

export function annualTurnoverSummary(invoices: Invoice[], year: number, rates: Record<CurrencyCode, number>) {
  const selected = invoices.filter((invoice) => {
    const date = new Date(invoice.date);
    return invoice.status !== "draft" && !Number.isNaN(date.getTime()) && date.getUTCFullYear() === year;
  });
  return sumInTND(selected, rates, invoiceTotal);
}

export function ceilingPercent(turnover: number, rules: CeilingRules = ceilingRules): number {
  if (!rules.annualCeiling) return 0;
  return (turnover / rules.annualCeiling) * 100;
}

export function ceilingLevel(turnover: number, rules: CeilingRules = ceilingRules): CeilingLevel {
  const p = ceilingPercent(turnover, rules);
  if (turnover > rules.annualCeiling) return "above";
  const levels: CeilingLevel[] = ["p100", "p95", "p90", "p80"];
  const index = rules.thresholds.findIndex((threshold) => p >= threshold);
  if (index >= 0) return levels[index] ?? "ok";
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
