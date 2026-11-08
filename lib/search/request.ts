import { z } from "zod";
import { searchFiltersSchema } from "./filters";

const short = z.string().trim().max(80);

/** Preferências para a mensagem de WhatsApp. Renda é opcional e só viaja no corpo POST. */
export const prefsSchema = z
  .object({
    region: short.optional(),
    income: short.optional(),
    budget: short.optional(),
    type: short.optional(),
    bedrooms: z.union([short, z.number().int().min(0).max(20)]).optional(),
  })
  .strict();

export const geoSchema = z
  .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
  .strict();

export const searchRequestSchema = z
  .object({ filters: searchFiltersSchema, geo: geoSchema.optional(), prefs: prefsSchema.optional() })
  .strict();

const phone = z
  .string()
  .trim()
  .regex(/^[\d\s()+-]{8,20}$/);

/** Lead do questionário. Consentimento explícito é obrigatório (LGPD). */
export const leadRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: phone.optional(),
    email: z.string().trim().email().max(160).optional(),
    source: z.enum(["property", "search", "search_no_results", "chat"]),
    consent: z.literal(true),
    // honeypot anti-spam: humanos deixam vazio
    website: z.string().max(0).optional(),
    filters: searchFiltersSchema.optional(),
    incomeRange: short.optional(),
    financing: z.enum(["financiar", "a_vista", "avaliando"]).optional(),
    notes: z.string().trim().max(500).optional(),
    propertyIds: z.array(z.string().uuid()).max(10).default([]),
  })
  .strict()
  .refine((v) => !!v.phone || !!v.email, { message: "Informe telefone ou e-mail" });

export const CONSENT_TEXT =
  "Autorizo o uso dos meus dados para que o corretor entre em contato sobre imóveis, conforme a política de privacidade.";

/** Lê JSON com teto de tamanho (padrão 8 KB). Retorna null se grande demais ou inválido. */
export async function readJsonLimited(req: Request, maxBytes = 8192): Promise<unknown | null> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return null;
  const text = await req.text().catch(() => "");
  if (text.length === 0 || new TextEncoder().encode(text).length > maxBytes) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
