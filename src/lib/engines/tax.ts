import type { EngineResult, TaxInputs } from "./types";

/**
 * Tax calculation engine.
 *
 * IMPORTANT: no Tunisian tax rule is invented here. The engine is a pure
 * function of (inputs, ruleset). Load the validated ruleset from the Moubiz
 * Plus Excel prototype by replacing `taxRuleset` below — no UI change needed.
 */
export type TaxRuleset = {
  version: string;
  loaded: boolean;
  /** Called only when `loaded` is true. */
  compute?: (inputs: TaxInputs) => { amount: number; steps: { label: string; value: string }[] };
};

export const taxRuleset: TaxRuleset = {
  version: "non-chargé",
  loaded: false,
};

export function computeTax(inputs: TaxInputs, ruleset: TaxRuleset = taxRuleset): EngineResult {
  const base = [
    { label: "Période", value: inputs.period || "—" },
    { label: "Chiffre d'affaires", value: `${inputs.turnover.toLocaleString("fr-FR")} TND` },
    { label: "Activité", value: inputs.activity },
  ];

  if (!ruleset.loaded || !ruleset.compute) {
    return {
      amount: null,
      applicable: "unknown",
      steps: base,
      explanation:
        "Vos données sont enregistrées. Le montant sera affiché dès que les règles fiscales validées seront chargées dans le moteur de calcul.",
      rulesLoaded: false,
    };
  }

  const { amount, steps } = ruleset.compute(inputs);
  return {
    amount,
    applicable: "yes",
    steps: [...base, ...steps],
    explanation: `Calcul effectué selon les règles version ${ruleset.version}.`,
    rulesLoaded: true,
  };
}
