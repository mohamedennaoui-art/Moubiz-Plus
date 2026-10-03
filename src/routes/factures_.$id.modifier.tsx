import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { InvoiceForm } from "@/components/InvoiceForm";
import { Button, Card } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/factures_/$id/modifier")({
  head: () => ({
    meta: [
      { title: "Modifier la facture — Moubiz Plus" },
      { name: "description", content: "Modifiez une facture au statut brouillon." },
      { property: "og:title", content: "Modifier la facture — Moubiz Plus" },
      { property: "og:description", content: "Édition d'une facture brouillon." },
    ],
  }),
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { id } = useParams({ from: "/factures_/$id/modifier" });
  const { t } = useI18n();
  const { data, ready } = useStore();
  const invoice = data.invoices.find((i) => i.id === id);
  if (!ready) return <AppShell>{null}</AppShell>;
  if (!invoice || invoice.status !== "draft") {
    return (
      <AppShell>
        <Card>
          <p className="text-sm text-muted-foreground">{t("edit_draft_only")}</p>
          <Link to="/factures" className="mt-4 block">
            <Button variant="outline" className="w-full">{t("page_invoices")}</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }
  return <InvoiceForm key={invoice.id} existing={invoice} />;
}
