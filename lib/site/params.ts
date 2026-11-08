import type { PublicFilters, PublicSort } from "@/types/db";

export type SP = Record<string, string | string[] | undefined>;

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function num(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Filtros do catálogo vêm da URL (compartilháveis): q, tipo, finalidade, min, max, quartos, vagas, ordem, pagina. */
export function parseCatalogParams(sp: SP) {
  const filters: PublicFilters = {
    q: one(sp.q),
    type: one(sp.tipo),
    purpose: one(sp.finalidade) === "rent" ? "rent" : one(sp.finalidade) === "sale" ? "sale" : undefined,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    minBedrooms: num(sp.quartos),
    minParking: num(sp.vagas),
  };
  const o = one(sp.ordem);
  const sort: PublicSort = o === "price_asc" || o === "price_desc" ? o : "recent";
  const page = Math.max(1, Math.floor(num(sp.pagina) ?? 1));
  const filtered = Object.values(filters).some((v) => v !== undefined);
  return { filters, sort, page, filtered };
}

/** Monta /?...#imoveis preservando os filtros e trocando a página. */
export function catalogHref(sp: SP, page: number): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== "pagina") u.set(k, val);
  }
  if (page > 1) u.set("pagina", String(page));
  const s = u.toString();
  return `/${s ? `?${s}` : ""}#imoveis`;
}
