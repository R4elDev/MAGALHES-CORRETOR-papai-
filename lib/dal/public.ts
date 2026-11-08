import "server-only";
import { createAnonClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { must, safeLike } from "@/lib/db/errors";
import { signPhotoUrls } from "@/lib/storage";
import * as siteSettings from "@/lib/dal/siteSettings";
import type { Paged, PropertyCard, PropertyDetail, PublicFilters, PublicSort, SiteSettings } from "@/types/db";

// Leitura publica: SOMENTE views public_* (published, sem endereco privado) via anon.
// Catalogo vazio => itens vazios (sem seed/mocks).

const NEW_DAYS = 14;
const CARD_COLS =
  "id, code, slug, title, purpose, type, price, city, state, neighborhood, bedrooms, bathrooms, parking, area, featured, published_at, created_at, cover_path";

type Row = Record<string, any>;
const num = (v: unknown) => (v == null ? null : Number(v));

function toCard(r: Row, coverUrl: string | null): PropertyCard {
  const since = r.published_at ?? r.created_at;
  return {
    id: r.id, code: r.code ?? null, slug: r.slug, title: r.title, purpose: r.purpose, type: r.type,
    price: num(r.price), city: r.city, state: r.state, neighborhood: r.neighborhood,
    bedrooms: r.bedrooms, bathrooms: r.bathrooms, parking: r.parking, area: num(r.area),
    featured: !!r.featured, publishedAt: r.published_at ?? null,
    isNew: since ? Date.now() - new Date(since).getTime() < NEW_DAYS * 86_400_000 : false,
    coverUrl,
  };
}

async function cardsFrom(rows: Row[]): Promise<PropertyCard[]> {
  const urls = await signPhotoUrls(rows.map((r) => r.cover_path).filter(Boolean));
  return rows.map((r) => toCard(r, r.cover_path ? urls.get(r.cover_path) ?? null : null));
}

export async function listPublishedProperties(
  filters: PublicFilters = {},
  page = 1,
  sort: PublicSort = "recent",
  pageSize = 12,
): Promise<Paged<PropertyCard>> {
  const from = (Math.max(page, 1) - 1) * pageSize;
  let q = createAnonClient().from("public_properties").select(CARD_COLS, { count: "exact" });
  const t = filters.q ? safeLike(filters.q) : "";
  if (t) q = q.or(`title.ilike.%${t}%,city.ilike.%${t}%,neighborhood.ilike.%${t}%,code.ilike.%${t}%`);
  if (filters.city) q = q.ilike("city", safeLike(filters.city));
  if (filters.neighborhood) q = q.ilike("neighborhood", safeLike(filters.neighborhood));
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.purpose) q = q.eq("purpose", filters.purpose);
  if (filters.minPrice != null) q = q.gte("price", filters.minPrice);
  if (filters.maxPrice != null) q = q.lte("price", filters.maxPrice);
  if (filters.minBedrooms != null) q = q.gte("bedrooms", filters.minBedrooms);
  if (filters.minParking != null) q = q.gte("parking", filters.minParking);
  if (filters.featured) q = q.eq("featured", true);
  if (sort === "price_asc") q = q.order("price", { ascending: true, nullsFirst: false });
  else if (sort === "price_desc") q = q.order("price", { ascending: false, nullsFirst: false });
  else q = q.order("published_at", { ascending: false, nullsFirst: false });
  const res = await q.order("id").range(from, from + pageSize - 1);
  const rows = must(res, "listar imoveis publicados") as unknown as Row[];
  const total = res.count ?? rows.length;
  return { items: await cardsFrom(rows), total, page, pageSize, hasMore: from + rows.length < total };
}

export async function getFeatured(limit = 6): Promise<PropertyCard[]> {
  const res = await createAnonClient()
    .from("public_properties")
    .select(CARD_COLS)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return cardsFrom(must(res, "destaques") as unknown as Row[]);
}

export async function getPublishedBySlug(slug: string): Promise<PropertyDetail | null> {
  const anon = createAnonClient();
  const r = must(
    await anon.from("public_properties").select("*").eq("slug", slug).maybeSingle(),
    "buscar imovel",
  ) as Row | null;
  if (!r) return null;
  const [imgs, feats] = await Promise.all([
    anon.from("public_property_images").select("path, width, height, position").eq("property_id", r.id).order("position"),
    anon.from("public_property_features").select("name").eq("property_id", r.id).order("name"),
  ]);
  const images = must(imgs, "fotos") as { path: string; width: number | null; height: number | null }[];
  const urls = await signPhotoUrls(images.map((i) => i.path));
  const card = toCard(r, r.cover_path ? urls.get(r.cover_path) ?? null : null);
  const names = (must(feats, "comodidades") as { name: string }[]).map((f) => f.name);
  return {
    ...card,
    description: r.description ?? null, condoFee: num(r.condo_fee), iptu: num(r.iptu), suites: r.suites ?? null,
    areaTotal: num(r.area_total), region: r.region ?? null, address: r.address ?? null,
    lat: r.lat ?? null, lng: r.lng ?? null, features: names,
    photos: images.flatMap((i) => (urls.has(i.path) ? [{ url: urls.get(i.path)!, width: i.width, height: i.height }] : [])),
  };
}

/** Configuracoes publicas (nome, WhatsApp, e-mail, CRECI, redes, textos). */
export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings.get();
}

/** Registra visualizacao (alimenta "mais vistos"). So conta imovel published. Falha silenciosa. */
export async function recordPropertyView(propertyId: string): Promise<void> {
  try {
    const svc = createServiceClient();
    const ok = await svc.from("properties").select("id").eq("id", propertyId).eq("status", "published").is("deleted_at", null).maybeSingle();
    if (ok.data) await svc.from("property_views").insert({ property_id: propertyId });
  } catch {
    /* metrica nao pode quebrar a pagina */
  }
}
