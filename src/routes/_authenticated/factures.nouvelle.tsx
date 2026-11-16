import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/InvoiceForm";

export const Route = createFileRoute("/_authenticated/factures/nouvelle")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Nouvelle facture — Moubiz Plus" },
      {
        name: "description",
        content: "Créez une facture bilingue avec calcul automatique des totaux.",
      },
      { property: "og:title", content: "Nouvelle facture — Moubiz Plus" },
      { property: "og:description", content: "Facturation simple pour auto-entrepreneur." },
    ],
  }),
  component: () => <InvoiceForm />,
});

