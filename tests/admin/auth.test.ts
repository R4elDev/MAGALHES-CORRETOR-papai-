import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ready: vi.fn(),
  client: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ supabaseEnvReady: mocks.ready }));
vi.mock("@/lib/supabase/server", () => ({ createSessionClient: mocks.client }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

import { getAdminSession, requireAdmin, signInAdmin } from "@/lib/auth";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.ready.mockReturnValue(true);
  mocks.getUser.mockResolvedValue({ data: { user: { id: "fixture-user", email: "fixture@example.invalid" } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
  mocks.signIn.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.client.mockResolvedValue({
    auth: { getUser: mocks.getUser, signInWithPassword: mocks.signIn, signOut: mocks.signOut },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  });
});

describe("admin authorization (outside React render; no request-cache assertions)", () => {
  it("fails closed without configuration, without opening a client", async () => {
    mocks.ready.mockReturnValue(false);
    await expect(requireAdmin()).rejects.toThrow("redirect:/admin/login");
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated user before reading roles", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin()).rejects.toThrow("redirect:/admin/login");
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: null },
    { data: { role: "viewer" }, error: null },
    { data: { role: "admin" }, error: { message: "denied" } },
  ])("rejects missing, invalid or errored membership: %j", async (membership) => {
    mocks.maybeSingle.mockResolvedValue(membership);
    await expect(requireAdmin()).rejects.toThrow("redirect:/admin/login");
  });

  it("rejects a JWT validation error even if a user object accompanies it", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "fixture-user" } }, error: { message: "invalid" } });
    expect(await getAdminSession()).toBeNull();
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });

  it("fails closed on network failure", async () => {
    mocks.getUser.mockRejectedValue(new Error("network"));
    expect(await getAdminSession()).toBeNull();
  });

  it.each(["admin", "editor"])("accepts a validated %s membership", async (role) => {
    mocks.maybeSingle.mockResolvedValue({ data: { role }, error: null });
    expect(await requireAdmin()).toEqual({ id: "fixture-user", email: "fixture@example.invalid", role });
  });

  it("verifies membership after login and signs out a non-admin", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await signInAdmin("fixture@example.invalid", "fixture-password")).toEqual({ ok: false, error: "credenciais" });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
