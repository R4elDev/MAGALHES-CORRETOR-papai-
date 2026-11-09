import type { AdminProperty } from "@/types/db";
import type { ActionResult } from "./result";
import { propertyFormSchema } from "./forms";
import type { PropertyStatusValue } from "./constants";

export const propertySteps = ["Identificação", "Valores", "Local", "Comodidades", "Fotos", "Revisão"] as const;
export type PropertyValues = Record<string, string | number | boolean | null | string[] | undefined>;
export type PropertyDraft = {
  values: PropertyValues; files: File[]; step: number; savedId?: string; existing: boolean;
};
export function createPropertyDraft(p?: AdminProperty | null): PropertyDraft {
  return { existing: !!p, files: [], step: 0, savedId: p?.id, values: p ? {
    id: p.id, code: p.code, title: p.title, description: p.description, type: p.type, purpose: p.purpose,
    price: p.price, condoFee: p.condo_fee, iptu: p.iptu, areaUseful: p.area_useful, areaTotal: p.area_total,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, suites: p.suites, parking: p.parking,
    city: p.city, state: p.state, neighborhood: p.neighborhood, address: p.address, hideAddress: p.hide_address,
    latitude: p.latitude, longitude: p.longitude, status: p.status, featured: p.featured, featureIds: p.feature_ids,
  } : { code: "", title: "", type: "apartment", purpose: "sale", status: "draft", hideAddress: true, featured: false, featureIds: [], city: "", state: "", neighborhood: "" } };
}
const stepFields = [
  ["code", "title", "type", "purpose", "description"],
  ["price", "condoFee", "iptu", "areaUseful", "areaTotal", "bedrooms", "bathrooms", "suites", "parking"],
  ["city", "state", "neighborhood", "address", "latitude", "longitude"], ["featureIds"], [], ["status", "featured"],
];
export function validatePropertyStep(values: PropertyValues, step?: number) {
  const parsed = propertyFormSchema.safeParse(values);
  const errors: Record<string, string[]> = {};
  if (!parsed.success) for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (step == null || stepFields[step]?.includes(key)) (errors[key] ??= []).push(issue.message);
  }
  return errors;
}
export function stepForPropertyErrors(errors: Record<string, string[]>) {
  return Math.max(0, stepFields.findIndex((fields) => fields.some((key) => key in errors)));
}

type SaveDependencies = {
  save: (values: PropertyValues) => Promise<ActionResult<{ id: string }>>;
  upload: (propertyId: string, file: File) => Promise<ActionResult<{ added: number; rejected: string[] }>>;
  publish: (id: string, status: PropertyStatusValue) => Promise<ActionResult<unknown>>;
};
/** Checkpoint the ID before uploads and remove only acknowledged files. Retrying updates the same property. */
export async function persistPropertyDraft(draft: PropertyDraft, deps: SaveDependencies, checkpoint: (draft: PropertyDraft) => void): Promise<ActionResult<{ id: string }>> {
  const desiredStatus = (draft.values.status ?? "draft") as PropertyStatusValue;
  const saved = await deps.save({ ...draft.values, id: draft.savedId, status: draft.existing ? desiredStatus : "draft" });
  if (!saved.ok) return saved;
  let current = { ...draft, savedId: saved.data.id };
  checkpoint(current);
  for (const file of draft.files) {
    const uploaded = await deps.upload(saved.data.id, file);
    if (!uploaded.ok || uploaded.data.added !== 1 || uploaded.data.rejected.length) {
      return { ok: false, error: `O imóvel foi salvo${draft.existing ? "" : " como rascunho"}, mas há fotos pendentes. ${uploaded.ok ? uploaded.data.rejected.join(" • ") : uploaded.error} Tente novamente; o mesmo imóvel será atualizado.` };
    }
    current = { ...current, files: current.files.filter((item) => item !== file) };
    checkpoint(current);
  }
  if (!draft.existing && desiredStatus !== "draft") {
    const changed = await deps.publish(saved.data.id, desiredStatus);
    if (!changed.ok) return changed;
  }
  return { ok: true, data: { id: saved.data.id }, message: "Imóvel salvo." };
}
