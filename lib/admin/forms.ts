import { z } from "zod";
import { parseMoney } from "./format";
import {
  LEAD_STATUSES, PROPERTY_PURPOSES, PROPERTY_STATUSES, PROPERTY_TYPES, VISIT_STATUSES, CONTACT_KINDS,
} from "./constants";

const money = (label: string, required = false) =>
  z.preprocess(
    (v) => parseMoney(v),
    required
      ? z.number({ message: `${label} é obrigatório` }).positive(`${label} deve ser maior que zero`).max(1e10)
      : z.number().min(0, `${label} inválido`).max(1e10).nullable(),
  );
const int = (label: string, max = 99) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number({ message: `${label} inválido` }).int(`${label} inválido`).min(0).max(max).nullable(),
  );
const dec = (label: string, min = 0, max = 1e7) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(String(v).replace(",", "."))),
    z.number({ message: `${label} inválido` }).min(min).max(max).nullable(),
  );
const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => z.preprocess((v) => (v === "" ? null : v), text(max).nullable().optional());

export const propertyFormSchema = z.object({
  id: z.string().uuid().optional(),
  code: text(40).min(1, "Informe o código interno"),
  title: text(140).min(3, "Título muito curto"),
  description: optText(8000),
  type: z.enum(PROPERTY_TYPES, { message: "Escolha o tipo" }),
  purpose: z.enum(PROPERTY_PURPOSES, { message: "Escolha a finalidade" }),
  price: money("Preço", true),
  condoFee: money("Condomínio"),
  iptu: money("IPTU"),
  areaUseful: dec("Área útil"),
  areaTotal: dec("Área total"),
  bedrooms: int("Quartos"),
  bathrooms: int("Banheiros"),
  suites: int("Suítes"),
  parking: int("Vagas"),
  city: text(80).min(2, "Informe a cidade"),
  state: text(2).length(2, "UF com 2 letras").transform((s) => s.toUpperCase()),
  neighborhood: text(80).min(2, "Informe o bairro"),
  address: optText(200),
  hideAddress: z.boolean().default(true),
  latitude: dec("Latitude", -90, 90),
  longitude: dec("Longitude", -180, 180),
  featureIds: z.array(z.string().uuid()).max(60).default([]),
  status: z.enum(PROPERTY_STATUSES).default("draft"),
  featured: z.boolean().default(false),
}).refine((v) => (v.latitude == null) === (v.longitude == null), {
  message: "Informe latitude e longitude juntas", path: ["latitude"],
});
export type PropertyFormInput = z.input<typeof propertyFormSchema>;
export type PropertyFormData = z.output<typeof propertyFormSchema>;

export const idSchema = z.object({ id: z.string().uuid() });
export const statusChangeSchema = z.object({ id: z.string().uuid(), status: z.enum(PROPERTY_STATUSES) });
export const featuredSchema = z.object({ id: z.string().uuid(), featured: z.boolean() });

export const imageIdSchema = z.object({ propertyId: z.string().uuid(), imageId: z.string().uuid() });
export const imageReorderSchema = z.object({ propertyId: z.string().uuid(), orderedIds: z.array(z.string().uuid()).min(1).max(60) });

export const leadStatusSchema = z.object({
  id: z.string().uuid(), status: z.enum(LEAD_STATUSES),
  nextContactAt: z.preprocess((v) => (v ? v : null), z.string().datetime({ offset: true }).nullable().optional()),
});
export const leadNoteSchema = z.object({ leadId: z.string().uuid(), note: text(2000).min(1, "Escreva a observação") });
export const leadCreateSchema = z.object({
  name: optText(120), phone: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^\+?\d{10,15}$/, "Telefone inválido").nullable().optional()),
  region: optText(120), budget: money("Orçamento"), income: optText(60), preferences: optText(1000),
  propertyId: z.string().uuid().optional().nullable(), kind: z.enum(CONTACT_KINDS).default("manual"),
});
export const leadConfirmSchema = z.object({ leadId: z.string().uuid() });

export const visitSchema = z.object({
  id: z.string().uuid().optional(),
  propertyId: z.string().uuid({ message: "Escolha o imóvel" }),
  leadId: z.string().uuid().optional().nullable(),
  visitorName: optText(120),
  scheduledAt: z.string().min(1, "Informe data e hora").refine((s) => !Number.isNaN(Date.parse(s)), "Data inválida"),
  notes: optText(1000),
  status: z.enum(VISIT_STATUSES).default("scheduled"),
});

const url = z.preprocess((v) => (v === "" ? null : v), z.string().url("URL inválida").max(300).nullable().optional());
export const settingsSchema = z.object({
  businessName: text(120).min(2, "Informe o nome comercial"),
  whatsapp: z.string().transform((s) => s.replace(/\D/g, "")).pipe(z.string().regex(/^\d{12,13}$/, "Use DDI+DDD+número, ex.: 5511999999999")),
  email: z.preprocess((v) => (v === "" ? null : v), z.string().email("E-mail inválido").nullable().optional()),
  creci: optText(30),
  bio: optText(2000),
  instagram: url, facebook: url, youtube: url, tiktok: url,
  defaultMessage: optText(500),
  heroTitle: optText(200), heroSubtitle: optText(400),
  featuredLimit: int("Destaques", 12),
});
