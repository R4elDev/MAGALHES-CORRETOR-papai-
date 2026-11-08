import { buildWhatsAppLink, messageForProperty } from "@/lib/whatsapp";
import type { PropertyCard, SiteSettings } from "@/types/db";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

export const propertyUrl = (slug: string) => `${SITE_URL}/imoveis/${slug}`;

export function formatPrice(value: number | null | undefined, purpose?: string): string {
  if (typeof value !== "number") return "Sob consulta";
  const s = value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return purpose === "rent" ? `${s}/mês` : s;
}

const TYPES: Record<string, string> = {
  house: "Casa",
  apartment: "Apartamento",
  land: "Terreno",
  commercial: "Comercial",
  studio: "Studio",
  farm: "Chácara",
};
export const typeLabel = (t: string | null | undefined) => (t ? (TYPES[t] ?? t.charAt(0).toUpperCase() + t.slice(1)) : "Imóvel");
export const purposeLabel = (p: string | null | undefined) => (p === "rent" ? "Aluguel" : p === "sale" ? "Venda" : "");

export function placeLabel(c: Pick<PropertyCard, "neighborhood" | "city" | "state">): string {
  return [c.neighborhood, c.city, c.state].filter(Boolean).join(", ") || "Localização a confirmar";
}

export const phoneOf = (s: SiteSettings | null) => s?.whatsapp_number ?? s?.whatsapp ?? null;

/** Link "Tenho interesse": WhatsApp se houver número configurado; senão cai para /contato (nunca link vazio). */
export function interestHref(card: PropertyCard, settings: SiteSettings | null): { href: string; external: boolean } {
  const link = buildWhatsAppLink(
    phoneOf(settings),
    messageForProperty({
      code: card.code ?? card.slug,
      title: card.title,
      region: placeLabel(card),
      price: card.price,
      url: propertyUrl(card.slug),
    }),
  );
  return link ? { href: link, external: true } : { href: "/#contato", external: false };
}
