import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { computeTax, currentQuarter } from "@/lib/engines/tax";
import type { ActivityType, LocationType, TaxPeriod } from "@/lib/engines/types";

export const Route = createFileRoute("/impot")({
  head: () => ({
    meta: [
      { title: "Calcul de l'impôt — Moubiz Plus" },
      {
        name: "description",
        content: "Estimez l'impôt de votre activité d'auto-entrepreneur en quelques champs.",
      },
      { property: "og:title", content: "Calcul de l'impôt — Moubiz Plus" },
      { property: "og:description", content: "Estimation simple de votre impôt." },
    ],
  }),
  component: TaxPage,
});

function TaxPage() {
  const { t } = useI18n();
  const { data, update } = useStore();
  const [period, setPeriod] = useState(data.tax?.inputs.period ?? String(new Date().getFullYear()));
  const [turnover, setTurnover] = useState(String(data.tax?.inputs.turnover ?? ""));
  const [activity, setActivity] = useState<ActivityType>(
    data.tax?.inputs.activity ?? data.profile.activity,
  );
  const [locationType, setLocationType] = useState<LocationType>(
    data.tax?.inputs.locationType ?? "MUNICIPAL",
  );
  const [taxPeriod, setTaxPeriod] = useState<TaxPeriod>(
    data.tax?.inputs.taxPeriod ?? currentQuarter(),
  );
  const [showResult, setShowResult] = useState(Boolean(data.tax));

  const submit = () => {
    const inputs = {
      period,
      taxPeriod,
      locationType,
      turnover: Number(turnover) || 0,
      activity,
      registrationDate: data.profile.registrationDate,
    };
    const result = computeTax(inputs);
    update({ tax: { inputs, result, calculatedAt: new Date().toISOString() } });
    setShowResult(true);
  };

  const record = data.tax;
  const ceilingWarning = record
    ? (record.result.details as { ceilingWarning?: string | null } | undefined)?.ceilingWarning
    : null;

  return (
    <AppShell>
      <PageTitle title={t("page_tax")} />

      {!showResult ? (
        <Card className="grid gap-4">
          <Field label={t("period")}>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026" />
          </Field>
          <Field label={t("turnover")}>
            <Input
              type="number"
              inputMode="decimal"
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label={t("activity")}>
            <Select value={activity} onChange={(e) => setActivity(e.target.value as ActivityType)}>
              <option value="services">{t("activity_services")}</option>
              <option value="trade">{t("activity_trade")}</option>
              <option value="craft">{t("activity_craft")}</option>
            </Select>
          </Field>
          <Field label={t("location_type")}>
            <Select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as LocationType)}
            >
              <option value="MUNICIPAL">{t("loc_municipal")}</option>
              <option value="OUTSIDE_MUNICIPAL">{t("loc_outside")}</option>
            </Select>
          </Field>
          <Field label={t("calc_period")}>
            <Select value={taxPeriod} onChange={(e) => setTaxPeriod(e.target.value as TaxPeriod)}>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
              <option value="annual">{t("period_annual")}</option>
            </Select>
          </Field>
          <Button onClick={submit}>{t("calculate")}</Button>
        </Card>
      ) : (
        record && (
          <div className="grid gap-4">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("estimated_to_pay")}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {record.result.amount != null ? formatMoney(record.result.amount) : "— TND"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{record.result.explanation}</p>
            </Card>

            {ceilingWarning && (
              <Card>
                <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">
                  {ceilingWarning}
                </p>
              </Card>
            )}


            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("taxable_info")}
              </p>
              <dl className="mt-3 grid gap-2 text-sm">
                {record.result.steps.map((s) => (
                  <div key={s.label} className="flex justify-between gap-3 border-b border-border pb-2">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setShowResult(false)}>
                {t("edit_data")}
              </Button>
              <Link to="/">
                <Button variant="ghost" className="w-full">
                  {t("back_dashboard")}
                </Button>
              </Link>
            </div>
          </div>
        )
      )}
    </AppShell>
  );
}
