import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { homeContent } from "@/lib/home-content";
import { supabase } from "@/integrations/supabase/client";
import workspace from "@/assets/moubiz-workspace.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        name: "google-site-verification",
        content: "CuUxNpovDLqdoMSAzujquBLtq0pKFptvyDUwpleXUZk",
      },
      { title: "Moubiz Plus — Assistant digital des auto-entrepreneurs en Tunisie" },
      {
        name: "description",
        content:
          "Impôt, contribution sociale, échéances et factures pour les auto-entrepreneurs tunisiens.",
      },
      { property: "og:title", content: "Moubiz Plus — Assistant digital des auto-entrepreneurs en Tunisie" },
      {
        property: "og:description",
        content:
          "Calculez votre impôt, votre contribution sociale, suivez vos échéances et créez vos factures.",
      },
    ],
  }),
  component: HomePage,
});

const icons = ["▤", "%", "◈", "◷", "↗"];

function HomePage() {
  const { lang, setLang } = useI18n();
  const copy = homeContent[lang];
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user);
    });
    return () => { active = false; };
  }, []);
  const openAccount = () => {
    if (signedIn) void navigate({ to: "/dashboard" });
    else void navigate({ to: "/auth", search: { mode: "signup", redirect: "/dashboard" } });
  };
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground" dir="ltr">M<span className="text-teal">+</span></span>
            <span className="text-lg font-bold text-primary">{copy.brand}</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            {signedIn ? <Link to="/dashboard" className="text-sm font-semibold text-primary">{copy.space}</Link> : <Link to="/auth" search={{ redirect: "/dashboard" }} className="text-sm font-semibold text-primary">{copy.login}</Link>}
            <div className="flex items-center gap-1 rounded-full border border-border p-1" dir="ltr">
              {(["fr", "ar"] as const).map((l) => <Button key={l} variant={lang === l ? "primary" : "ghost"} onClick={() => setLang(l)} className="min-h-8 rounded-full px-3 text-xs">{l.toUpperCase()}</Button>)}
            </div>
          </div>
        </div>
      </header>
      <main>
        <section className="relative isolate overflow-hidden bg-page" dir="ltr">
          <img src={workspace} alt={copy.photo} width={1536} height={1024} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="landing-scrim absolute inset-0" />
          <div className="relative mx-auto grid min-h-[480px] max-w-6xl items-center px-5 py-14 sm:min-h-[540px] sm:px-8 lg:grid-cols-2 lg:py-20">
            <div className="max-w-lg" dir={lang === "ar" ? "rtl" : "ltr"}>
              <p className="mb-5 text-sm font-semibold text-primary">{copy.intro}</p>
              <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl">{copy.brand}</h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground">{copy.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button onClick={openAccount} className="gap-3 rounded-lg px-6">{signedIn ? copy.space : copy.signup}<span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span></Button>
                {!signedIn && <Link to="/auth" search={{ redirect: "/dashboard" }} className="text-sm font-semibold text-primary underline underline-offset-4">{copy.login}</Link>}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">{copy.section}</h2>
          <p className="mt-3 text-muted-foreground">{copy.sectionIntro}</p>
          <div className="mt-9 grid gap-x-9 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.features.map(([title, description], index) => <article key={title} className="border-t border-border pt-5">
              <span className="text-2xl font-semibold text-accent-foreground" aria-hidden="true">{icons[index]}</span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>)}
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-page">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-7 sm:px-8">
          <div><p className="font-bold text-primary">{copy.brand}</p><p className="mt-1 text-sm text-muted-foreground">{copy.footer}</p></div>
          <Button variant="outline" onClick={openAccount} className="rounded-lg">{signedIn ? copy.space : copy.signup}</Button>
        </div>
      </footer>
    </div>
  );
}
