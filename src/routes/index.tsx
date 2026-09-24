import { computeTax } from "@/lib/engines/tax";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Select } from "@/components/ui-kit";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { buildYear, nextObligation } from "@/lib/engines/deadline-engine";
import { invoiceRemaining, invoiceTotal, paymentSummary } from "@/lib/engines/invoices";
import { annualTurnover, ceilingStatus } from "@/lib/engines/ceiling";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moubiz Plus — Assistant du Moubader Dhati" },
      {
        name: "description",
        content:
          "Impôt, contribution sociale, échéances et factures pour les auto-entrepreneurs tunisiens.",
      },
      { property: "og:title", content: "Moubiz Plus — Assistant du Moubader Dhati" },
      {
        property: "og:description",
        content:
          "Calculez votre impôt, votre contribution sociale, suivez vos échéances et créez vos factures.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { data } = useStore();
  const [ceilingYear, setCeilingYear] = useState(new Date().getFullYear());
  const next = data.profile.registrationDate
    ? nextObligation(
        buildYear(new Date().getFullYear(), data.profile.registrationDate, data.quarterEntries),
      )
    : null;
  const totalInvoiced = data.invoices.reduce((s, i) => s + invoiceTotal(i), 0);
  const totalPaid = data.invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const totalRemaining = data.invoices.reduce((s, i) => s + invoiceRemaining(i), 0);
  const summary = paymentSummary(data.invoices, data.profile.rates);
  const ceiling = ceilingStatus(
    annualTurnover(data.invoices, ceilingYear, data.profile.rates),
  );
  const ceilingYears = [ceilingYear - 1, ceilingYear, ceilingYear + 1];

  const late = next ? next.daysLeft < 0 : false;
  const tone = late ? "danger" : next && next.daysLeft <= 15 ? "warning" : "info";

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">{t("appName")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("annual_turnover")}
            </p>
            <Select
              aria-label={t("year")}
              value={ceilingYear}
              onChange={(e) => setCeilingYear(Number(e.target.value))}
              className="h-9 w-24 text-xs"
            >
              {ceilingYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">
            {formatMoney(ceiling.turnover)} / {formatMoney(ceiling.ceiling)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={
                "h-full rounded-full " +
                (ceiling.level === "ok"
                  ? "bg-primary"
                  : ceiling.level === "p80" || ceiling.level === "p90"
                    ? "bg-warning"
                    : "bg-destructive")
              }
              style={{ width: `${Math.min(100, Math.round(ceiling.percent))}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {Math.round(ceiling.percent)} % {t("ceiling_used")}
          </p>
          {ceiling.messageKey && (
            <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
              {t(ceiling.messageKey as never)}
            </p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("card_tax")}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">
            {data.tax
              ? formatMoney(
                  computeTax({
                    ...data.tax.inputs,
                    registrationDate: data.profile.registrationDate,
                  }).amount ?? 0,
                )
              : t("not_calculated")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.tax
              ? `${t("calculated_on")} ${formatDate(data.tax.calculatedAt)}`
              : t("rules_pending")}
          </p>
          <Link to="/impot" className="mt-4 block">
            <Button className="w-full">{t("btn_calc_tax")}</Button>
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("card_social")}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">
            {data.social?.result.amount != null
              ? formatMoney(data.social.result.amount)
              : t("not_calculated")}
          </p>
          <p className="mt-2">
            <Badge
              tone={
                data.social?.result.applicable === "yes"
                  ? "success"
                  : data.social?.result.applicable === "no"
                    ? "neutral"
                    : "neutral"
              }
            >
              {t("status")}:{" "}
              {data.social?.result.applicable === "yes"
                ? t("applicable")
                : data.social?.result.applicable === "no"
                  ? t("not_applicable")
                  : t("undetermined")}
            </Badge>
          </p>
          <Link to="/contribution" className="mt-4 block">
            <Button className="w-full">{t("btn_calc_social")}</Button>
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("card_deadline")}
          </p>
          {next ? (
            <>
              <p className="mt-2 text-lg font-bold">
                {next.quarter} {next.year}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("due_date")}: {formatDate(next.dueDate)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={tone}>
                  {next.daysLeft >= 0
                    ? `${next.daysLeft} ${t("days_left")}`
                    : `${Math.abs(next.daysLeft)} ${t("days_late")}`}
                </Badge>
                <Badge tone={tone}>
                  {t("declaration")}: {t(`dec_${next.declaration}` as never)}
                </Badge>
              </div>
              {next.notification && (
                <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
                  {t("alert_soon")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("no_deadline")}</p>
          )}
          <Link to="/echeances" className="mt-4 block">
            <Button variant="outline" className="w-full">
              {t("btn_deadlines")}
            </Button>
          </Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("card_invoices")}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("invoices_count")}</dt>
              <dd className="text-lg font-bold">{data.invoices.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("total_invoiced")}</dt>
              <dd className="text-lg font-bold">{formatMoney(totalInvoiced)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("total_paid")}</dt>
              <dd className="text-lg font-bold">{formatMoney(totalPaid)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("total_remaining")}</dt>
              <dd className="text-lg font-bold">{formatMoney(totalRemaining)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("unpaid_invoices")}</dt>
              <dd className="text-lg font-bold">{summary.unpaidCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("to_collect")}</dt>
              <dd className="text-lg font-bold">{formatMoney(summary.toCollect)}</dd>
            </div>
          </dl>
          <Link to="/factures/nouvelle" className="mt-4 block">
            <Button className="w-full">{t("btn_new_invoice")}</Button>
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
