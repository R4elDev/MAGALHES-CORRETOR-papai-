import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));
const requireAdmin = vi.fn();
vi.mock("@/lib/auth", () => ({ requireAdmin: () => requireAdmin() }));

import { parseMoney } from "@/lib/admin/format";
import { propertyFormSchema, settingsSchema, leadCreateSchema, visitSchema } from "@/lib/admin/forms";
import { adminAction } from "@/lib/admin/guard";
import { propertyToDal } from "@/lib/admin/mappers";

const validProperty = {
  code: "MG-001", title: "Apartamento 2 quartos", type: "apartment", purpose: "sale", price: "R$ 350.000,00",
  city: "Barueri", state: "sp", neighborhood: "Centro", hideAddress: true,
};

describe("parseMoney", () => {
  it.each([["R$ 350.000,50", 350000.5], ["350.000", 350000], ["1200", 1200], ["", null], ["abc", null]])("%s", (i, o) =>
    expect(parseMoney(i)).toBe(o));
});

describe("propertyFormSchema", () => {
  it("aceita imóvel válido e normaliza UF/preço", () => {
    const r = propertyFormSchema.parse(validProperty);
    expect(r.price).toBe(350000);
    expect(r.state).toBe("SP");
    expect(r.status).toBe("draft");
    expect(propertyToDal(r).hide_address).toBe(true);
  });
  it("rejeita preço zero/ausente e status inválido", () => {
    expect(propertyFormSchema.safeParse({ ...validProperty, price: "" }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validProperty, status: "vendidoo" }).success).toBe(false);
  });
  it("exige latitude e longitude juntas", () => {
    expect(propertyFormSchema.safeParse({ ...validProperty, latitude: "-23.5" }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validProperty, latitude: "-23.5", longitude: "-46.6" }).success).toBe(true);
  });
});

describe("settingsSchema", () => {
  const base = { businessName: "Magalhães Corretor", whatsapp: "+55 (11) 99999-9999" };
  it("normaliza WhatsApp para dígitos", () => expect(settingsSchema.parse(base).whatsapp).toBe("5511999999999"));
  it("rejeita WhatsApp curto", () => expect(settingsSchema.safeParse({ ...base, whatsapp: "999" }).success).toBe(false));
  it("não possui campos de chave de IA", () => expect(Object.keys(settingsSchema.shape).join()).not.toMatch(/key|token|secret|api/i));
});

describe("leads e visitas", () => {
  it("lead manual aceita sem nome/telefone, mas valida telefone informado", () => {
    expect(leadCreateSchema.safeParse({}).success).toBe(true);
    expect(leadCreateSchema.safeParse({ phone: "12ab" }).success).toBe(false);
  });
  it("visita exige imóvel e data válida", () => {
    expect(visitSchema.safeParse({ scheduledAt: "x", propertyId: "no" }).success).toBe(false);
    expect(visitSchema.safeParse({ scheduledAt: "2026-12-01T10:00", propertyId: crypto.randomUUID() }).success).toBe(true);
  });
});

describe("adminAction (autorização + validação)", () => {
  const handler = vi.fn(async () => ({ ok: true as const, data: 1 }));
  const action = adminAction(z.object({ n: z.number() }), handler);
  beforeEach(() => { handler.mockClear(); requireAdmin.mockReset(); });

  it("não executa o handler sem admin (requireAdmin lança)", async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;/admin/login" }));
    await expect(action({ n: 1 })).rejects.toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });
  it("devolve erro de campo recuperável com input inválido", async () => {
    requireAdmin.mockResolvedValue({ id: "1", email: "a@b.c", role: "admin" });
    const r = await action({ n: "x" });
    expect(r.ok).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });
  it("converte exceção do DAL em erro amigável sem vazar detalhes", async () => {
    requireAdmin.mockResolvedValue({ id: "1", email: "a@b.c", role: "admin" });
    handler.mockRejectedValueOnce(new Error("pg: connection string postgres://secret"));
    const r = await action({ n: 1 });
    expect(r).toMatchObject({ ok: false });
    expect(JSON.stringify(r)).not.toContain("secret");
  });
  it("executa com sessão admin e input válido", async () => {
    requireAdmin.mockResolvedValue({ id: "1", email: "a@b.c", role: "admin" });
    expect(await action({ n: 1 })).toEqual({ ok: true, data: 1 });
  });
});
