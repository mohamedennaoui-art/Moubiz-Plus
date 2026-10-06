import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminStatus } from "@/lib/admin.functions";

export function AccountMenu() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const status = useServerFn(getAdminStatus);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user.id ?? null);
      if (event !== "SIGNED_OUT") qc.invalidateQueries({ queryKey: ["admin-status"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const adminQ = useQuery({
    queryKey: ["admin-status", userId],
    queryFn: () => status(),
    enabled: !!userId,
  });

  if (!ready) return null;
  const cls = "rounded-full px-3 py-1 text-xs font-bold";

  if (!userId) {
    return (
      <Link to="/auth" className={`${cls} text-primary hover:bg-secondary`}>
        Connexion
      </Link>
    );
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.removeQueries({ queryKey: ["admin-status"] });
    qc.removeQueries({ queryKey: ["admin-users"] });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex items-center gap-1">
      {adminQ.data?.isAdmin && (
        <Link to="/admin/utilisateurs" className={`${cls} text-primary hover:bg-secondary`}>
          Admin
        </Link>
      )}
      <button onClick={signOut} className={`${cls} text-muted-foreground hover:bg-secondary`}>
        Déconnexion
      </button>
    </div>
  );
}
