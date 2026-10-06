import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Owner account: the only account that may receive the admin role. */
const OWNER_EMAIL = "moubizplus@gmail.com";

type Ctx = { supabase: any; userId: string };

async function isAdmin({ supabase, userId }: Ctx): Promise<boolean> {
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user) return false;
  const u = userData.user;

  // Grant the admin role to the owner once their email is confirmed.
  if (u.email?.toLowerCase() === OWNER_EMAIL && u.email_confirmed_at) {
    const { data: already } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!already) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }
  }

  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ isAdmin: await isAdmin(context as Ctx) }));

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
  banned: boolean;
};

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context as Ctx))) throw new Response("Forbidden", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const users: AdminUser[] = [];
    for (let page = 1; page < 100; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const name = (meta.full_name ?? meta.name ?? meta.display_name ?? null) as string | null;
        users.push({
          id: u.id,
          email: u.email ?? null,
          name,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at ?? null,
          confirmed: !!u.email_confirmed_at,
          banned: !!(u as { banned_until?: string | null }).banned_until &&
            new Date((u as { banned_until: string }).banned_until) > new Date(),
        });
      }
      if (data.users.length < 1000) break;
    }
    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { users };
  });
