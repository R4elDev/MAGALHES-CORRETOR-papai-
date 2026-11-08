import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { must, slugify } from "@/lib/db/errors";
import type { Feature } from "@/types/db";

export async function list(): Promise<Feature[]> {
  const supabase = await createSessionClient();
  return must(await supabase.from("features").select("id, slug, name").order("name"), "listar comodidades") as Feature[];
}

export async function create(name: string): Promise<Feature> {
  const supabase = await createSessionClient();
  const res = await supabase.from("features").insert({ name: name.trim(), slug: slugify(name) }).select("id, slug, name").single();
  return must(res, "criar comodidade") as Feature;
}

/** Define o conjunto de comodidades do imovel (substitui o anterior). */
export async function attach(propertyId: string, featureIds: string[]): Promise<void> {
  const supabase = await createSessionClient();
  const current = must(
    await supabase.from("property_features").select("feature_id").eq("property_id", propertyId),
    "ler comodidades",
  ) as { feature_id: string }[];
  const have = new Set(current.map((c) => c.feature_id));
  const want = new Set(featureIds);
  const toRemove = [...have].filter((id) => !want.has(id));
  const toAdd = [...want].filter((id) => !have.has(id));
  if (toRemove.length) must(await supabase.from("property_features").delete().eq("property_id", propertyId).in("feature_id", toRemove), "remover comodidades");
  if (toAdd.length) must(await supabase.from("property_features").insert(toAdd.map((feature_id) => ({ property_id: propertyId, feature_id }))), "salvar comodidades");
}
