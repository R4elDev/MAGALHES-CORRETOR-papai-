import { z } from "zod";
import type { FilterKey, PropertyCard, SearchFilters } from "./types";

// .strict(): qualquer campo extra (ex.: "status") vindo do cliente é REJEITADO.
// Disponibilidade nunca é um filtro opcional: é sempre forçada no servidor.
export const searchFiltersSchema = z
  .object({
    city: z.string().trim().min(1).max(80).optional(),
    neighborhood: z.string().trim().min(1).max(80).optional(),
    type: z.string().trim().min(1).max(40).optional(),
    purpose: z.enum(["sale", "rent"]).optional(),
    minPrice: z.number().finite().nonnegative().optional(),
    maxPrice: z.number().finite().positive().optional(),
    minBedrooms: z.number().int().min(0).max(20).optional(),
    minBathrooms: z.number().int().min(0).max(20).optional(),
    minParking: z.number().int().min(0).max(20).optional(),
  })
  .strict()
  .refine((f) => f.minPrice == null || f.maxPrice == null || f.minPrice <= f.maxPrice, {
    message: "minPrice deve ser <= maxPrice",
  });

export function parseFilters(raw: unknown): SearchFilters {
  return searchFiltersSchema.parse(raw ?? {});
}

export function norm(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function isAvailable(card: Pick<PropertyCard, "status">): boolean {
  return card.status === "published";
}

/** Critérios dos filtros que o card NÃO atende. Valor desconhecido (null) não atende. */
export function unmetCriteria(card: PropertyCard, f: SearchFilters): FilterKey[] {
  const out: FilterKey[] = [];
  if (!isAvailable(card)) out.push("availability");
  if (f.city && norm(card.city) !== norm(f.city)) out.push("city");
  if (f.neighborhood && norm(card.neighborhood) !== norm(f.neighborhood)) out.push("neighborhood");
  if (f.type && norm(card.type) !== norm(f.type)) out.push("type");
  if (f.purpose && card.purpose !== f.purpose) out.push("purpose");
  if (f.maxPrice != null && (card.price == null || card.price > f.maxPrice)) out.push("maxPrice");
  if (f.minPrice != null && (card.price == null || card.price < f.minPrice)) out.push("minPrice");
  if (f.minBedrooms != null && (card.bedrooms == null || card.bedrooms < f.minBedrooms))
    out.push("minBedrooms");
  if (f.minBathrooms != null && (card.bathrooms == null || card.bathrooms < f.minBathrooms))
    out.push("minBathrooms");
  if (f.minParking != null && (card.parking == null || card.parking < f.minParking))
    out.push("minParking");
  return out;
}

export const meetsHardFilters = (c: PropertyCard, f: SearchFilters) => unmetCriteria(c, f).length === 0;

/**
 * Filtros usados SÓ para buscar alternativas (nunca para "results"):
 * afrouxa quartos e dá folga de 15% no orçamento. Cidade/tipo/finalidade/disponibilidade ficam.
 * Todo card retornado carrega unmetCriteria contra os filtros ORIGINAIS.
 */
export function relaxedForAlternatives(f: SearchFilters): SearchFilters {
  const r: SearchFilters = { ...f };
  delete r.minBedrooms;
  delete r.minBathrooms;
  delete r.minParking;
  delete r.neighborhood;
  if (r.maxPrice != null) r.maxPrice = Math.round(r.maxPrice * 1.15);
  return r;
}
