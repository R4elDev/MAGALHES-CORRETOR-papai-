// Tipos do contrato de dados (dono: [BANCO] Lastro). Mantidos a mao enquanto nao ha `supabase gen types`.
// Colunas = migrations em supabase/migrations. Ausente/desconhecido = null (nunca inventar).

export type PropertyStatus = "draft" | "published" | "reserved" | "sold" | "rented" | "archived";
export type PropertyPurpose = "sale" | "rent";
export type LeadStatus = "new" | "first_contact" | "negotiating" | "visit_scheduled" | "done" | "lost";
export type LeadContactKind = "click" | "confirmed" | "manual";
export type VisitStatus = "scheduled" | "done" | "cancelled" | "no_show";
export type LeadActivityType = "note" | "status_change" | "contact" | "contact_confirmed" | "visit";

// ---------- Admin ----------
/** Entrada do admin (create/update). Nomes iguais aos de lib/admin/mappers.ts. */
export type PropertyInput = {
  code: string; title: string; description: string | null;
  type: string; purpose: PropertyPurpose; price: number | null;
  condo_fee: number | null; iptu: number | null;
  area_useful: number | null; area_total: number | null;
  bedrooms: number | null; bathrooms: number | null; suites: number | null; parking: number | null;
  city: string; state: string; neighborhood: string;
  address: string | null; hide_address: boolean;
  latitude: number | null; longitude: number | null;
  status: PropertyStatus; featured: boolean;
};

/** Leitura do admin: inclui dados privados (endereco/coordenada exatos). */
export type AdminProperty = PropertyInput & {
  id: string; slug: string; feature_ids: string[];
  published_at: string | null; created_at: string; updated_at: string;
};

export type AdminPropertyRow = Pick<AdminProperty,
  "id" | "code" | "slug" | "title" | "status" | "type" | "purpose" | "price" | "city" | "neighborhood" |
  "featured" | "bedrooms" | "bathrooms" | "parking" | "area_useful" | "updated_at" | "created_at"> & {
  cover_url: string | null; // URL assinada da capa (expira)
};

export type PropertyImage = {
  id: string; property_id: string; path: string;
  url: string | null; // URL assinada (bucket privado), expira; renovar a cada render
  width: number | null; height: number | null; position: number; is_cover: boolean;
};

export type Feature = { id: string; slug: string; name: string };

export type Lead = {
  id: string; name: string | null; phone: string | null; email: string | null;
  status: LeadStatus; contact_kind: LeadContactKind; source: string | null;
  next_contact_at: string | null; created_at: string; updated_at: string;
  // de lead_preferences / lead_properties (admin only)
  region: string | null; budget: number | null; income: string | null; preferences: string | null;
  property_ids: string[];
  property_id: string | null; property_title: string | null; // 1o imovel de interesse (join)
};

export type LeadActivity = {
  id: string; lead_id: string; type: LeadActivityType; note: string | null;
  created_by: string | null; created_at: string;
};

export type Visit = {
  id: string; property_id: string; lead_id: string | null; visitor_name: string | null;
  scheduled_at: string; status: VisitStatus; notes: string | null;
  property_title: string | null; property_code: string | null; lead_name: string | null;
  created_at: string; updated_at: string;
};

export type SiteSettings = {
  business_name: string | null; logo_url: string | null; avatar_url: string | null;
  whatsapp: string | null; whatsapp_number: string | null; // alias de whatsapp
  email: string | null; bio: string | null; creci: string | null;
  instagram: string | null; facebook: string | null; youtube: string | null; tiktok: string | null;
  default_message: string | null; hero_title: string | null; hero_subtitle: string | null;
  featured_limit: number;
};

export type DashboardStats = {
  totalProperties: number; published: number; reservedOrSold: number;
  newLeads: number; leadsInProgress: number; leadsLast30d: number;
  mostViewed: { id: string; title: string; count: number }[];
  mostInterest: { id: string; title: string; count: number }[];
  leadsByWeek: { week: string; count: number }[];
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number; hasMore: boolean };

// ---------- Publico (view public_properties; nunca endereco privado) ----------
export type PropertyCard = {
  id: string; code: string | null; slug: string; title: string;
  purpose: PropertyPurpose; type: string; price: number | null;
  city: string | null; state: string | null; neighborhood: string | null;
  bedrooms: number | null; bathrooms: number | null; parking: number | null; area: number | null;
  featured: boolean; isNew: boolean; publishedAt: string | null;
  coverUrl: string | null;
};

export type PropertyDetail = PropertyCard & {
  description: string | null; condoFee: number | null; iptu: number | null;
  suites: number | null; areaTotal: number | null; region: string | null;
  /** so se o admin liberou; senao null */
  address: string | null;
  /** exata se address liberado; senao aproximada (~1 km) */
  lat: number | null; lng: number | null;
  features: string[];
  photos: { url: string; width: number | null; height: number | null }[];
};

export type PublicFilters = {
  q?: string; city?: string; neighborhood?: string; type?: string; purpose?: PropertyPurpose;
  minPrice?: number; maxPrice?: number; minBedrooms?: number; minParking?: number; featured?: boolean;
};
export type PublicSort = "recent" | "price_asc" | "price_desc";
