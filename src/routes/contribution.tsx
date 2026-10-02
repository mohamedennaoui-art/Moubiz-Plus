import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  computeSocial,
  computeSocialDetails,
  normalizeSocialInputs,
  paramsFor,
} from "@/lib/engines/social";
import type { SocialInputs } from "@/lib/engines/types";

export const Route = createFileRoute("/contribution")({
  head: () => ({
    meta: [
      { title: "Contribution sociale — Moubiz Plus" },
      {
        name: "description",
        content: "Calculez votre contribution sociale trimestrielle et annuelle selon votre tranche.",
      },
      { property: "og:title", content: "Contribution sociale — Moubiz Plus" },
      { property: "og:description", content: "Contribution sociale par tranche, trimestre et année." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SocialPage,
});

function SocialPage() {
  const { t } = useI18n();
  const { data, update } = useStore();
  const [form, setForm] = useState<SocialInputs>(
    normalizeSocialInputs(data.social?.inputs, data.profile),
  );
  const [showResult, setShowResult] = useState(Boolean(data.social));
  const set = (p: Partial<SocialInputs>) => setForm({ ...form, ...p });
  const trancheCount = paramsFor(Number(form.period) || 2026).params.other.length;

  const submit = () => {
    const inputs = normalizeSocialInputs(form, data.profile);
    update({ social: { inputs, result: computeSocial(inputs), calculatedAt: new Date().toISOString() } });
    setShowResult(true);
  };

  // Always recompute from inputs + current profile registration date.
  const inputs = data.social ? normalizeSocialInputs(data.social.inputs, data.profile) : null;
  const result = inputs ? computeSocial(inputs) : null;
  const d = inputs ? computeSocialDetails(inputs) : null;

  return (
    <AppShell>
      <PageTitle title={t("page_social")} />

      {!showResult || !result || !d ? (
        <Card className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("period")}>
              <Input value={form.period} onChange={(e) => set({ period: e.target.value })} placeholder="2026" />
            </Field>
            <Field label={t("quarter")}>
              <Select value={form.quarter} onChange={(e) => set({ quarter: e.target.value as "T1" })}>
                {(["T1", "T2", "T3", "T4"] as const).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t("social_activity")}>
            <Select
              value={form.activityCategory}
              onChange={(e) => set({ activityCategory: e.target.value as SocialInputs["activityCategory"] })}
            >
              <option value="other">{t("social_act_other")}</option>
              <option value="craft">{t("social_act_craft")}</option>
            </Select>
          </Field>
          {form.activityCategory === "other" && (
            <Field label={t("social_tranche")}>
              <Select value={form.tranche} onChange={(e) => set({ tranche: Number(e.target.value) })}>
                {Array.from({ length: trancheCount }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {t("tranche")} {i + 1} — {formatMoney(paramsFor(Number(form.period) || 2026).params.other[i]!)} / {t("per_quarter")}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={t("social_situation")}>
            <Select
              value={form.employment}
              onChange={(e) => set({ employment: e.target.value as SocialInputs["employment"] })}
            >
              <option value="independent">{t("sit_independent")}</option>
              <option value="private_employee">{t("sit_private_employee")}</option>
            </Select>
          </Field>
          <Button onClick={submit}>{t("calculate")}</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("result_social")}
            </p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {formatMoney(d.quarterly)} <span className="text-base font-semibold">/ {t("per_quarter")}</span>
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatMoney(d.annual)} / {t("per_year")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {d.tranche ? `${t("tranche")} ${d.tranche}` : t("social_act_craft")}
            </p>
            <p className="mt-3">
              <Badge tone={d.paymentExempt ? "neutral" : "success"}>
                {t("status")}: {d.paymentExempt ? t("social_exempt") : t("social_not_exempt")}
              </Badge>
            </p>
            {d.paymentExempt && d.exemptionEndDate && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("social_exempt_until")} {formatDate(d.exemptionEndDate)}
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">{result.explanation}</p>
          </Card>

          <Card>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("summary")}
            </p>
            <dl className="mt-3 grid gap-2 text-sm">
              {result.steps.map((s) => (
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
      )}
    </AppShell>
  );
}
