import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, PageTitle } from "@/components/ui-kit";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { derivedStatus, invoiceRemaining, invoiceTotal } from "@/lib/engines/invoices";
import type { InvoiceStatus } from "@/lib/engines/types";

export const Route = createFileRoute("/factures/")({
  head: () => ({
    meta: [
      { title: "Mes factures — Moubiz Plus" },
      {
        name: "description",
        content: "Créez vos factures, suivez les montants payés et le reste à payer.",
      },
      { property: "og:title", content: "Mes factures — Moubiz Plus" },
      { property: "og:description", content: "Historique et statuts de vos factures." },
    ],
  }),
  component: InvoicesPage,
});

const statusTone = {
  draft: "neutral",
  sent: "info",
  partial: "warning",
  paid: "success",
  unpaid: "danger",
} as const;

const statusKey: Record<InvoiceStatus, string> = {
  draft: "inv_draft",
  sent: "inv_sent",
  partial: "inv_partial",
  paid: "inv_paid",
  unpaid: "inv_unpaid",
};

function InvoicesPage() {
  const { t } = useI18n();
  const { data } = useStore();
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");

  const invoices = data.invoices.filter((i) => filter === "all" || derivedStatus(i) === filter);

  return (
    <AppShell>
      <PageTitle title={t("page_invoices")} subtitle={t("invoice_history")} />

      <Link to="/factures/nouvelle" className="mb-4 block">
        <Button className="w-full">{t("new_invoice")}</Button>
      </Link>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "draft", "sent", "partial", "paid", "unpaid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-bold " +
              (filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground")
            }
          >
            {f === "all" ? t("filter_all") : t(statusKey[f] as never)}
          </button>
        ))}
      </div>

      {invoices.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">{t("no_invoices")}</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {invoices.map((inv) => {
            const st = derivedStatus(inv);
            return (
              <Link key={inv.id} to="/factures/$id" params={{ id: inv.id }}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold">
                        {inv.number} · {inv.customer.name || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(inv.date)}</p>
                    </div>
                    <Badge tone={statusTone[st]}>{t(statusKey[st] as never)}</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">{t("total")}</dt>
                      <dd className="font-bold">{formatMoney(invoiceTotal(inv), inv.currency)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("paid_amount")}</dt>
                      <dd className="font-bold">{formatMoney(inv.paid, inv.currency)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("remaining")}</dt>
                      <dd className="font-bold">
                        {formatMoney(invoiceRemaining(inv), inv.currency)}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
