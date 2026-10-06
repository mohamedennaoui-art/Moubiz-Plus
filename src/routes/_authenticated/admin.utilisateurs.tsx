import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getAdminStatus, listUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Administration — Utilisateurs | Moubiz Plus" },
      { name: "description", content: "Espace réservé au propriétaire de Moubiz Plus." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsersPage,
});

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : "—";

function AdminUsersPage() {
  const status = useServerFn(getAdminStatus);
  const list = useServerFn(listUsers);
  const adminQ = useQuery({ queryKey: ["admin-status"], queryFn: () => status() });
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
    enabled: adminQ.data?.isAdmin === true,
  });

  if (adminQ.isLoading) return <AppShell>{null}</AppShell>;

  if (!adminQ.data?.isAdmin) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-bold text-foreground">Accès refusé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette page est réservée au compte propriétaire.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            Retour au tableau de bord
          </Link>
        </div>
      </AppShell>
    );
  }

  const users = usersQ.data?.users ?? [];

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-foreground">Administration — Utilisateurs</h1>
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Utilisateurs inscrits</p>
        <p className="text-3xl font-extrabold text-primary">
          {usersQ.isLoading ? "…" : users.length}
        </p>
      </div>
      {usersQ.error && (
        <p className="mt-4 text-sm text-destructive">Impossible de charger la liste.</p>
      )}
      <ul className="mt-4 space-y-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-semibold text-foreground">{u.name || "—"}</p>
            <p className="break-all text-muted-foreground">{u.email}</p>
            <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-3">
              <div><dt className="text-xs text-muted-foreground">Inscription</dt><dd>{fmt(u.createdAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Dernière connexion</dt><dd>{fmt(u.lastSignInAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Statut</dt><dd>{u.banned ? "Bloqué" : u.confirmed ? "Actif" : "Email non confirmé"}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
