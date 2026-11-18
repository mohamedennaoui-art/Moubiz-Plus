import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options, useNavigate: () => null }));
vi.mock("@/components/AppShell", () => ({ AppShell: () => null }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { Route } from "../routes/auth";
const entry = Route as unknown as { validateSearch: (search: Record<string, unknown>) => { mode?: "signup"; redirect?: string } };
describe("homepage account entry", () => {
  it("opens the existing signup form and retains the dashboard destination", () => {
    expect(entry.validateSearch({ mode: "signup", redirect: "/dashboard" })).toEqual({ mode: "signup", redirect: "/dashboard" });
  });
  it("keeps sign-in as the default entry", () => {
    expect(entry.validateSearch({})).toEqual({});
  });
  it("rejects external return URLs and unsupported modes", () => {
    expect(entry.validateSearch({ mode: "admin", redirect: "https://example.com" })).toEqual({ redirect: "/" });
  });
});