import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { must, safeLike, slugify, DalError } from "@/lib/db/errors";
import { signPhotoUrlsAdmin } from "@/lib/storage";
import type { AdminProperty, AdminPropertyRow, Paged, PropertyInput, PropertyStatus } from "@/types/db";

// Admin: roda com a sessao do admin; a RLS (is_admin) e a barreira real.
// Mutations NAO enfileiram nada manualmente: o trigger do banco grava o outbox (index_jobs) na mesma transacao.
// Exclusao e logica (deleted_at) para preservar leads/visitas; o trigger invalida o embedding.

const PAGE_SIZE = 20;
const LIST_COLS =
  "id, code, slug, title, status, type, purpose, price, city, neighborhood, featured, bedrooms, bathrooms, parking, area, updated_at, created_at";

type ListFilters = { status?: PropertyStatus; q?: string };

export async function list(filters: ListFilters = {}, page = 1, pageSize = PAGE_SIZE): Promise<Paged<AdminPropertyRow>> {
  const supabase = await createSessionClient();
  const from = (Math.max(page, 1) - 1) * pageSize;
  let q = supabase
    .from("properties")
    .select(LIST_COLS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (filters.status) q = q.eq("status", filters.status);
  const term = filters.q ? safeLike(filters.q) : "";
  if (term) q = q.or(`title.ilike.%${term}%,code.ilike.%${term}%,city.ilike.%${term}%,neighborhood.ilike.%${term}%`);
  const res = await q;
  const rows = must(res, "listar imoveis") as unknown as Array<Record<string, unknown>>;
  const total = res.count ?? rows.length;

  // capas (URL assinada) em lote
  const ids = rows.map((r) => r.id as string);
  const covers = ids.length
    ? must(await supabase.from("property_images").select("property_id, path").eq("is_cover", true).in("property_id", ids), "capas")
    : [];
  const coverPath = new Map((covers as { property_id: string; path: string }[]).map((c) => [c.property_id, c.path]));
  const urls = await signPhotoUrlsAdmin([...coverPath.values()]);

  const items = rows.map((r) => ({
    id: r.id, code: r.code, slug: r.slug, title: r.title, status: r.status, type: r.type, purpose: r.purpose,
    price: r.price == null ? null : Number(r.price), city: r.city, neighborhood: r.neighborhood, featured: r.featured,
    bedrooms: r.bedrooms, bathrooms: r.bathrooms, parking: r.parking,
    area_useful: r.area == null ? null : Number(r.area),
    updated_at: r.updated_at, created_at: r.created_at,
    cover_url: urls.get(coverPath.get(r.id as string) ?? "") ?? null,
  })) as AdminPropertyRow[];
  return { items, total, page, pageSize, hasMore: from + items.length < total };
}

export async function getById(id: string): Promise<AdminProperty | null> {
  const supabase = await createSessionClient();
  const res = await supabase
    .from("properties")
    .select("*, property_private(address, lat, lng), property_features(feature_id)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  const r = must(res, "buscar imovel") as Record<string, any> | null;
  if (!r) return null;
  const priv = Array.isArray(r.property_private) ? r.property_private[0] : r.property_private;
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: r.id, slug: r.slug, code: r.code, title: r.title, description: r.description, type: r.type,
    purpose: r.purpose, price: num(r.price), condo_fee: num(r.condo_fee), iptu: num(r.iptu),
    area_useful: num(r.area), area_total: num(r.area_total),
    bedrooms: r.bedrooms, bathrooms: r.bathrooms, suites: r.suites, parking: r.parking,
    city: r.city ?? "", state: r.state ?? "", neighborhood: r.neighborhood ?? "",
    address: priv?.address ?? null, hide_address: !r.address_public,
    latitude: priv?.lat ?? null, longitude: priv?.lng ?? null,
    status: r.status, featured: r.featured,
    feature_ids: (r.property_features ?? []).map((f: { feature_id: string }) => f.feature_id),
    published_at: r.published_at, created_at: r.created_at, updated_at: r.updated_at,
  };
}

function toRow(p: Partial<PropertyInput>) {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    code: "code", title: "title", description: "description", type: "type", purpose: "purpose", price: "price",
    condo_fee: "condo_fee", iptu: "iptu", area_useful: "area", area_total: "area_total", bedrooms: "bedrooms",
    bathrooms: "bathrooms", suites: "suites", parking: "parking", city: "city", state: "state",
    neighborhood: "neighborhood", status: "status", featured: "featured",
  };
  for (const [k, col] of Object.entries(map)) if (k in p) row[col] = (p as Record<string, unknown>)[k];
  if ("hide_address" in p) row.address_public = !p.hide_address;
  return row;
}

function toPrivate(p: Partial<PropertyInput>) {
  const row: Record<string, unknown> = {};
  if ("address" in p) row.address = p.address ?? null;
  if ("latitude" in p) row.lat = p.latitude ?? null;
  if ("longitude" in p) row.lng = p.longitude ?? null;
  return row;
}

export async function create(input: PropertyInput): Promise<{ id: string; slug: string }> {
  const supabase = await createSessionClient();
  const base = slugify(`${input.title}-${input.code}`) || "imovel";
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const res = await supabase.from("properties").insert({ ...toRow(input), slug }).select("id, slug").single();
    if (res.error?.code === "23505") {
      if (/code/.test(res.error.message)) throw new DalError("Codigo interno ja utilizado", "23505");
      continue; // slug repetido: tenta de novo com sufixo
    }
    const created = must(res, "criar imovel") as { id: string; slug: string };
    const priv = toPrivate(input);
    if (Object.keys(priv).length) {
      must(await supabase.from("property_private").upsert({ property_id: created.id, ...priv }), "salvar dados privados");
    }
    return created;
  }
  throw new DalError("Nao foi possivel gerar slug unico");
}

export async function update(id: string, patch: Partial<PropertyInput>): Promise<void> {
  const supabase = await createSessionClient();
  const row = toRow(patch);
  if (Object.keys(row).length) must(await supabase.from("properties").update(row).eq("id", id).is("deleted_at", null), "atualizar imovel");
  const priv = toPrivate(patch);
  if (Object.keys(priv).length) {
    must(await supabase.from("property_private").upsert({ property_id: id, ...priv, updated_at: new Date().toISOString() }), "salvar dados privados");
  }
}

export async function setStatus(id: string, status: PropertyStatus): Promise<void> {
  await update(id, { status });
}

/** Exclusao logica: some do site e da IA (trigger invalida), preserva historico de leads/visitas. */
export async function remove(id: string): Promise<void> {
  const supabase = await createSessionClient();
  must(await supabase.from("properties").update({ deleted_at: new Date().toISOString(), status: "archived" }).eq("id", id), "excluir imovel");
}
