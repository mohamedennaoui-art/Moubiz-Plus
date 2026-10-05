import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", key: "nav_dashboard", icon: "▦" },
  { to: "/impot", key: "nav_tax", icon: "%" },
  { to: "/contribution", key: "nav_social", icon: "◈" },
  { to: "/echeances", key: "nav_deadlines", icon: "◷" },
  { to: "/factures", key: "nav_invoices", icon: "▤" },
  { to: "/profil", key: "nav_profile", icon: "◉" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-page">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">
              M<span className="text-teal">+</span>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-primary">{t("appName")}</span>
              <span className="block text-[11px] text-muted-foreground">{t("tagline")}</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            {(["fr", "ar"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                {l === "fr" ? "FR" : "AR"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background">
        <div className="mx-auto grid max-w-2xl grid-cols-6 gap-2 px-3 py-2.5">
          {items.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-[10px] font-semibold",
                  active ? "bg-accent text-primary shadow-[inset_0_2px_0_var(--teal)]" : "text-muted-foreground hover:text-primary",
                )}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="truncate">{t(item.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
