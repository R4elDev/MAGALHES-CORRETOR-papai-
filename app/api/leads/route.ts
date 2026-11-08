import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { rateLimit } from "@/lib/search/rate-limit";
import { CONSENT_TEXT, leadRequestSchema, readJsonLimited } from "@/lib/search/request";
import { db } from "@/lib/search/source";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!rateLimit(`lead:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }
  const parsed = leadRequestSchema.safeParse(await readJsonLimited(req));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const v = parsed.data;
  if (v.website) return NextResponse.json({ ok: true }); // honeypot: finge sucesso, não grava

  const f = v.filters ?? {};
  let failed = false;
  try {
    const { error } = await db().rpc("create_lead", {
    p_name: v.name,
    p_phone: v.phone ?? null,
    p_email: v.email ?? null,
    p_source: v.source,
    p_consent_text: CONSENT_TEXT,
    p_preferences: {
      purpose: f.purpose,
      city: f.city,
      neighborhood: f.neighborhood,
      type: f.type,
      max_price: f.maxPrice,
      min_bedrooms: f.minBedrooms,
      income_range: v.incomeRange, // sensível: só service/admin; nunca em URL/log
      financing: v.financing,
      notes: v.notes,
    },
    p_property_ids: v.propertyIds,
    });
    failed = !!error;
  } catch {
    failed = true; // env ausente / conexão: nada é logado (sem PII)
  }
  if (failed) return NextResponse.json({ error: "Não foi possível registrar agora. Tente falar direto pelo WhatsApp." }, { status: 503 });
  // Resposta mínima: não devolve id nem eco dos dados pessoais.
  return NextResponse.json({ ok: true });
}
