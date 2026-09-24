import type { EngineResult, TaxInputs, TaxPeriod } from "./types";

/**
 * Tax calculation engine — Moubiz Plus V26 validated rules.
 *
 * Auto-Entrepreneur income tax is a FIXED amount driven by the location of the
 * activity. Turnover never changes the amount; it is only checked separately
 * against the annual ceiling. Rules are configurable for future Finance Laws.
 */
export type TaxRuleset = {
  version: string;
  loaded: boolean;
  /** Annual ceiling used only for eligibility validation, never as a tax base. */
  annualCeiling: number;
  amounts: Record<TaxInputs["locationType"], { annual: number; quarterly: number }>;
};

export const taxRuleset: TaxRuleset = {
  version: "2026",
  loaded: true,
  annualCeiling: 75000,
  amounts: {
    MUNICIPAL: { annual: 200, quarterly: 50 },
    OUTSIDE_MUNICIPAL: { annual: 100, quarterly: 25 },
  },
};

export type CeilingStatus = "within" | "above";

/** Turnover ceiling validation — kept independent from the tax amount. */
export function checkCeiling(
  annualTurnover: number,
  ruleset: TaxRuleset = taxRuleset,
): { status: CeilingStatus; ceiling: number; warning: string | null } {
  const above = annualTurnover > ruleset.annualCeiling;
  return {
    status: above ? "above" : "within",
    ceiling: ruleset.annualCeiling,
    warning: above ? "Le chiffre d'affaires dépasse le plafond annuel de 75 000 TND." : null,
  };
}

export function isQuarter(period: TaxPeriod): boolean {
  return period !== "annual";
}

export function currentQuarter(date = new Date()): Exclude<TaxPeriod, "annual"> {
  return (["Q1", "Q2", "Q3", "Q4"] as const)[Math.floor(date.getMonth() / 3)]!;
}

export type TaxComputation = {
  locationType: TaxInputs["locationType"];
  period: TaxPeriod;
  turnover: number;
  annualTax: number;
  quarterlyTax: number;
  /** Theoretical amount from the ruleset, before any exemption. */
  theoreticalTax: number;
  /** Amount actually due (0 during the exemption period). */
  calculatedTax: number;
  paymentExempt: boolean;
  exemptionEndDate: string | null;
  ceilingStatus: CeilingStatus;
  ceilingWarning: string | null;
  rulesVersion: string;
};

/** Pure tax amount computation (no ceiling logic mixed in). */
export function computeTaxAmount(
  locationType: TaxInputs["locationType"],
  period: TaxPeriod,
  ruleset: TaxRuleset = taxRuleset,
): { annualTax: number; quarterlyTax: number; calculatedTax: number } {
  const a = ruleset.amounts[locationType];
  return {
    annualTax: a.annual,
    quarterlyTax: a.quarterly,
    calculatedTax: isQuarter(period) ? a.quarterly : a.annual,
  };
}

export function computeTaxDetails(
  inputs: TaxInputs,
  ruleset: TaxRuleset = taxRuleset,
): TaxComputation {
  const amounts = computeTaxAmount(inputs.locationType, inputs.taxPeriod, ruleset);
  const ceiling = checkCeiling(inputs.turnover, ruleset);
  const year = Number(inputs.period) || new Date().getFullYear();
  const reg = inputs.registrationDate ?? "";
  // The quarter checked for an annual period is T4: if T4 is exempt, the whole
  // year is inside the exemption window.
  const quarterKey = (isQuarter(inputs.taxPeriod)
    ? inputs.taxPeriod.replace("Q", "T")
    : "T4") as QuarterKey;
  const exemptEnd = reg ? exemptionEnd(reg) : null;
  const paymentExempt = reg ? isPaymentExempt(year, quarterKey, reg) : false;
  return {
    locationType: inputs.locationType,
    period: inputs.taxPeriod,
    turnover: inputs.turnover,
    ...amounts,
    theoreticalTax: amounts.calculatedTax,
    calculatedTax: paymentExempt ? 0 : amounts.calculatedTax,
    paymentExempt,
    exemptionEndDate: exemptEnd ? exemptEnd.toISOString() : null,
    ceilingStatus: ceiling.status,
    ceilingWarning: ceiling.warning,
    rulesVersion: ruleset.version,
  };
}

const LOCATION_LABEL: Record<TaxInputs["locationType"], string> = {
  MUNICIPAL: "Zone communale",
  OUTSIDE_MUNICIPAL: "Hors zone communale",
};

const ACTIVITY_LABEL: Record<TaxInputs["activity"], string> = {
  services: "Services",
  trade: "Commerce",
  craft: "Artisanat",
};

export function computeTax(inputs: TaxInputs, ruleset: TaxRuleset = taxRuleset): EngineResult {
  const d = computeTaxDetails(inputs, ruleset);
  return {
    amount: d.calculatedTax,
    applicable: "yes",
    steps: [
      { label: "Activité", value: ACTIVITY_LABEL[inputs.activity] },
      { label: "Localisation", value: LOCATION_LABEL[d.locationType] },
      { label: "Période", value: d.period === "annual" ? "Annuel" : d.period },
      { label: "Chiffre d'affaires", value: `${d.turnover.toLocaleString("fr-FR")} TND` },
      {
        label: "Plafond 75 000 TND",
        value: d.ceilingStatus === "within" ? "Dans le plafond" : "Dépassé",
      },
    ],
    explanation:
      "Le montant de l'impôt est déterminé selon la localisation de l'activité. Le plafond de chiffre d'affaires est vérifié séparément.",
    rulesLoaded: true,
    details: d,
  };
}
