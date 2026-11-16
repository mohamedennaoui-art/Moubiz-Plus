import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, PageTitle, Select } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { ActivityType } from "@/lib/engines/types";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Mon profil — Moubiz Plus" },
      {
        name: "description",
        content: "Vos informations d'auto-entrepreneur, utilisées sur vos factures.",
      },
      { property: "og:title", content: "Mon profil — Moubiz Plus" },
      { property: "og:description", content: "Coordonnées, activité, devises et rappels." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { data, update, ready } = useStore();
  const [form, setForm] = useState(data.profile);
  const [saved, setSaved] = useState(false);
  // True once the user has edited the form: do not overwrite unsaved input.
  const [dirty, setDirty] = useState(false);

  // Sync the form with the loaded profile once the account data is ready.
  // Skipped while the user has unsaved edits.
  useEffect(() => {
    if (ready && !dirty) setForm(data.profile);
  }, [ready, data.profile, dirty]);

  // Account switch or sign-out: ready goes false again — forget the previous
  // account's unsaved edits so the next loaded profile fills the form.
  useEffect(() => {
    if (!ready) {
      setDirty(false);
      setSaved(false);
    }
  }, [ready]);

  const set = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setDirty(true);
    setSaved(false);
  };

  const save = () => {
    update({ profile: form });
    setDirty(false);
    setSaved(true);
  };

  return (
    <AppShell>
      <PageTitle title={t("page_profile")} subtitle={t("profile_intro")} />

      <div className="grid gap-4">
        <Card className="grid gap-3">
          <Field label={t("name")}>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label={t("registration_date")}>
            <Input
              type="date"
              value={form.registrationDate?.slice(0, 10) ?? ""}
              onChange={(e) => set({ registrationDate: e.target.value })}
            />
          </Field>
          <p className="-mt-1 text-xs text-muted-foreground">{t("registration_note")}</p>
          <Field label={t("identifier")}>
            <Input value={form.identifier} onChange={(e) => set({ identifier: e.target.value })} />
          </Field>
          <Field label={t("address")}>
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label={t("phone")}>
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label={t("email")}>
            <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label={t("activity")}>
            <Select
              value={form.activity}
              onChange={(e) => set({ activity: e.target.value as ActivityType })}
            >
              <option value="services">{t("activity_services")}</option>
              <option value="trade">{t("activity_trade")}</option>
              <option value="craft">{t("activity_craft")}</option>
            </Select>
          </Field>
        </Card>

        <Card className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("exchange_rates")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="EUR → TND">
              <Input
                type="number"
                inputMode="decimal"
                value={form.rates.EUR}
                onChange={(e) => set({ rates: { ...form.rates, EUR: Number(e.target.value) } })}
              />
            </Field>
            <Field label="USD → TND">
              <Input
                type="number"
                inputMode="decimal"
                value={form.rates.USD}
                onChange={(e) => set({ rates: { ...form.rates, USD: Number(e.target.value) } })}
              />
            </Field>
          </div>
        </Card>

        <Card className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("notifications")}
          </p>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={form.remindersEnabled}
              onChange={(e) => set({ remindersEnabled: e.target.checked })}
            />
            {t("alert_soon")}
          </label>
          <p className="text-xs text-muted-foreground">{t("notif_note")}</p>
        </Card>

        <Card className="grid gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("language")}
          </p>
          <Select value={lang} onChange={(e) => setLang(e.target.value as "fr" | "ar")}>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </Select>
        </Card>

        <Button onClick={save} disabled={!ready}>
          {saved ? t("saved") : t("save")}
        </Button>
      </div>
    </AppShell>
  );
}
