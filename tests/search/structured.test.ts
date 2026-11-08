import { describe, expect, it } from "vitest";
import { meetsHardFilters, parseFilters, unmetCriteria } from "@/lib/search/filters";
import { haversineKm } from "@/lib/search/geo";
import { rateLimit, _resetRateLimit } from "@/lib/search/rate-limit";
import { leadRequestSchema } from "@/lib/search/request";
import { searchStructured } from "@/lib/search/structured";
import { prefsFromFilters, whatsappForSearch } from "@/lib/recommendations/whatsapp";
import type { PropertyCard, SearchFilters } from "@/lib/search/types";

const card = (o: Partial<PropertyCard> = {}): PropertyCard => ({
  id: "id-" + Math.random().toString(36).slice(2),
  code: "MG-1",
  slug: "casa-1",
  title: "Apto",
  description: null,
  status: "published",
  price: 300_000,
  city: "Barueri",
  neighborhood: "Centro",
  type: "apartment",
  purpose: "sale",
  bedrooms: 2,
  bathrooms: 1,
  parking: 1,
  areaM2: 60,
  features: [],
  coverUrl: null,
  photos: [],
  lat: null,
  lng: null,
  distanceKm: null,
  ...o,
});
const source = (all: PropertyCard[]) => ({
  // simula um SQL DEFEITUOSO que ignora filtros: o servidor tem que re-filtrar
  fetchCandidates: async () => all,
});

describe("filtros duros", () => {
  it("rejeita campo status vindo do cliente", () => {
    expect(() => parseFilters({ city: "Barueri", status: "sold" })).toThrow();
  });
  it("imóvel acima do orçamento, outra cidade, tipo ou poucos quartos não passa", () => {
    const f: SearchFilters = { city: "Barueri", maxPrice: 350_000, type: "apartment", minBedrooms: 2 };
    expect(meetsHardFilters(card(), f)).toBe(true);
    expect(unmetCriteria(card({ price: 400_000 }), f)).toEqual(["maxPrice"]);
    expect(unmetCriteria(card({ city: "Osasco" }), f)).toEqual(["city"]);
    expect(unmetCriteria(card({ type: "house" }), f)).toEqual(["type"]);
    expect(unmetCriteria(card({ bedrooms: 1 }), f)).toEqual(["minBedrooms"]);
  });
  it("cidade ignora acento/caixa; preço desconhecido não atende teto", () => {
    expect(meetsHardFilters(card({ city: "São Paulo" }), { city: "sao paulo" })).toBe(true);
    expect(unmetCriteria(card({ price: null }), { maxPrice: 1 })).toContain("maxPrice");
  });
});

describe("searchStructured", () => {
  it("nunca devolve indisponível, mesmo que o SQL devolva", async () => {
    const out = await searchStructured(
      { filters: { city: "Barueri" } },
      source([card({ status: "sold" }), card({ status: "reserved" }), card({ status: "draft" })]),
    );
    expect(out.results).toHaveLength(0);
    expect(out.noResults).toBe(true);
    expect(out.alternatives).toHaveLength(0); // indisponível nem como alternativa
  });
  it("sem resultado: alternativas só com critérios não atendidos explícitos", async () => {
    const cheio = card({ price: 380_000 }); // 8,5% acima do teto de 350k
    const out = await searchStructured({ filters: { city: "Barueri", maxPrice: 350_000 } }, source([cheio]));
    expect(out.results).toHaveLength(0);
    expect(out.alternatives).toHaveLength(1);
    expect(out.alternatives[0].unmetCriteria).toEqual(["maxPrice"]);
  });
  it("ordem determinística e respeita proximidade quando há geo", async () => {
    const perto = card({ id: "a", lat: -23.5, lng: -46.87 });
    const longe = card({ id: "b", lat: -22.9, lng: -43.2 });
    const geo = { lat: -23.5, lng: -46.87 };
    const o1 = await searchStructured({ filters: { city: "Barueri" }, geo }, source([longe, perto]));
    const o2 = await searchStructured({ filters: { city: "Barueri" }, geo }, source([perto, longe]));
    expect(o1.results.map((c) => c.id)).toEqual(["a", "b"]);
    expect(o2.results.map((c) => c.id)).toEqual(["a", "b"]);
    expect(o1.results[0].distanceKm).toBe(0);
  });
  it("sem geo não calcula distância", async () => {
    const out = await searchStructured({ filters: {} }, source([card({ lat: 1, lng: 1 })]));
    expect(out.results[0].distanceKm).toBeNull();
    expect(out.mode).toBe("structured");
  });
});

