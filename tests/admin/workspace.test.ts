import { describe, expect, it, vi } from "vitest";
import { createPropertyDraft, persistPropertyDraft, validatePropertyStep, stepForPropertyErrors, type PropertyDraft } from "@/lib/admin/property-wizard";
import { parseWorkspaceLocation, workspaceHref, workspacePropertyFilters, workspaceLeadFilters, workspaceVisitFilters } from "@/lib/admin/workspace-types";
import type { AdminProperty } from "@/types/db";

const id = "123e4567-e89b-42d3-a456-426614174000";
const valid = (): PropertyDraft => ({ ...createPropertyDraft(), values: { ...createPropertyDraft().values, code: "FIXTURE-UNIT", title: "Fixture de teste unitário", price: "350000", city: "Cidade teste", neighborhood: "Bairro teste", state: "SP", status: "published" } });

describe("localização do workspace", () => {
  it("preserva painel e edição no deep link e ao voltar", () => {
    const parent = { panel: "properties" as const, property: null };
    const child = { ...parent, property: id };
    expect(parseWorkspaceLocation(new URL(workspaceHref(child), "https://test.invalid").searchParams)).toEqual(child);
    expect(workspaceHref(parent)).toBe("/admin?painel=imoveis");
    expect(workspaceHref({ panel: null, property: null }, "painel=imoveis&imovel=novo")).toBe("/admin");
  });
  it("ignora IDs e painéis inválidos e aceita novo sem sair do dashboard", () => {
    expect(parseWorkspaceLocation(new URLSearchParams("painel=outro&imovel=../configuracoes"))).toEqual({ panel: null, property: null });
    expect(parseWorkspaceLocation(new URLSearchParams("imovel=novo"))).toEqual({ panel: null, property: "novo" });
  });
  it("limita filtros antes de fazer consultas", () => {
    expect(workspacePropertyFilters.safeParse({ q: "a".repeat(81) }).success).toBe(false);
    expect(workspacePropertyFilters.safeParse({ page: -1 }).success).toBe(false);
    expect(workspacePropertyFilters.safeParse({ page: 1.5 }).success).toBe(false);
    expect(workspaceLeadFilters.safeParse({ status: "published" }).success).toBe(false);
    expect(workspaceVisitFilters.safeParse({ page: 10001 }).success).toBe(false);
  });
});

describe("validação e rascunho do wizard", () => {
  it("valida a etapa atual sem bloquear identificação por valores de etapas futuras", () => {
    const draft = createPropertyDraft();
    draft.values.code = "FIXTURE"; draft.values.title = "Título teste";
    expect(validatePropertyStep(draft.values, 0)).toEqual({});
    expect(validatePropertyStep(draft.values, 1)).toHaveProperty("price");
    expect(stepForPropertyErrors({ latitude: ["Inválida"] })).toBe(2);
  });
  it("valida coordenadas em par e campos finais antes de salvar", () => {
    const draft = valid(); draft.values.latitude = "-23.5";
    expect(validatePropertyStep(draft.values, 2)).toHaveProperty("latitude");
    draft.values.longitude = "-46.5";
    expect(validatePropertyStep(draft.values)).toEqual({});
  });
  it("inicia edição preservando status, endereço e comodidades existentes", () => {
    const existing = { id, status: "reserved", hide_address: false, address: "Endereço fixture", feature_ids: [id], code: "UNIT" } as AdminProperty;
    const draft = createPropertyDraft(existing);
    expect(draft.existing).toBe(true);
    expect(draft.savedId).toBe(id);
    expect(draft.values).toMatchObject({ status: "reserved", hideAddress: false, address: "Endereço fixture", featureIds: [id] });
  });
});

describe("salvamento com uploads parciais", () => {
  it("mantém o ID e apenas fotos pendentes; retry não cria outro imóvel nem duplica foto aceita", async () => {
    const first = new File(["fixture1"], "fixture1.jpg", { type: "image/jpeg" });
    const second = new File(["fixture2"], "fixture2.jpg", { type: "image/jpeg" });
    let draft: PropertyDraft = { ...valid(), files: [first, second] };
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const upload = vi.fn().mockResolvedValueOnce({ ok: true, data: { added: 1, rejected: [] } }).mockResolvedValueOnce({ ok: false, error: "Falha fixture" });
    const publish = vi.fn().mockResolvedValue({ ok: true, data: undefined });
    const result = await persistPropertyDraft(draft, { save, upload, publish }, (value) => { draft = value; });
    expect(result.ok).toBe(false);
    expect(draft.savedId).toBe(id);
    expect(draft.files).toEqual([second]);
    expect(save.mock.calls[0][0]).toMatchObject({ id: undefined, status: "draft" });
    expect(publish).not.toHaveBeenCalled();
    upload.mockResolvedValue({ ok: true, data: { added: 1, rejected: [] } });
    expect((await persistPropertyDraft(draft, { save, upload, publish }, (value) => { draft = value; })).ok).toBe(true);
    expect(save.mock.calls[1][0]).toMatchObject({ id, status: "draft" });
    expect(upload.mock.calls.map((call) => call[1])).toEqual([first, second, second]);
    expect(publish).toHaveBeenCalledExactlyOnceWith(id, "published");
    expect(draft.files).toEqual([]);
  });
  it("não publica quando a API responde ok com foto recusada", async () => {
    let draft: PropertyDraft = { ...valid(), files: [new File(["fixture"], "invalid.jpg")] };
    const publish = vi.fn();
    const result = await persistPropertyDraft(draft, {
      save: vi.fn().mockResolvedValue({ ok: true, data: { id } }),
      upload: vi.fn().mockResolvedValue({ ok: true, data: { added: 0, rejected: ["Formato recusado"] } }), publish,
    }, (value) => { draft = value; });
    expect(result.ok).toBe(false);
    expect(draft.files).toHaveLength(1);
    expect(publish).not.toHaveBeenCalled();
  });
  it("edição conserva situação existente durante upload, sem rebaixar silenciosamente para draft", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const publish = vi.fn();
    await persistPropertyDraft({ ...valid(), existing: true, savedId: id }, { save, upload: vi.fn(), publish }, () => {});
    expect(save.mock.calls[0][0]).toMatchObject({ id, status: "published" });
    expect(publish).not.toHaveBeenCalled();
  });
  it("checkpoint sobrevive a falha de rede após criar e permite retomar com mesmo ID", async () => {
    let draft: PropertyDraft = { ...valid(), files: [new File(["fixture"], "fixture.jpg")] };
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    await expect(persistPropertyDraft(draft, { save, upload: vi.fn().mockRejectedValue(new Error("offline")), publish: vi.fn() }, (value) => { draft = value; })).rejects.toThrow("offline");
    expect(draft.savedId).toBe(id);
    expect(draft.files).toHaveLength(1);
  });
  it("não envia fotos se a RPC falhar", async () => {
    const upload = vi.fn(); const checkpoint = vi.fn();
    const result = await persistPropertyDraft(valid(), { save: vi.fn().mockResolvedValue({ ok: false, error: "Falha fixture" }), upload, publish: vi.fn() }, checkpoint);
    expect(result.ok).toBe(false); expect(upload).not.toHaveBeenCalled(); expect(checkpoint).not.toHaveBeenCalled();
  });
});
