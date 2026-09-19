import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, PageTitle } from "@/components/ui-kit";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { daysUntil, deadlineStatus, pendingAlerts, sortDeadlines } from "@/lib/engines/deadlines";

export const Route = createFileRoute("/echeances")({
  head: () => ({
    meta: [
      { title: "Mes échéances — Moubiz Plus" },
      {
        name: "description",
        content: "Toutes vos obligations, leurs dates et les jours restants, en un coup d'œil.",
      },
      { property: "og:title", content: "Mes échéances — Moubiz Plus" },
      { property: "og:description", content: "Suivi des dates limites et alertes." },
    ],
  }),
  component: DeadlinesPage,
});

const tones = {
  upcoming: "info",
  soon: "warning",
  urgent: "danger",
  overdue: "danger",
  done: "success",
} as const;

function DeadlinesPage() {
  const { t, lang } = useI18n();
  const { data, update } = useStore();
  const list = sortDeadlines(data.deadlines);
  const alerts = pendingAlerts(data.deadlines);

  const toggle = (id: string) =>
    update({
      deadlines: data.deadlines.map((d) => (d.id === id ? { ...d, done: !d.done } : d)),
    });

  return (
    <AppShell>
      <PageTitle title={t("page_deadlines")} />

      {data.profile.remindersEnabled && alerts.length > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
          {t("alert_soon")}
        </div>
      )}

      <div className="grid gap-3">
        {list.map((d) => {
          const status = deadlineStatus(d);
          const days = daysUntil(d.dueDate);
          return (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{lang === "ar" ? d.labelAr : d.labelFr}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("due_date")}: {formatDate(d.dueDate)}
                  </p>
                  {d.amount != null && (
                    <p className="text-sm text-muted-foreground">
                      {t("amount")}: {formatMoney(d.amount)}
                    </p>
                  )}
                </div>
                <Badge tone={tones[status]}>{t(`st_${status}` as never)}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!d.done && (
                  <Badge tone={tones[status]}>
                    {days >= 0 ? `${days} ${t("days_left")}` : `${Math.abs(days)} ${t("days_late")}`}
                  </Badge>
                )}
                <Button variant="outline" onClick={() => toggle(d.id)}>
                  {d.done ? t("edit_data") : t("mark_done")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
