// Busca híbrida (nota 4.2): SQL (filtros duros dentro do RPC) + pgvector + rerank.
// O LLM nunca decide filtro duro nem enxerga ids que não passaram aqui.
import { meetsHardFilters, parseFilters, relaxedForAlternatives, unmetCriteria } from "./filters";
import { rerank, type Signals } from "./rerank";
import type { AlternativeCard, PropertyCard, SearchFilters, SearchInput, SearchOutput } from "./types";

type RpcResult<T> = Promise<{ data: T | null; error: { message: string } | null }>;
export type SearchDeps = {
  rpc: <T = unknown>(name: string, args: Record<string, unknown>) => RpcResult<T>;
  /** undefined = embeddings não configurados -> modo "structured" honesto. */
  embedQuery?: (text: string) => Promise<string>; // retorna literal pgvector
};

type HybridRow = { property_id: string; fts_score?: number | null; semantic_score?: number | null };
type Row = Record<string, unknown>;

const num = (v: unknown) => (v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** Mapeia a linha de get_properties_for_response (snake_case) para PropertyCard. Ausente = null. */
export function mapRow(r: Row): PropertyCard {
  const photos = Array.isArray(r.photos) ? (r.photos as unknown[]).filter((p): p is string => typeof p === "string") : [];
  return {
    id: String(r.id),
    code: str(r.code),
    slug: str(r.slug),
    title: String(r.title ?? ""),
    description: str(r.description),
    status: String(r.status ?? "unknown"),
    price: num(r.price),
    city: str(r.city),
    neighborhood: str(r.neighborhood),
    type: str(r.type),
    purpose: str(r.purpose),
    bedrooms: num(r.bedrooms),
    bathrooms: num(r.bathrooms),
    parking: num(r.parking),
    areaM2: num(r.area_m2 ?? r.area),
    features: Array.isArray(r.features) ? (r.features as unknown[]).filter((x): x is string => typeof x === "string") : [],
    coverUrl: str(r.cover_url),
    photos,
    lat: num(r.lat),
    lng: num(r.lng),
    distanceKm: null,
  };
}

async function candidates(
  deps: SearchDeps,
  filters: SearchFilters,
  query: string | undefined,
  vec: string | null,
  limit: number,
) {
  const { data, error } = await deps.rpc<HybridRow[]>("search_properties_hybrid", {
    p_filters: filters,
    p_query_text: query ?? "",
    p_query_embedding: vec,
    p_limit: limit,
  });
  if (error) throw new Error("Falha na busca de imóveis");
  const signals = new Map<string, Signals>();
  for (const r of data ?? []) signals.set(r.property_id, { fts: r.fts_score ?? null, semantic: r.semantic_score ?? null });
  return signals;
}

/** Reconfirma preço/status na base transacional (nota 4.3). Só volta o que ainda está published. */
async function confirm(deps: SearchDeps, ids: string[]): Promise<PropertyCard[]> {
  if (ids.length === 0) return [];
  const { data, error } = await deps.rpc<Row[]>("get_properties_for_response", { p_ids: ids });
  if (error) throw new Error("Falha ao confirmar imóveis");
  return (data ?? []).map(mapRow);
}

export async function searchProperties(input: SearchInput, deps: SearchDeps, limit = 12): Promise<SearchOutput> {
  const filters = parseFilters(input.filters); // rejeita campos extras (ex.: status)
  const query = input.query?.trim().slice(0, 500) || undefined;

  let vec: string | null = null;
  if (query && deps.embedQuery) {
    try {
      vec = await deps.embedQuery(query);
    } catch {
      vec = null; // degrada para estruturado, sem fingir semântica
    }
  }
  const mode = vec ? "hybrid" : "structured";

  const signals = await candidates(deps, filters, query, vec, limit);
  const confirmed = await confirm(deps, [...signals.keys()]);
  // Defesa em profundidade: mesmo que o SQL falhe, o servidor re-aplica os filtros duros.
  const results = rerank(confirmed.filter((c) => meetsHardFilters(c, filters)), filters, signals);

  let alternatives: AlternativeCard[] = [];
  if (results.length === 0) {
    const relaxed = relaxedForAlternatives(filters);
    const altSignals = await candidates(deps, relaxed, query, vec, limit);
    const altCards = await confirm(deps, [...altSignals.keys()]);
    alternatives = rerank(altCards, relaxed, altSignals)
      .map((card) => ({ card, unmetCriteria: unmetCriteria(card, filters) }))
      .filter((a) => a.unmetCriteria.length > 0 && !a.unmetCriteria.includes("availability"))
      .slice(0, 4);
  }

  return { mode, results, alternatives, noResults: results.length === 0 };
}
