import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion | Moubiz Plus" },
      { name: "description", content: "Créez votre compte Moubiz Plus ou connectez-vous par email." },
      { property: "og:title", content: "Connexion | Moubiz Plus" },
      { property: "og:description", content: "Créez votre compte Moubiz Plus ou connectez-vous par email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setMsg(error ? error.message : "Compte créé. Vérifiez votre email pour confirmer votre inscription.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email ou mot de passe incorrect, ou email non confirmé.");
      else navigate({ to: "/" });
    }
    setBusy(false);
  }

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
  return (
    <AppShell>
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6">
        <h1 className="text-lg font-bold text-foreground">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}
          className="mt-4 text-sm font-semibold text-primary"
        >
          {mode === "login" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </AppShell>
  );
}
