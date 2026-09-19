import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { computeSocial } from "@/lib/engines/social";
import type { SocialSituation } from "@/lib/engines/types";

export const Route = createFileRoute("/contribution")({
  head: () => ({
    meta: [
      { title: "Contribution sociale — Moubiz Plus" },
      {
        name: "description",
        content: "Vérifiez si la contribution sociale s'applique à votre situation et son montant.",
      },
      { property: "og:title", content: "Contribution sociale — Moubiz Plus" },
      { property: "og:description", content: "Applicabilité et montant de votre contribution." },
    ],
  }),
  component: SocialPage,
});

function SocialPage() {
  const { t } = useI18n();
  const { data, update } = useStore();
  const [period, setPeriod] = useState(
    data.social?.inputs.period ?? String(new Date().getFullYear()),
  );
  const [situation, setSituation] = useState<SocialSituation>(
    data.social?.inputs.situation ?? "main",
  );
  const [turnover, setTurnover] = useState(String(data.social?.inputs.turnover ?? ""));
  const [showResult, setShowResult] = useState(Boolean(data.social));

  const submit = () => {
    const inputs = { period, situation, turnover: Number(turnover) || 0 };
    const result = computeSocial(inputs);
    update({ social: { inputs, result, calculatedAt: new Date().toISOString() } });
    setShowResult(true);
  };

  const record = data.social;

  return (
    <AppShell>
      <PageTitle title={t("page_social")} />

      {!showResult ? (
        <Card className="grid gap-4">
          <Field label={t("period")}>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026" />
          </Field>
          <Field label={t("social_situation")}>
            <Select
              value={situation}
              onChange={(e) => setSituation(e.target.value as SocialSituation)}
            >
              <option value="main">{t("sit_main")}</option>
              <option value="secondary">{t("sit_secondary")}</option>
              <option value="covered">{t("sit_covered")}</option>
            </Select>
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
          <Button onClick={submit}>{t("calculate")}</Button>
        </Card>
      ) : (
        record && (
          <div className="grid gap-4">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("result_social")}
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {record.result.amount != null ? formatMoney(record.result.amount) : "— TND"}
              </p>
              <p className="mt-3">
                <Badge
                  tone={
                    record.result.applicable === "yes"
                      ? "success"
                      : record.result.applicable === "no"
                        ? "neutral"
                        : "neutral"
                  }
                >
                  {t("status")}:{" "}
                  {record.result.applicable === "yes"
                    ? t("applicable")
                    : record.result.applicable === "no"
                      ? t("not_applicable")
                      : t("undetermined")}
                </Badge>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{record.result.explanation}</p>
            </Card>

            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("summary")}
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
