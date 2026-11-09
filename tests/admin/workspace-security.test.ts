import { beforeEach, describe, expect, it, vi } from "vitest";

const id = "123e4567-e89b-42d3-a456-426614174000";
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  propList: vi.fn(), propOptions: vi.fn(), propById: vi.fn(),
  images: vi.fn(), features: vi.fn(), leads: vi.fn(), visits: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/dal/properties", () => ({ list: mocks.propList, listOptions: mocks.propOptions, getById: mocks.propById }));
vi.mock("@/lib/dal/propertyImages", () => ({ list: mocks.images }));
vi.mock("@/lib/dal/features", () => ({ list: mocks.features }));
vi.mock("@/lib/dal/leads", () => ({ list: mocks.leads }));
vi.mock("@/lib/dal/visits", () => ({ list: mocks.visits }));

import { readWorkspaceLeads, readWorkspaceProperties, readWorkspaceProperty, readWorkspaceVisits } from "@/lib/admin/actions/workspace";

const dals = [mocks.propList, mocks.propOptions, mocks.propById, mocks.images, mocks.features, mocks.leads, mocks.visits];
const noDalCalls = () => dals.forEach((fn) => expect(fn).not.toHaveBeenCalled());
const denied = new Error("redirect:/admin/login");

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "fixture-user", email: "fixture@example.invalid", role: "admin" });
  mocks.propList.mockResolvedValue({ items: [], total: 0 });
  mocks.propOptions.mockResolvedValue([{ id, code: "FIX", title: "Fixture" }]);
  mocks.propById.mockResolvedValue({ id });
  mocks.images.mockResolvedValue([]);
  mocks.features.mockResolvedValue([]);
  mocks.leads.mockResolvedValue({ items: [], total: 0 });
  mocks.visits.mockResolvedValue({ items: [], total: 0 });
});

const readers: [string, () => Promise<unknown>][] = [
  ["readWorkspaceProperties", () => readWorkspaceProperties({})],
  ["readWorkspaceLeads", () => readWorkspaceLeads({})],
  ["readWorkspaceVisits", () => readWorkspaceVisits({})],
  ["readWorkspaceProperty (novo)", () => readWorkspaceProperty()],
  ["readWorkspaceProperty (id)", () => readWorkspaceProperty(id)],
];

describe("leituras do workspace: autorização antes da DAL", () => {
  it.each(readers)("%s rejeita não autenticado sem consultar nenhum dado", async (_name, call) => {
    mocks.requireAdmin.mockRejectedValue(denied);
    await expect(call()).rejects.toBe(denied);
    noDalCalls();
  });

  it.each(readers)("%s chama requireAdmin exatamente uma vez antes de qualquer DAL", async (_name, call) => {
    await call();
    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    const authOrder = mocks.requireAdmin.mock.invocationCallOrder[0];
    const used = dals.filter((fn) => fn.mock.calls.length);
    expect(used.length).toBeGreaterThan(0);
    for (const fn of used) expect(Math.min(...fn.mock.invocationCallOrder)).toBeGreaterThan(authOrder);
  });

  it("não valida nem consulta com entrada inválida e não autenticado: o erro é o de autorização", async () => {
    mocks.requireAdmin.mockRejectedValue(denied);
    await expect(readWorkspaceProperty("não-é-uuid")).rejects.toBe(denied);
    await expect(readWorkspaceProperties({ page: -1 })).rejects.toBe(denied);
    noDalCalls();
  });
});

describe("leituras do workspace: entradas inválidas com papel autenticado", () => {
  it.each([
    ["página negativa", { page: -1 }],
    ["página zero", { page: 0 }],
    ["página fracionária", { page: 1.5 }],
    ["página acima do limite", { page: 10001 }],
    ["busca longa demais", { q: "a".repeat(81) }],
    ["status inexistente", { status: "hacked" }],
  ])("propriedades: %s não chega à DAL", async (_label, input) => {
    await expect(readWorkspaceProperties(input as never)).rejects.toThrow();
    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    noDalCalls();
  });

  it.each([
    ["status de imóvel", { status: "published" }],
    ["página inválida", { page: "2" }],
  ])("leads: %s não chega à DAL", async (_label, input) => {
    await expect(readWorkspaceLeads(input as never)).rejects.toThrow();
    noDalCalls();
  });

  it.each([
    ["status de imóvel", { status: "published" }],
    ["página inválida", { page: 10001 }],
  ])("visitas: %s não chega à DAL", async (_label, input) => {
    await expect(readWorkspaceVisits(input as never)).rejects.toThrow();
    noDalCalls();
  });

  it.each(["../configuracoes", "123", "novo", " ", "123e4567-e89b-42d3-a456-42661417400"])("imóvel com ID %j não chega à DAL", async (bad) => {
    await expect(readWorkspaceProperty(bad)).rejects.toThrow();
    expect(mocks.propById).not.toHaveBeenCalled();
    expect(mocks.images).not.toHaveBeenCalled();
    expect(mocks.features).not.toHaveBeenCalled();
  });

  it("imóvel inexistente falha sem vazar dados parciais", async () => {
    mocks.propById.mockResolvedValue(null);
    await expect(readWorkspaceProperty(id)).rejects.toThrow("Imóvel não encontrado.");
  });
});

describe("leituras do workspace: dados e contratos", () => {
  it("aplica o filtro validado (com page padrão) à DAL", async () => {
    await readWorkspaceProperties({ q: "  casa  ", status: "published" });
    expect(mocks.propList).toHaveBeenCalledWith({ page: 1, q: "casa", status: "published" }, 1);
  });

  it("leads e visitas devolvem opções reduzidas a id e rótulo", async () => {
    mocks.propOptions.mockResolvedValue([{ id, code: "FIX", title: "Fixture", price: 1, address: "não vazar" }]);
    for (const result of [await readWorkspaceLeads({}), await readWorkspaceVisits({})]) {
      expect(result.options).toEqual([{ id, label: "FIX — Fixture" }]);
    }
  });

  it("novo imóvel só lê comodidades (sem consultar imóvel ou fotos)", async () => {
    await expect(readWorkspaceProperty()).resolves.toEqual({ property: null, images: [], allFeatures: [] });
    expect(mocks.propById).not.toHaveBeenCalled();
    expect(mocks.images).not.toHaveBeenCalled();
  });

  it("propaga falha da DAL em vez de devolver resultado vazio", async () => {
    mocks.leads.mockRejectedValue(new Error("falha fixture"));
    await expect(readWorkspaceLeads({})).rejects.toThrow("falha fixture");
  });
});
