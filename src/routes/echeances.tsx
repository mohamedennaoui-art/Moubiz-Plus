import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { formatDate, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  buildYear,
  emptyEntry,
  unpaidContributionCount,
  zeroDeclarationCount,
  type QuarterEntry,
  type QuarterObligation,
} from "@/lib/engines/deadline-engine";

export const Route = createFileRoute("/echeances")({
  head: () => ({
    meta: [
      { title: "Mes échéances — Moubiz Plus" },
      {
        name: "description",
        content:
          "Trimestres, dates limites à J+15, exonération de la première année, statuts de déclaration et de paiement.",
      },
      { property: "og:title", content: "Mes échéances — Moubiz Plus" },
      { property: "og:description", content: "Suivi trimestriel, statuts et rappels." },
    ],
  }),
  component: DeadlinesPage,
});

const decTone = { todo: "warning", declared: "success", late: "danger" } as const;
const payTone = { to_pay: "warning", paid: "success", late: "danger" } as const;

function DeadlinesPage() {
  const { t } = useI18n();
  const { data, update } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());

  const list = useMemo<QuarterObligation[]>(
    () => buildYear(year, data.profile.registrationDate, data.quarterEntries),
    [year, data.profile.registrationDate, data.quarterEntries],
  );

  const setEntry = (id: string, patch: Partial<QuarterEntry>) => {
    const current = data.quarterEntries[id] ?? emptyEntry;
    update({ quarterEntries: { ...data.quarterEntries, [id]: { ...current, ...patch } } });
  };

  const years = [year - 1, year, year + 1];

  if (!data.profile.registrationDate) {
    return (
      <AppShell>
        <PageTitle title={t("page_deadlines")} />
        <Card>
          <p className="text-sm text-muted-foreground">{t("no_registration")}</p>
          <Link to="/profil" className="mt-4 block">
            <Button className="w-full">{t("edit_data")}</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const alerts = list.filter((o) => o.notification);

  return (
    <AppShell>
      <PageTitle title={t("page_deadlines")} />

      <div className="mb-4 grid gap-3">
        <Field label={t("year")}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs font-semibold text-muted-foreground">{t("zero_declarations")}</p>
            <p className="mt-1 text-2xl font-extrabold">{zeroDeclarationCount(list)}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-muted-foreground">
              {t("unpaid_contributions")}
            </p>
            <p className="mt-1 text-2xl font-extrabold">{unpaidContributionCount(list)}</p>
          </Card>
        </div>
      </div>

      {data.profile.remindersEnabled && alerts.length > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
          {t("alert_soon")}
        </div>
      )}

      <div className="grid gap-3">
        {list.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold">
                  {o.quarter} {o.year}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("quarter_period")}: {formatDate(o.start)} — {formatDate(o.end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("due_date")}: {formatDate(o.dueDate)}
                </p>
              </div>
              {o.exempt ? (
                <Badge tone="info">{t("exempt")}</Badge>
              ) : (
                <Badge tone={o.daysLeft >= 0 ? "info" : "danger"}>
                  {o.daysLeft >= 0
                    ? `${o.daysLeft} ${t("days_left")}`
                    : `${Math.abs(o.daysLeft)} ${t("days_late")}`}
                </Badge>
              )}
            </div>

            {!o.exempt && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={decTone[o.declaration]}>
                    {t("declaration")}: {t(`dec_${o.declaration}` as never)}
                  </Badge>
                  <Badge tone={payTone[o.payment]}>
                    {t("payment")}: {t(`pay_${o.payment}` as never)}
                  </Badge>
                </div>

                {o.notification && (
                  <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">
                    {o.notification.kind === "overdue"
                      ? `${t("notif_overdue")} — ${o.notification.days} ${t("days_late")}`
                      : `${o.notification.days} ${t("days_left")}`}
                  </p>
                )}

                <div className="mt-3 grid gap-3">
                  <Field label={t("declared_turnover")}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={o.entry.turnover ?? ""}
                      onChange={(e) =>
                        setEntry(o.id, {
                          turnover: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={o.entry.declared ? "outline" : "primary"}
                      onClick={() => setEntry(o.id, { declared: !o.entry.declared })}
                    >
                      {o.entry.declared ? t("undo") : t("mark_declared")}
                    </Button>
                    <Button
                      variant={o.entry.paid ? "outline" : "primary"}
                      onClick={() => setEntry(o.id, { paid: !o.entry.paid })}
                    >
                      {o.entry.paid ? t("undo") : t("mark_paid")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
