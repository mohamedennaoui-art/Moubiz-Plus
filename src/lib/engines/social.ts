import type { EngineResult, SocialInputs } from "./types";

/**
 * Social contribution (CNSS) engine.
 *
 * No CNSS rule is invented here. Applicability and amount both come from the
 * ruleset, so exceptions and situations are data, not hard-coded text.
 */
export type SocialRule = {
  situation: SocialInputs["situation"];
  applicable: "yes" | "no";
  amount?: (inputs: SocialInputs) => number;
  note: string;
};

export type SocialRuleset = {
  version: string;
  loaded: boolean;
  rules: SocialRule[];
};

export const socialRuleset: SocialRuleset = {
  version: "non-chargé",
  loaded: false,
  rules: [],
};

export function computeSocial(
  inputs: SocialInputs,
  ruleset: SocialRuleset = socialRuleset,
): EngineResult {
  const base = [
    { label: "Période", value: inputs.period || "—" },
    { label: "Situation", value: inputs.situation },
  ];

  const rule = ruleset.loaded ? ruleset.rules.find((r) => r.situation === inputs.situation) : null;

  if (!rule) {
    return {
      amount: null,
      applicable: "unknown",
      steps: base,
      explanation:
        "Votre situation est enregistrée. L'applicabilité et le montant seront affichés dès que les règles sociales validées seront chargées.",
      rulesLoaded: false,
    };
  }

  if (rule.applicable === "no") {
    return {
      amount: 0,
      applicable: "no",
      steps: base,
      explanation: rule.note,
      rulesLoaded: true,
    };
  }

  return {
    amount: rule.amount ? rule.amount(inputs) : 0,
    applicable: "yes",
    steps: base,
    explanation: rule.note,
    rulesLoaded: true,
  };
}
