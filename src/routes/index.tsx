import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "google-site-verification",
        content: "CuUxNpovDLqdoMSAzujquBLtq0pKFptvyDUwpleXUZk",
      },
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
  component: () => <Navigate to="/dashboard" replace />,
});
