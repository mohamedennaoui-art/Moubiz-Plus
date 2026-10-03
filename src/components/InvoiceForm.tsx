import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { formatMoney, useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { lineAmount, nextInvoiceNumber } from "@/lib/engines/invoices";
import type { CurrencyCode, Invoice, InvoiceItem, InvoiceStatus } from "@/lib/engines/types";

const emptyItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export function InvoiceForm({ existing }: { existing?: Invoice }) {
  const { t } = useI18n();
  const { data, update } = useStore();
  const navigate = useNavigate();

  const [number, setNumber] = useState(existing?.number ?? nextInvoiceNumber(data.invoices));
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(existing?.currency ?? "TND");
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status ?? "draft");
  const [customer, setCustomer] = useState(existing?.customer ?? { name: "", identifier: "", address: "", contact: "" });
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items.length ? existing.items : [emptyItem()]);
  const [paid, setPaid] = useState(String(existing?.paid ?? 0));

  const subtotal = items.reduce((s, i) => s + lineAmount(i), 0);
  const remaining = Math.max(subtotal - (Number(paid) || 0), 0);

  const setItem = (id: string, patch: Partial<InvoiceItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const save = () => {
    const invoice: Invoice = {
      id: existing?.id ?? crypto.randomUUID(),
      number,
      date,
      dueDate,
      currency,
      customer,
      items,
      paid: Number(paid) || 0,
      status,
    };
    update({
      invoices: existing
        ? data.invoices.map((i) => (i.id === existing.id ? invoice : i))
        : [invoice, ...data.invoices],
    });
    navigate({ to: "/factures/$id", params: { id: invoice.id } });
  };

  return (
    <AppShell>
      <PageTitle title={existing ? `${t("edit_invoice")} ${existing.number}` : t("new_invoice")} />

      <div className="grid gap-4">
        <Card className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("seller")}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.profile.name || "—"} · {data.profile.identifier || "—"}
          </p>
          <Link to="/profil">
            <Button variant="outline" className="w-full">
              {t("edit_data")}
            </Button>
          </Link>
        </Card>

        <Card className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("customer")}
          </p>
          <Field label={t("name")}>
            <Input
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            />
          </Field>
          <Field label={t("identifier")}>
            <Input
              value={customer.identifier}
              onChange={(e) => setCustomer({ ...customer, identifier: e.target.value })}
            />
          </Field>
          <Field label={t("address")}>
            <Input
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            />
          </Field>
          <Field label={`${t("phone")} / ${t("email")}`}>
            <Input
              value={customer.contact}
              onChange={(e) => setCustomer({ ...customer, contact: e.target.value })}
            />
          </Field>
        </Card>

        <Card className="grid gap-3">
          <Field label={t("invoice_number")}>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("invoice_date")}>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t("due_date")}>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("currency")}>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
            <Field label={t("status")}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
                <option value="draft">{t("inv_draft")}</option>
                <option value="sent">{t("inv_sent")}</option>
                <option value="unpaid">{t("inv_unpaid")}</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="grid gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="grid gap-3 border-b border-border pb-4 last:border-0">
              <Field label={`${t("designation")} ${idx + 1}`}>
                <Input
                  value={item.description}
                  onChange={(e) => setItem(item.id, { description: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("quantity")}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(e) => setItem(item.id, { quantity: Number(e.target.value) })}
                  />
                </Field>
                <Field label={t("unit_price")}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => setItem(item.id, { unitPrice: Number(e.target.value) })}
                  />
                </Field>
                <Field label={t("line_amount")}>
                  <Input value={lineAmount(item).toFixed(3)} readOnly />
                </Field>
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                >
                  {t("remove_line")}
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={() => setItems([...items, emptyItem()])}>
            {t("add_line")}
          </Button>
        </Card>

        <Card className="grid gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="font-bold">{formatMoney(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-muted-foreground">{t("total")}</span>
            <span className="font-extrabold">{formatMoney(subtotal, currency)}</span>
          </div>
          <Field label={t("paid_amount")}>
            <Input
              type="number"
              inputMode="decimal"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
            />
          </Field>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("remaining")}</span>
            <span className="font-bold">{formatMoney(remaining, currency)}</span>
          </div>
        </Card>

        <Button onClick={save}>{existing ? t("save_changes") : t("save")}</Button>
        {existing && (
          <Link to="/factures/$id" params={{ id: existing.id }}>
            <Button variant="outline" className="w-full">{t("cancel")}</Button>
          </Link>
        )}
      </div>
    </AppShell>
  );
}
