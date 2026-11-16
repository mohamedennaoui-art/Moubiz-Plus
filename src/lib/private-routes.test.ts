import { beforeEach, describe, expect, it, vi } from "vitest";
const getUser = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser } } }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Outlet: () => null,
  lazyRouteComponent: () => () => null,
  redirect: (options: unknown) => ({ redirect: options }),
}));
import { Route } from "../routes/_authenticated/route";
const gate = Route as unknown as { beforeLoad: (input: { location: { href: string } }) => Promise<{ user: { id: string } }>; ssr: boolean };
const urls = ["/dashboard", "/impot", "/contribution", "/echeances", "/factures", "/factures/nouvelle", "/factures/F-2026-002", "/factures/F-2026-002/modifier", "/profil", "/admin/utilisateurs"];
describe("shared private page session gate", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(urls)("redirects signed-out direct access to %s and preserves the requested URL", async (href) => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(gate.beforeLoad({ location: { href } })).rejects.toEqual({ redirect: { to: "/auth", search: { redirect: href }, replace: true } });
  });
  it("accepts a verified session", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
    await expect(gate.beforeLoad({ location: { href: "/factures" } })).resolves.toEqual({ user: { id: "verified-user" } });
  });
  it("rejects a failed session verification", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "stale-user" } }, error: new Error("expired") });
    await expect(gate.beforeLoad({ location: { href: "/profil" } })).rejects.toMatchObject({ redirect: { to: "/auth" } });
  });
});
