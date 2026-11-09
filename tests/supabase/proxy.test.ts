import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
  vi.doUnmock("@supabase/ssr");
});

const req = (path: string) => new NextRequest(`http://localhost${path}`);

describe("proxy /admin falha fechado", () => {
  for (const path of ["/admin", "/admin/login", "/admin/imoveis"]) {
    it(`sem env: ${path} responde 503 amigavel, sem vazar variaveis`, async () => {
      const { proxy, UNAVAILABLE_MESSAGE } = await import("@/lib/supabase/proxy");
      const res = await proxy(req(path));
      expect(res.status).toBe(503);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const body = await res.text();
      expect(body).toBe(UNAVAILABLE_MESSAGE);
      expect(body).toBe("Painel indisponível: configuração pendente");
      expect(body).not.toMatch(/SUPABASE|NEXT_PUBLIC|KEY|env/i);
    });
  }

  it("com env mas erro ao validar sessao: 503, nunca 500 nem acesso liberado", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "chave-de-teste";
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: { getUser: () => Promise.reject(new Error("rede")) },
      }),
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { proxy } = await import("@/lib/supabase/proxy");
    const res = await proxy(req("/admin"));
    expect(res.status).toBe(503);
    expect(res.headers.get("location")).toBeNull();
  });

  it("com env e sem usuario: redireciona ao login (nao libera)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "chave-de-teste";
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
    }));
    const { proxy } = await import("@/lib/supabase/proxy");
    const res = await proxy(req("/admin/imoveis"));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });
});