describe("geo", () => {
  it("haversine ~ São Paulo-Rio ≈ 360 km", () => {
    const d = haversineKm({ lat: -23.55, lng: -46.63 }, { lat: -22.9, lng: -43.17 });
    expect(d).toBeGreaterThan(350);
    expect(d).toBeLessThan(370);
  });
});

describe("WhatsApp da busca", () => {
  it("sem resultados usa a mensagem de sem-resultados e leva as preferências", () => {
    const url = whatsappForSearch("11999998888", { results: [], noResults: true }, prefsFromFilters({ city: "Barueri", maxPrice: 300000 }), "https://x.com")!;
    expect(url.startsWith("https://wa.me/5511999998888?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1]);
    expect(text).toContain("não encontrei um imóvel");
    expect(text).toContain("Barueri");
  });
  it("com resultados inclui códigos e links; sem número configurado => null", () => {
    const url = whatsappForSearch("11999998888", { results: [card({ code: "MG-7", slug: "x" })], noResults: false }, {}, "https://x.com")!;
    expect(decodeURIComponent(url)).toContain("MG-7 https://x.com/imoveis/x");
    expect(whatsappForSearch(null, { results: [], noResults: true }, {}, "https://x.com")).toBeNull();
  });
  it("renda só aparece se o visitante informou", () => {
    const t = (income?: string) =>
      decodeURIComponent(whatsappForSearch("11999998888", { results: [], noResults: false }, { income }, "https://x.com")!);
    expect(t("R$ 4.000")).toContain("R$ 4.000");
    expect(t()).toContain("Renda aproximada: não informado");
  });
});

describe("leads e rate limit", () => {
  const base = { name: "Maria", phone: "11 99999-8888", source: "search", consent: true, propertyIds: [] };
  it("exige consentimento e algum contato", () => {
    expect(leadRequestSchema.safeParse(base).success).toBe(true);
    expect(leadRequestSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(leadRequestSchema.safeParse({ ...base, phone: undefined }).success).toBe(false);
  });
  it("rate limit bloqueia após o máximo na janela", () => {
    _resetRateLimit();
    const r = [1, 2, 3, 4].map(() => rateLimit("k", 3, 1000, 0));
    expect(r).toEqual([true, true, true, false]);
    expect(rateLimit("k", 3, 1000, 2000)).toBe(true);
  });
});

describe("validação extra", () => {
  it("minPrice maior que maxPrice é rejeitado", () => {
    expect(() => parseFilters({ minPrice: 500_000, maxPrice: 300_000 })).toThrow();
    expect(parseFilters({ minPrice: 100_000, maxPrice: 300_000 })).toEqual({ minPrice: 100_000, maxPrice: 300_000 });
  });
  it("alternativas nunca entram em results", async () => {
    const ok = card({ id: "ok", price: 300_000 });
    const fora = card({ id: "fora", price: 380_000 });
    const out = await searchStructured({ filters: { maxPrice: 350_000 } }, source([ok, fora]));
    expect(out.results.map((c) => c.id)).toEqual(["ok"]);
    expect(out.alternatives).toHaveLength(0); // só há alternativas quando results está vazio
  });
});

describe("place (cidade OU bairro)", () => {
  it("texto de bairro não gera falso zero", async () => {
    const alpha = card({ id: "alpha", city: "Barueri", neighborhood: "Alphaville" });
    const centro = card({ id: "centro", city: "Barueri", neighborhood: "Centro" });
    const out = await searchStructured({ filters: { place: "alphaville" } }, source([alpha, centro]));
    expect(out.results.map((c) => c.id)).toEqual(["alpha"]);
    const porCidade = await searchStructured({ filters: { place: "barueri" } }, source([alpha, centro]));
    expect(porCidade.results).toHaveLength(2);
  });
  it("whatsapp inclui observações livres só no link", () => {
    const url = whatsappForSearch("11999998888", { results: [], noResults: true }, {}, "https://x.com", "perto de escola")!;
    expect(decodeURIComponent(url)).toContain("Observações: perto de escola");
  });
});
