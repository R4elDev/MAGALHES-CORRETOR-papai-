import { norm } from "./filters";
import type { PropertyCard, SearchFilters } from "./types";

// Ordem de prioridade da nota (4.2, camada 3). Pesos ajustáveis; soma não precisa ser 1.
export type RerankWeights = {
  availability: number;
  region: number;
  budget: number;
  type: number;
  bedrooms: number;
  extras: number;
  semantic: number;
  proximity: number;
};

export const DEFAULT_WEIGHTS: RerankWeights = {
  availability: 100,
  region: 30,
  budget: 20,
  type: 12,
  bedrooms: 8,
  extras: 5,
  semantic: 10,
  proximity: 10,
};

export type Signals = { fts?: number | null; semantic?: number | null };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function scoreCard(
  c: PropertyCard,
  f: SearchFilters,
  s: Signals = {},
  w: RerankWeights = DEFAULT_WEIGHTS,
): number {
  let t = 0;
  if (c.status === "published") t += w.availability;
  if (!f.city || norm(c.city) === norm(f.city)) t += w.region * (f.neighborhood && norm(c.neighborhood) === norm(f.neighborhood) ? 1 : 0.8);
  if (f.maxPrice != null && c.price != null && c.price <= f.maxPrice) {
    // dentro do orçamento; mais perto do teto = melhor aproveitamento, sem penalizar barato
    t += w.budget * (0.7 + 0.3 * clamp01(c.price / f.maxPrice));
  } else if (f.maxPrice == null) t += w.budget * 0.5;
  if (!f.type || norm(c.type) === norm(f.type)) t += w.type;
  if (f.minBedrooms == null || (c.bedrooms != null && c.bedrooms >= f.minBedrooms)) t += w.bedrooms;
  t += w.extras * clamp01(s.fts ?? 0);
  t += w.semantic * clamp01(s.semantic ?? 0); // semântica só desempata/refina
  if (c.distanceKm != null) t += w.proximity * clamp01(1 - c.distanceKm / 50);
  return t;
}

export function rerank(
  cards: PropertyCard[],
  f: SearchFilters,
  signals: Map<string, Signals> = new Map(),
  w: RerankWeights = DEFAULT_WEIGHTS,
): PropertyCard[] {
  return [...cards]
    .map((c) => ({ c, s: scoreCard(c, f, signals.get(c.id), w) }))
    .sort((a, b) => b.s - a.s || a.c.id.localeCompare(b.c.id))
    .map((x) => x.c);
}
