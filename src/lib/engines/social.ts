import type { EngineResult, SocialInputs } from "./types";
import { exemptionEnd, isPaymentExempt, type QuarterKey } from "./deadline-engine";

/**
 * Social contribution (CNSS) engine — Auto-Entrepreneur.
 *
 * Amounts are parameters per year (Excel V26 reference for 2026). To apply a
 * new Finance Law, ADD a new year entry; never edit a past year.
 * Employment status (private employee or not) does NOT change the amount.
 */
export type SocialYearParams = {
  /** Quarterly amounts for activities other than crafts, tranche 1..10. */
  other: number[];
  /** Quarterly reference amount for crafts & traditional industries. */
  craft: number;
};

export const socialParams: Record<string, SocialYearParams> = {
  "2026": {
    other: [
      235.389, 353.084, 470.779, 706.168, 941.558, 1412.337, 2118.505, 2824.673, 3530.841,
      4237.01,
    ],
    craft: 83.211,
  },
};

export const DEFAULT_TRANCHE = 1;

/** Year params: exact year, else latest year not after it, else earliest. */
export function paramsFor(year: number): { version: string; params: SocialYearParams } {
  const years = Object.keys(socialParams).map(Number).sort((a, b) => a - b);
  const pick = [...years].reverse().find((y) => y <= year) ?? years[0]!;
  return { version: String(pick), params: socialParams[String(pick)]! };
}

export type SocialComputation = {
  quarterly: number;
  annual: number;
  theoreticalQuarterly: number;
  tranche: number | null;
  paymentExempt: boolean;
  exemptionEndDate: string | null;
  rulesVersion: string;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function computeSocialDetails(inputs: SocialInputs): SocialComputation {
  const year = Number(inputs.period) || new Date().getFullYear();
  const { version, params } = paramsFor(year);
  const isCraft = inputs.activityCategory === "craft";
  const tranche = isCraft
    ? null
    : Math.min(Math.max(Math.round(inputs.tranche || DEFAULT_TRANCHE), 1), params.other.length);
  const theoreticalQuarterly = isCraft ? params.craft : params.other[tranche! - 1]!;
  const reg = inputs.registrationDate ?? "";
  const q = (inputs.quarter ?? "T4") as QuarterKey;
  const paymentExempt = reg ? isPaymentExempt(year, q, reg) : false;
  const end = reg ? exemptionEnd(reg) : null;
  const quarterly = paymentExempt ? 0 : theoreticalQuarterly;
  return {
    quarterly,
    annual: round3(quarterly * 4),
    theoreticalQuarterly,
    tranche,
    paymentExempt,
    exemptionEndDate: end ? end.toISOString() : null,
    rulesVersion: version,
  };
}

export function computeSocial(inputs: SocialInputs): EngineResult {
  const d = computeSocialDetails(inputs);
  const fmt = (n: number) =>
    `${n.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;
  return {
    amount: d.quarterly,
    applicable: d.paymentExempt ? "no" : "yes",
    steps: [
      { label: "Année / trimestre", value: `${inputs.period} ${inputs.quarter ?? ""}`.trim() },
      {
        label: "Activité",
        value:
          inputs.activityCategory === "craft"
            ? "Artisanat et industries traditionnelles"
            : "Autres activités",
      },
      {
        label: "Situation",
        value:
          inputs.employment === "private_employee"
            ? "Salarié secteur privé + auto-entrepreneur"
            : "Auto-entrepreneur",
      },
      { label: "Tranche", value: d.tranche ? `Tranche ${d.tranche}` : "Tranche de référence" },
      { label: "Montant théorique / trimestre", value: fmt(d.theoreticalQuarterly) },
      { label: "Montant théorique / an", value: fmt(round3(d.theoreticalQuarterly * 4)) },
      { label: "Contribution / trimestre", value: fmt(d.quarterly) },
      { label: "Contribution / an", value: fmt(d.annual) },
      { label: "Paramètres", value: d.rulesVersion },
    ],
    explanation: d.paymentExempt
      ? `Exonéré — période d'exonération (calculée à partir de la date d'inscription, jusqu'au ${
          d.exemptionEndDate ? new Date(d.exemptionEndDate).toLocaleDateString("fr-FR") : "—"
        }).`
      : "Contribution calculée selon l'activité et la tranche choisie (paramètres de l'année).",
    rulesLoaded: true,
    details: d,
  };
}
