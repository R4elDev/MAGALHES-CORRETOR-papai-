import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prefsFromFilters, whatsappForProperty, whatsappForSearch } from "@/lib/recommendations/whatsapp";
import { rateLimit } from "@/lib/search/rate-limit";
import { readJsonLimited, searchRequestSchema } from "@/lib/search/request";
import { getWhatsAppNumber, structuredSource } from "@/lib/search/source";
import { searchStructured } from "@/lib/search/structured";

export const runtime = "nodejs";

// Renda/geo só no corpo POST. Nada é logado (sem console.* do corpo) nem vai para URL.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`search:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Muitas buscas seguidas. Tente novamente em instantes." }, { status: 429 });
  }

  const parsed = searchRequestSchema.safeParse(await readJsonLimited(req));
  if (!parsed.success) return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  const { filters, geo, prefs } = parsed.data;

  try {
    const out = await searchStructured({ filters, geo }, structuredSource);
    const phone = await getWhatsAppNumber().catch(() => null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const whatsappUrl = whatsappForSearch(phone, out, prefsFromFilters(filters, prefs), siteUrl);
    const propertyLinks: Record<string, string> = {};
    for (const c of [...out.results, ...out.alternatives.map((a) => a.card)]) {
      const l = whatsappForProperty(phone, c, siteUrl);
      if (l) propertyLinks[c.id] = l;
    }
    return NextResponse.json({
      propertyLinks,
      mode: out.mode,
      results: out.results,
      alternatives: out.alternatives,
      noResults: out.noResults,
      whatsappFallback: { url: whatsappUrl }, // null => número ainda não configurado no admin
    });
  } catch {
    // Falha honesta: a UI mostra o atalho WhatsApp, sem inventar resultado.
    return NextResponse.json({ error: "Não foi possível buscar agora." }, { status: 503 });
  }
}
