// Wrapper fino sobre @/lib/whatsapp (fonte única dos textos). Só decide QUAL mensagem e injeta o número.
import { buildWhatsAppLink, brl, messageForProperty, messageForSearch, messageNoResults, type SearchPrefs } from "@/lib/whatsapp";
import type { PropertyCard, SearchFilters, SearchOutput } from "@/lib/search/types";

const FIN: Record<string, string> = { financiar: "pretende financiar", a_vista: "à vista", avaliando: "ainda avaliando" };

export function prefsFromFilters(
  f: SearchFilters,
  extra: SearchPrefs & { financing?: string } = {},
): SearchPrefs {
  const fin = extra.financing ? FIN[extra.financing] : undefined;
  const budgetBase = extra.budget ?? (f.maxPrice != null ? brl(f.maxPrice) : undefined);
  return {
    region: extra.region ?? ([f.place, f.neighborhood, f.city].filter(Boolean).join(", ") || undefined),
    income: extra.income,
    budget: fin ? `${budgetBase ?? "a definir"} (${fin})` : budgetBase,
    type: extra.type ?? f.type,
    bedrooms: extra.bedrooms ?? f.minBedrooms,
  };
}

/**
 * Link do WhatsApp para o resultado da busca (sem resultado -> mensagem "sem resultados").
 * A mensagem vai no link wa.me aberto pelo próprio visitante; NÃO é gravada nem logada pelo servidor,
 * e a renda só entra se o visitante a informou. Nunca vai para URL das páginas do site.
 */
export function whatsappForSearch(
  phone: string | null,
  out: Pick<SearchOutput, "results" | "noResults">,
  prefs: SearchPrefs,
  siteUrl: string,
  notes?: string,
): string | null {
  const text = out.noResults
    ? messageNoResults(prefs)
    : messageForSearch(
        prefs,
        out.results.slice(0, 5).map((c) => ({ code: c.code ?? c.id.slice(0, 8), url: `${siteUrl}/imoveis/${c.slug ?? c.id}` })),
      );
  // texto livre do visitante vai só no link wa.me aberto por ele; não é gravado nem logado
  return buildWhatsAppLink(phone, notes ? `${text}

Observações: ${notes}` : text);
}

/** Link "Conversar sobre este imóvel" (origem: imóvel). Só dados públicos do card. */
export function whatsappForProperty(phone: string | null, c: PropertyCard, siteUrl: string): string | null {
  return buildWhatsAppLink(
    phone,
    messageForProperty({
      code: c.code ?? c.id.slice(0, 8),
      title: c.title,
      region: [c.neighborhood, c.city].filter(Boolean).join(", ") || "região a confirmar",
      price: c.price,
      url: `${siteUrl}/imoveis/${c.slug ?? c.id}`,
    }),
  );
}
