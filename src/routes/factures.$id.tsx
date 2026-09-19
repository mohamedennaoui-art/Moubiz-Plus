import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, PageTitle } from "@/components/ui-kit";
import { formatDate, formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import {
  derivedStatus,
  invoiceRemaining,
  invoiceTotal,
  lineAmount,
  toTND,
} from "@/lib/engines/invoices";
import type { InvoiceStatus } from "@/lib/engines/types";

export const Route = createFileRoute("/factures/$id")({
  head: () => ({
    meta: [
      { title: "Facture — Moubiz Plus" },
      { name: "description", content: "Facture bilingue prête à imprimer ou à envoyer en PDF." },
      { property: "og:title", content: "Facture — Moubiz Plus" },
      { property: "og:description", content: "Détail de votre facture." },
    ],
  }),
  component: InvoiceDetail,
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

function InvoiceDetail() {
  const { id } = useParams({ from: "/factures/$id" });
  const { t } = useI18n();
  const { data, update } = useStore();
  const invoice = data.invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm text-muted-foreground">{t("no_invoices")}</p>
          <Link to="/factures" className="mt-4 block">
            <Button variant="outline" className="w-full">
              {t("page_invoices")}
            </Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const total = invoiceTotal(invoice);
  const remaining = invoiceRemaining(invoice);
  const st = derivedStatus(invoice);
  const tnd =
    invoice.currency === "TND" ? null : toTND(total, invoice.currency, data.profile.rates);

  const setPaid = (value: number) =>
    update({
      invoices: data.invoices.map((i) => (i.id === invoice.id ? { ...i, paid: value } : i)),
    });

  return (
    <AppShell>
      <div className="no-print">
        <PageTitle title={`${t("card_invoices")} ${invoice.number}`} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[st]}>{t(statusKey[st] as never)}</Badge>
          <Button onClick={() => window.print()}>{t("download_pdf")}</Button>
          <Link to="/factures">
            <Button variant="outline">{t("invoice_history")}</Button>
          </Link>
        </div>
        <Card className="mb-4">
          <Field label={t("paid_amount")}>
            <Input
              type="number"
              inputMode="decimal"
              value={invoice.paid}
              onChange={(e) => setPaid(Number(e.target.value) || 0)}
            />
          </Field>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("remaining")}: {formatMoney(remaining, invoice.currency)}
          </p>
        </Card>
      </div>

      <div className="print-sheet card-surface p-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-lg font-extrabold">{data.profile.name || t("seller")}</p>
            <p className="text-xs text-muted-foreground">{data.profile.identifier}</p>
            <p className="text-xs text-muted-foreground">{data.profile.address}</p>
            <p className="text-xs text-muted-foreground">
              {data.profile.phone} {data.profile.email}
            </p>
          </div>
          <div className="text-end">
            <p className="text-base font-bold">
              Facture / <span className="font-arabic">فاتورة</span>
            </p>
            <p className="text-sm font-semibold">{invoice.number}</p>
            <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
            {invoice.dueDate && (
              <p className="text-xs text-muted-foreground">
                {t("due_date")}: {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
        </div>

        <div className="border-b border-border py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Client / <span className="font-arabic">الحريف</span>
          </p>
          <p className="text-sm font-semibold">{invoice.customer.name}</p>
          <p className="text-xs text-muted-foreground">{invoice.customer.identifier}</p>
          <p className="text-xs text-muted-foreground">{invoice.customer.address}</p>
          <p className="text-xs text-muted-foreground">{invoice.customer.contact}</p>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs text-muted-foreground">
              <th className="py-2 text-start font-semibold">بيان / Désignation</th>
              <th className="py-2 text-end font-semibold">الكمية / Quantité</th>
              <th className="py-2 text-end font-semibold">السعر الوحدوي / P.U.</th>
              <th className="py-2 text-end font-semibold">المبلغ / Montant</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-border align-top">
                <td className="py-3 pe-2">{item.description}</td>
                <td className="py-3 text-end">{item.quantity}</td>
                <td className="py-3 text-end">{item.unitPrice.toFixed(3)}</td>
                <td className="py-3 text-end font-semibold">{lineAmount(item).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ms-auto grid max-w-xs gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">المجموع / {t("total")}</span>
            <span className="font-extrabold">{formatMoney(total, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المبلغ المدفوع / {t("paid_amount")}</span>
            <span className="font-semibold">{formatMoney(invoice.paid, invoice.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الباقي / {t("remaining")}</span>
            <span className="font-semibold">{formatMoney(remaining, invoice.currency)}</span>
          </div>
          {invoice.currency !== "TND" && (
            <p className="text-xs text-muted-foreground">
              {tnd != null ? `${t("equiv_tnd")}: ${formatMoney(tnd)}` : t("rate_note")}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
