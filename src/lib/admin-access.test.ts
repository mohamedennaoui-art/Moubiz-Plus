import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { listUsers, getAdminStatus } from "./admin.functions";
const context = {
  userId: "normal-user",
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "normal-user", email: "normal@example.test", email_confirmed_at: "2026-01-01" } }, error: null }) },
    rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
  },
};
describe("server-side administration authorization", () => {
  it("does not grant an administrator role to a normal user", async () => {
    const status = getAdminStatus as unknown as (input: { context: typeof context }) => Promise<{ isAdmin: boolean }>;
    expect(await status({ context })).toEqual({ isAdmin: false });
    expect(context.supabase.rpc).toHaveBeenCalledWith("has_role", { _user_id: "normal-user", _role: "admin" });
  });
  it("rejects a normal user before loading the privileged user list", async () => {
    const list = listUsers as unknown as (input: { context: typeof context }) => Promise<unknown>;
    await expect(list({ context })).rejects.toMatchObject({ status: 403 });
  });
});
