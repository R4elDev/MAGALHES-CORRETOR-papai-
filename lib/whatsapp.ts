// Fonte única de links/mensagens de WhatsApp (puro, sem I/O). O número vem de site_settings; nunca fixo no código.

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d; // número BR sem DDI
  return d.length >= 12 && d.length <= 15 ? d : null;
}

/** Link oficial wa.me com texto codificado. Retorna null se não houver número válido configurado. */
export function buildWhatsAppLink(phone: string | null | undefined, text?: string): string | null {
  const n = normalizePhone(phone);
  if (!n) return null;
  return text ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : `https://wa.me/${n}`;
}

const val = (v: unknown, fallback = "não informado") =>
  v === null || v === undefined || v === "" ? fallback : String(v);

export const brl = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "sob consulta";

export type PropertyMsgInput = { code: string; title: string; region: string; price: number | null; url: string };
export type SearchPrefs = { region?: string; income?: string; budget?: string; type?: string; bedrooms?: number | string };
export type ChatSummary = { prefs?: SearchPrefs; properties?: { code: string; url: string }[] };

export function messageForProperty(p: PropertyMsgInput): string {
  return `Olá, Magalhães! Vi no seu site o imóvel ${p.code} — ${p.title}, localizado em ${p.region}, anunciado por ${brl(p.price)}. Tenho interesse e gostaria de conversar sobre ele. Link: ${p.url}.`;
}

export function messageForSearch(prefs: SearchPrefs, props: { code: string; url: string }[] = []): string {
  const list = props.length ? props.map((p) => `${p.code} ${p.url}`).join("\n") : "nenhum ainda";
  return [
    "Olá, Magalhães! Fiz uma busca no seu site e gostaria de ajuda para encontrar um imóvel.",
    "",
    `Região: ${val(prefs.region)}`,
    `Renda aproximada: ${val(prefs.income)}`,
    `Investimento pretendido: ${val(prefs.budget)}`,
    `Tipo de imóvel: ${val(prefs.type)}`,
    `Quartos: ${val(prefs.bedrooms)}`,
    "",
    `Imóveis que me interessaram: ${list}`,
    "",
    "Podemos conversar?",
  ].join("\n");
}

export function messageNoResults(prefs: SearchPrefs): string {
  return [
    "Olá, Magalhães! Fiz uma busca no seu site, mas não encontrei um imóvel que atendesse exatamente ao que procuro.",
    "",
    "Minhas preferências são:",
    "",
    `Região: ${val(prefs.region)}`,
    `Orçamento: ${val(prefs.budget)}`,
    `Tipo: ${val(prefs.type)}`,
    `Quartos: ${val(prefs.bedrooms)}`,
    "",
    "Gostaria de conversar para avaliar outras possibilidades.",
  ].join("\n");
}

/** Resumo curto do chat (sem histórico completo e sem renda). */
export function messageFromChat(s: ChatSummary): string {
  const p = s.prefs ?? {};
  const parts = [`Região: ${val(p.region)}`, `Tipo: ${val(p.type)}`, `Orçamento: ${val(p.budget)}`, `Quartos: ${val(p.bedrooms)}`];
  const props = s.properties?.length ? `\nImóveis citados: ${s.properties.map((x) => `${x.code} ${x.url}`).join(", ")}` : "";
  return `Olá, Magalhães! Estava conversando com o assistente do seu site e gostaria de falar com você.\n${parts.join(" | ")}${props}`;
}

/** Ação rápida do CRM (admin -> lead). */
export function messageForLeadFollowUp(lead: { name?: string | null; propertyTitle?: string | null }): string {
  const hi = lead.name ? `Olá, ${lead.name.split(" ")[0]}!` : "Olá!";
  const about = lead.propertyTitle ? ` Sobre o imóvel "${lead.propertyTitle}":` : "";
  return `${hi} Aqui é o Magalhães Corretor.${about} Posso te ajudar com mais informações?`;
}
