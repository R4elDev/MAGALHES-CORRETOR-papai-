import { describe, expect, it, vi } from "vitest";
import { createPropertyDraft, persistPropertyDraft, stepForPropertyErrors, type PropertyDraft } from "@/lib/admin/property-wizard";

const id = "123e4567-e89b-42d3-a456-426614174000";
const file = (name: string) => new File(["fixture"], name, { type: "image/jpeg" });
const draftWith = (files: File[], status = "published", extra: Partial<PropertyDraft> = {}): PropertyDraft => {
  const base = createPropertyDraft();
  return { ...base, files, ...extra, values: { ...base.values, code: "FIXTURE-REC", title: "Fixture recuperação", price: "100000", city: "Cidade", neighborhood: "Bairro", state: "SP", status } };
};
const accepted = { ok: true, data: { added: 1, rejected: [] } };

describe("recuperação do wizard: ordem e checkpoints", () => {
  it("checkpoint do ID ocorre antes do primeiro upload e a cada foto confirmada", async () => {
    const events: string[] = [];
    const files = [file("a.jpg"), file("b.jpg")];
    await persistPropertyDraft(draftWith(files), {
      save: vi.fn(async () => { events.push("save"); return { ok: true as const, data: { id } }; }),
      upload: vi.fn(async (_id: string, f: File) => { events.push(`upload:${f.name}`); return accepted as never; }),
      publish: vi.fn(async () => { events.push("publish"); return { ok: true as const, data: undefined }; }),
    }, (d) => events.push(`checkpoint:${d.savedId}:${d.files.length}`));
    expect(events).toEqual(["save", `checkpoint:${id}:2`, "upload:a.jpg", `checkpoint:${id}:1`, "upload:b.jpg", `checkpoint:${id}:0`, "publish"]);
  });

  it("novo imóvel é salvo como draft e só publica o status desejado após todos os uploads", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const upload = vi.fn().mockResolvedValue(accepted);
    const publish = vi.fn().mockResolvedValue({ ok: true, data: undefined });
    const result = await persistPropertyDraft(draftWith([file("a.jpg")], "reserved"), { save, upload, publish }, () => {});
    expect(result).toMatchObject({ ok: true, data: { id } });
    expect(save.mock.calls[0][0]).toMatchObject({ status: "draft" });
    expect(publish).toHaveBeenCalledExactlyOnceWith(id, "reserved");
    expect(upload.mock.invocationCallOrder[0]).toBeLessThan(publish.mock.invocationCallOrder[0]);
  });

  it("novo imóvel em rascunho nunca chama publish", async () => {
    const publish = vi.fn();
    await persistPropertyDraft(draftWith([], "draft"), { save: vi.fn().mockResolvedValue({ ok: true, data: { id } }), upload: vi.fn(), publish }, () => {});
    expect(publish).not.toHaveBeenCalled();
  });
});

