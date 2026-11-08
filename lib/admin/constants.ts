// Constantes puras do admin (sem "use server"), seguras para client e server.
export const PROPERTY_STATUSES = ["draft", "published", "reserved", "sold", "rented", "archived"] as const;
export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number];

export const PROPERTY_STATUS_LABEL: Record<PropertyStatusValue, string> = {
  draft: "Rascunho",
  published: "Publicado",
  reserved: "Reservado",
  sold: "Vendido",
  rented: "Alugado",
  archived: "Arquivado",
};

/** Estados em que o imóvel pode ser recomendado pela IA / aparecer no site. */
export const PUBLIC_STATUSES: PropertyStatusValue[] = ["published"];

export const PROPERTY_TYPES = ["house", "apartment", "land", "commercial", "other"] as const;
export const PROPERTY_TYPE_LABEL: Record<(typeof PROPERTY_TYPES)[number], string> = {
  house: "Casa",
  apartment: "Apartamento",
  land: "Terreno",
  commercial: "Comercial",
  other: "Outro",
};

export const PROPERTY_PURPOSES = ["sale", "rent"] as const;
export const PROPERTY_PURPOSE_LABEL = { sale: "Venda", rent: "Aluguel" } as const;

export const LEAD_STATUSES = ["new", "first_contact", "negotiating", "visit_scheduled", "done", "lost"] as const;
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABEL: Record<LeadStatusValue, string> = {
  new: "Novo interesse",
  first_contact: "Primeiro contato",
  negotiating: "Em negociação",
  visit_scheduled: "Visita agendada",
  done: "Concluído",
  lost: "Perdido / encerrado",
};

export const CONTACT_KINDS = ["click", "confirmed", "manual"] as const;
export const CONTACT_KIND_LABEL = {
  click: "Clique no WhatsApp (não confirmado)",
  confirmed: "Contato confirmado",
  manual: "Inserido por você",
} as const;

export const VISIT_STATUSES = ["scheduled", "done", "cancelled", "no_show"] as const;
export const VISIT_STATUS_LABEL = {
  scheduled: "Agendada",
  done: "Realizada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
} as const;

export const IMAGE_MAX_BYTES_ADMIN = 10 * 1024 * 1024; // validação local; Farol pode sobrescrever via @/lib/images
export const IMAGE_ACCEPTED_ADMIN = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGES_PER_PROPERTY = 30;
