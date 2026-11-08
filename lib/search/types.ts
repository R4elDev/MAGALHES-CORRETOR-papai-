// Contrato público de busca (dono: Nexo). PrismaImob/Farol importam daqui, sem duplicar.

export type SearchFilters = {
  city?: string;
  neighborhood?: string;
  type?: string; // valor do enum de tipo do Lastro (ex.: apartment, house)
  purpose?: "sale" | "rent";
  minPrice?: number; // BRL
  maxPrice?: number; // BRL
  minBedrooms?: number;
  minBathrooms?: number;
  minParking?: number;
};

export type FilterKey = keyof SearchFilters | "availability";

/** Card público: nunca contém endereço exato nem dados de CRM. */
export type PropertyCard = {
  id: string;
  code: string | null;
  slug: string | null;
  title: string;
  description: string | null;
  status: string; // só "published" é disponível
  price: number | null; // BRL; null = desconhecido (nunca inventar)
  city: string | null;
  neighborhood: string | null;
  type: string | null;
  purpose: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  areaM2: number | null;
  features: string[];
  coverUrl: string | null;
  photos: string[];
  /** Coordenada pública (arredondada ~1 km quando o endereço é oculto). */
  lat: number | null;
  lng: number | null;
  /** Só presente se o visitante concedeu geolocalização nesta busca. */
  distanceKm: number | null;
};

export type Geo = { lat: number; lng: number };

export type AlternativeCard = { card: PropertyCard; unmetCriteria: FilterKey[] };

export type SearchMode = "hybrid" | "structured";

export type SearchOutput = {
  mode: SearchMode; // "structured" = sem embeddings (não configurados/falhou); honesto na UI
  results: PropertyCard[]; // SEMPRE cumprem todos os filtros duros
  alternatives: AlternativeCard[]; // só com aviso explícito dos critérios não atendidos
  noResults: boolean;
};

export type SearchInput = { filters: SearchFilters; query?: string; geo?: Geo };
