// Busca estruturada determinística (SEM IA/embeddings): filtros duros no SQL + re-checagem no
// servidor + ranking por pontuação fixa. É o caminho do questionário "Encontre seu imóvel".
import { meetsHardFilters, parseFilters, relaxedForAlternatives, unmetCriteria } from "./filters";
import { haversineKm } from "./geo";
import { rerank } from "./rerank";
import type { AlternativeCard, Geo, PropertyCard, SearchFilters, SearchInput, SearchOutput } from "./types";

export type StructuredDeps = {
  /** Candidatos já filtrados no SQL (view public_properties: só published). */
  fetchCandidates: (f: SearchFilters, limit: number) => Promise<PropertyCard[]>;
};

const withDistance = (cards: PropertyCard[], geo?: Geo): PropertyCard[] =>
  geo
    ? cards.map((c) => ({
        ...c,
        distanceKm: c.lat != null && c.lng != null ? Math.round(haversineKm(geo, { lat: c.lat, lng: c.lng }) * 10) / 10 : null,
      }))
    : cards;

export async function searchStructured(
  input: SearchInput,
  deps: StructuredDeps,
  opts: { limit?: number } = {},
): Promise<SearchOutput> {
  const limit = opts.limit ?? 12;
  const filters = parseFilters(input.filters); // rejeita campos extras (ex.: status)

  const found = withDistance(await deps.fetchCandidates(filters, 100), input.geo);
  // Defesa em profundidade: o servidor re-aplica TODOS os filtros duros (inclui disponibilidade).
  const results = rerank(found.filter((c) => meetsHardFilters(c, filters)), filters).slice(0, limit);

  let alternatives: AlternativeCard[] = [];
  if (results.length === 0) {
    const relaxed = relaxedForAlternatives(filters);
    const alt = withDistance(await deps.fetchCandidates(relaxed, 100), input.geo);
    alternatives = rerank(alt, relaxed)
      .map((card) => ({ card, unmetCriteria: unmetCriteria(card, filters) }))
      .filter((a) => a.unmetCriteria.length > 0 && !a.unmetCriteria.includes("availability"))
      .slice(0, 4);
  }
  return { mode: "structured", results, alternatives, noResults: results.length === 0 };
}
