import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { StructuredDeps } from "./structured";
import type { PropertyCard, SearchFilters } from "./types";
import { mapRow } from "./hybrid";

// Acesso a dados da busca pública. Lê SÓ a view public_properties (published, sem endereço exato).
let client: ReturnType<typeof createServiceClient> | null = null;
export function db() {
  return (client ??= createServiceClient()); // lança se env ausente; as rotas tratam com 503
}

const COLS =
  "id,code,slug,title,description,purpose,type,price,city,neighborhood,bedrooms,bathrooms,parking,area,lat,lng,cover_path,featured";
const esc = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`); // ilike sem curinga

/** Assina URLs das capas (bucket property-images é privado). Falha de assinatura => sem foto, nunca erro. */
async function signCovers(cards: PropertyCard[], paths: Map<string, string>): Promise<PropertyCard[]> {
  const list = [...new Set(paths.values())];
  if (list.length === 0) return cards;
  const { data } = await db().storage.from("property-images").createSignedUrls(list, 3600);
  const byPath = new Map((data ?? []).map((d) => [d.path ?? "", d.signedUrl]));
  return cards.map((c) => {
    const url = byPath.get(paths.get(c.id) ?? "") ?? null;
    return { ...c, coverUrl: url, photos: url ? [url] : [] };
  });
}

export const structuredSource: StructuredDeps = {
  async fetchCandidates(f: SearchFilters, limit: number) {
    let q = db().from("public_properties").select(COLS).limit(limit);
    if (f.city) q = q.ilike("city", esc(f.city));
    if (f.neighborhood) q = q.ilike("neighborhood", esc(f.neighborhood));
    if (f.type) q = q.ilike("type", esc(f.type));
    if (f.purpose) q = q.eq("purpose", f.purpose);
    if (f.maxPrice != null) q = q.lte("price", f.maxPrice);
    if (f.minPrice != null) q = q.gte("price", f.minPrice);
    if (f.minBedrooms != null) q = q.gte("bedrooms", f.minBedrooms);
    if (f.minBathrooms != null) q = q.gte("bathrooms", f.minBathrooms);
    if (f.minParking != null) q = q.gte("parking", f.minParking);
    const { data, error } = await q.order("featured", { ascending: false }).order("price", { ascending: true });
    if (error) throw new Error("Falha na busca de imóveis");
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    const paths = new Map<string, string>();
    // A view só contém imóveis published; status explícito para o filtro de disponibilidade do servidor.
    const cards = rows.map((r) => {
      if (typeof r.cover_path === "string") paths.set(String(r.id), r.cover_path);
      return mapRow({ ...r, status: "published", area_m2: r.area });
    });
    return signCovers(cards, paths);
  },
};

/** Cidades que realmente têm imóvel publicado (alimenta a etapa "Localização"). */
export async function listAvailableCities(): Promise<string[]> {
  const { data } = await db().from("public_properties").select("city").not("city", "is", null).limit(1000);
  const set = new Set((data ?? []).map((r) => String((r as { city: string }).city)));
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function getWhatsAppNumber(): Promise<string | null> {
  const { data } = await db().from("public_site_settings").select("whatsapp_number").limit(1).maybeSingle();
  return (data as { whatsapp_number?: string } | null)?.whatsapp_number ?? null;
}
