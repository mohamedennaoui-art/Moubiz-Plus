import { beforeEach, describe, expect, it, vi } from "vitest";
const listPrivileged = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { auth: { admin: { listUsers: listPrivileged } } },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Link: () => null,
  redirect: (options: unknown) => ({ redirect: options }),
}));
vi.mock("@/components/AppShell", () => ({ AppShell: () => null }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { listUsers, getAdminStatus } from "./admin.functions";
import { Route } from "../routes/_authenticated/admin.utilisateurs";
const adminRoute = Route as unknown as { loader: () => Promise<void> };
const context = {
  userId: "normal-user",
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "normal-user", email: "normal@example.test", email_confirmed_at: "2026-01-01" } }, error: null }) },
    rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
  },
};
describe("server-side administration authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    context.supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "normal-user", email: "normal@example.test", email_confirmed_at: "2026-01-01" } }, error: null });
    context.supabase.rpc.mockResolvedValue({ data: false, error: null });
    listPrivileged.mockResolvedValue({ data: { users: [] }, error: null });
  });
  it("does not grant an administrator role to a normal user", async () => {
    const status = getAdminStatus as unknown as (input: { context: typeof context }) => Promise<{ isAdmin: boolean }>;
    expect(await status({ context })).toEqual({ isAdmin: false });
    expect(context.supabase.rpc).toHaveBeenCalledWith("has_role", { _user_id: "normal-user", _role: "admin" });
  });
  it("rejects a normal user before loading the privileged user list", async () => {
    const list = listUsers as unknown as (input: { context: typeof context }) => Promise<unknown>;
    await expect(list({ context })).rejects.toMatchObject({ status: 403 });
    expect(listPrivileged).not.toHaveBeenCalled();
  });
  it("allows a role verified as admin by the database", async () => {
    context.supabase.rpc.mockResolvedValue({ data: true, error: null });
    const list = listUsers as unknown as (input: { context: typeof context }) => Promise<unknown>;
    await expect(list({ context })).resolves.toEqual({ users: [] });
    expect(listPrivileged).toHaveBeenCalledOnce();
  });
  it("returns 403 when the role lookup fails even if it includes true", async () => {
    context.supabase.rpc.mockResolvedValueOnce({ data: true, error: new Error("role lookup failed") } as never);
    const list = listUsers as unknown as (input: { context: typeof context }) => Promise<unknown>;
    await expect(list({ context })).rejects.toMatchObject({ status: 403 });
    expect(listPrivileged).not.toHaveBeenCalled();
  });
  it("returns 403 for a mismatched authenticated identity", async () => {
    context.supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "different-user", email: "normal@example.test", email_confirmed_at: "2026-01-01" } }, error: null });
    const list = listUsers as unknown as (input: { context: typeof context }) => Promise<unknown>;
    await expect(list({ context })).rejects.toMatchObject({ status: 403 });
    expect(context.supabase.rpc).not.toHaveBeenCalled();
    expect(listPrivileged).not.toHaveBeenCalled();
  });
  it("redirects non-admins before rendering the administration page", async () => {
    const status = vi.spyOn(await import("./admin.functions"), "getAdminStatus");
    status.mockResolvedValueOnce({ isAdmin: false });
    await expect(adminRoute.loader()).rejects.toEqual({ redirect: { to: "/dashboard", replace: true } });
    status.mockRestore();
  });
  it("lets verified admins enter the administration page", async () => {
    const status = vi.spyOn(await import("./admin.functions"), "getAdminStatus");
    status.mockResolvedValueOnce({ isAdmin: true });
    await expect(adminRoute.loader()).resolves.toBeUndefined();
    status.mockRestore();
  });
});