describe("recuperação do wizard: retry sem duplicatas", () => {
  it("falha ao publicar mantém ID e sem fotos pendentes; retry reaproveita o ID, não reenvia fotos e publica de novo", async () => {
    let draft = draftWith([file("a.jpg")]);
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const upload = vi.fn().mockResolvedValue(accepted);
    const publish = vi.fn().mockResolvedValueOnce({ ok: false, error: "Falha publicar fixture" }).mockResolvedValue({ ok: true, data: undefined });
    const first = await persistPropertyDraft(draft, { save, upload, publish }, (d) => { draft = d; });
    expect(first).toEqual({ ok: false, error: "Falha publicar fixture" });
    expect(draft.savedId).toBe(id);
    expect(draft.files).toEqual([]);
    const second = await persistPropertyDraft(draft, { save, upload, publish }, (d) => { draft = d; });
    expect(second.ok).toBe(true);
    expect(save.mock.calls[1][0]).toMatchObject({ id });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it("repetir o salvamento três vezes com a mesma falha de foto nunca troca o ID nem remove a foto pendente", async () => {
    let draft = draftWith([file("a.jpg")]);
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const upload = vi.fn().mockResolvedValue({ ok: false, error: "Sem rede" });
    for (let i = 0; i < 3; i++) await persistPropertyDraft(draft, { save, upload, publish: vi.fn() }, (d) => { draft = d; });
    expect(save.mock.calls.map((c) => c[0].id)).toEqual([undefined, id, id]);
    expect(draft.files).toHaveLength(1);
    expect(draft.savedId).toBe(id);
  });

  it("falha na primeira de três fotos preserva as três", async () => {
    let draft = draftWith([file("a.jpg"), file("b.jpg"), file("c.jpg")]);
    const upload = vi.fn().mockResolvedValue({ ok: false, error: "Falha" });
    await persistPropertyDraft(draft, { save: vi.fn().mockResolvedValue({ ok: true, data: { id } }), upload, publish: vi.fn() }, (d) => { draft = d; });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(draft.files.map((f) => f.name)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});

describe("recuperação do wizard: status, rede e erros do servidor", () => {
  it.each([
    ["resposta ok sem foto adicionada", { ok: true, data: { added: 0, rejected: [] } }],
    ["resposta ok com mais de uma foto adicionada", { ok: true, data: { added: 2, rejected: [] } }],
    ["resposta ok com recusa e adição", { ok: true, data: { added: 1, rejected: ["Tamanho excedido"] } }],
  ])("%s é tratada como falha e nunca publica", async (_label, response) => {
    const publish = vi.fn();
    let draft = draftWith([file("a.jpg")]);
    const result = await persistPropertyDraft(draft, { save: vi.fn().mockResolvedValue({ ok: true, data: { id } }), upload: vi.fn().mockResolvedValue(response), publish }, (d) => { draft = d; });
    expect(result.ok).toBe(false);
    expect(publish).not.toHaveBeenCalled();
    expect(draft.files).toHaveLength(1);
  });

  it("mensagem de falha inclui os motivos recusados e menciona rascunho apenas em imóvel novo", async () => {
    const upload = vi.fn().mockResolvedValue({ ok: true, data: { added: 0, rejected: ["Formato recusado", "Muito grande"] } });
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const created = await persistPropertyDraft(draftWith([file("a.jpg")]), { save, upload, publish: vi.fn() }, () => {});
    const edited = await persistPropertyDraft(draftWith([file("a.jpg")], "published", { existing: true, savedId: id }), { save, upload, publish: vi.fn() }, () => {});
    expect(created).toMatchObject({ ok: false, error: expect.stringContaining("como rascunho") });
    expect(created).toMatchObject({ error: expect.stringContaining("Formato recusado • Muito grande") });
    expect(edited).toMatchObject({ ok: false, error: expect.not.stringContaining("rascunho") });
  });

  it("erro de servidor no upload aparece na mensagem de falha", async () => {
    const result = await persistPropertyDraft(draftWith([file("a.jpg")]), {
      save: vi.fn().mockResolvedValue({ ok: true, data: { id } }),
      upload: vi.fn().mockResolvedValue({ ok: false, error: "Erro 500 fixture" }), publish: vi.fn(),
    }, () => {});
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("Erro 500 fixture") });
  });

  it("erro de rede no salvamento rejeita sem checkpoint, sem upload e sem publicar", async () => {
    const checkpoint = vi.fn(); const upload = vi.fn(); const publish = vi.fn();
    await expect(persistPropertyDraft(draftWith([file("a.jpg")]), { save: vi.fn().mockRejectedValue(new Error("offline")), upload, publish }, checkpoint)).rejects.toThrow("offline");
    expect(checkpoint).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled(); expect(publish).not.toHaveBeenCalled();
  });

  it("erro de rede no meio dos uploads preserva checkpoint com a foto já confirmada removida", async () => {
    let draft = draftWith([file("a.jpg"), file("b.jpg")]);
    const upload = vi.fn().mockResolvedValueOnce(accepted).mockRejectedValueOnce(new Error("offline"));
    await expect(persistPropertyDraft(draft, { save: vi.fn().mockResolvedValue({ ok: true, data: { id } }), upload, publish: vi.fn() }, (d) => { draft = d; })).rejects.toThrow("offline");
    expect(draft.savedId).toBe(id);
    expect(draft.files.map((f) => f.name)).toEqual(["b.jpg"]);
  });

  it("erros de campo do servidor são devolvidos intactos e mapeados para a etapa correta", async () => {
    const fieldErrors = { price: ["Valor inválido"] };
    const upload = vi.fn();
    const result = await persistPropertyDraft(draftWith([file("a.jpg")]), { save: vi.fn().mockResolvedValue({ ok: false, error: "Corrija os campos", fieldErrors }), upload, publish: vi.fn() }, () => {});
    expect(result).toEqual({ ok: false, error: "Corrija os campos", fieldErrors });
    expect(upload).not.toHaveBeenCalled();
    if (!result.ok) expect(stepForPropertyErrors(result.fieldErrors ?? {})).toBe(1);
  });

  it.each([
    [{ code: ["x"] }, 0], [{ price: ["x"] }, 1], [{ city: ["x"] }, 2], [{ featureIds: ["x"] }, 3], [{ status: ["x"] }, 5], [{ desconhecido: ["x"] }, 0], [{}, 0],
  ])("stepForPropertyErrors(%j) aponta para a etapa %i", (errors, step) => {
    expect(stepForPropertyErrors(errors)).toBe(step);
  });

  it("edição existente mantém o status solicitado no salvamento e não chama publish", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, data: { id } });
    const publish = vi.fn();
    await persistPropertyDraft(draftWith([file("a.jpg")], "sold", { existing: true, savedId: id }), { save, upload: vi.fn().mockResolvedValue(accepted), publish }, () => {});
    expect(save.mock.calls[0][0]).toMatchObject({ id, status: "sold" });
    expect(publish).not.toHaveBeenCalled();
  });
});
