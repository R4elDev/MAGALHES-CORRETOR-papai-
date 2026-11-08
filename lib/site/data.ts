import "server-only";
import type { PropertyCard, PropertyDetail, PublicFilters, PublicSort, SiteSettings, Paged } from "@/types/db";
import * as dal from "@/lib/dal/public";

// Camada de leitura do site: se o banco ainda não estiver configurado, o site mostra estado vazio honesto (nunca dados fictícios).
export type Loaded<T> = { data: T; error: boolean };

async function safe<T>(fn: () => Promise<T>, empty: T): Promise<Loaded<T>> {
  try {
    return { data: await fn(), error: false };
  } catch {
    return { data: empty, error: true };
  }
}

export const loadSettings = (): Promise<Loaded<SiteSettings | null>> => safe(() => dal.getSiteSettings(), null);

export const loadFeatured = (limit = 6): Promise<Loaded<PropertyCard[]>> => safe(() => dal.getFeatured(limit), []);

export const loadList = (filters: PublicFilters, page: number, sort: PublicSort): Promise<Loaded<Paged<PropertyCard>>> =>
  safe(() => dal.listPublishedProperties(filters, page, sort), { items: [], total: 0, page, pageSize: 12, hasMore: false });

export const loadDetail = (slug: string): Promise<Loaded<PropertyDetail | null>> => safe(() => dal.getPublishedBySlug(slug), null);
