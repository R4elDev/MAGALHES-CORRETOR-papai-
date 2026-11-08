import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { must } from "@/lib/db/errors";
import { signPhotoUrlsAdmin } from "@/lib/storage";
import type { PropertyImage } from "@/types/db";

export async function list(propertyId: string): Promise<PropertyImage[]> {
  const supabase = await createSessionClient();
  const rows = must(
    await supabase.from("property_images").select("id, property_id, path, width, height, position, is_cover")
      .eq("property_id", propertyId).order("position").order("created_at"),
    "listar fotos",
  ) as Omit<PropertyImage, "url">[];
  const urls = await signPhotoUrlsAdmin(rows.map((r) => r.path));
  return rows.map((r) => ({ ...r, url: urls.get(r.path) ?? null }));
}

/** `url` do upload e ignorada: o bucket e privado e a URL assinada e gerada a cada leitura. */
export async function add(
  propertyId: string,
  img: { path: string; url?: string; width: number | null; height: number | null; is_cover?: boolean },
): Promise<{ id: string }> {
  const supabase = await createSessionClient();
  const last = must(
    await supabase.from("property_images").select("position").eq("property_id", propertyId).order("position", { ascending: false }).limit(1),
    "posicao da foto",
  ) as { position: number }[];
  const res = await supabase.from("property_images")
    .insert({ property_id: propertyId, path: img.path, width: img.width, height: img.height, position: (last[0]?.position ?? -1) + 1, is_cover: false })
    .select("id").single();
  const created = must(res, "registrar foto") as { id: string };
  if (img.is_cover) await setCover(propertyId, created.id);
  return created;
}

/** Remove a linha. O arquivo e apagado por deletePropertyImage(path). Se era a capa, promove a proxima. */
export async function remove(propertyId: string, imageId: string): Promise<void> {
  const supabase = await createSessionClient();
  const cur = must(
    await supabase.from("property_images").select("is_cover").eq("id", imageId).eq("property_id", propertyId).maybeSingle(),
    "buscar foto",
  ) as { is_cover: boolean } | null;
  must(await supabase.from("property_images").delete().eq("id", imageId).eq("property_id", propertyId), "excluir foto");
  if (cur?.is_cover) {
    const next = must(
      await supabase.from("property_images").select("id").eq("property_id", propertyId).order("position").limit(1),
      "proxima capa",
    ) as { id: string }[];
    if (next[0]) await setCover(propertyId, next[0].id);
  }
}

export async function setCover(propertyId: string, imageId: string): Promise<void> {
  const supabase = await createSessionClient();
  // indice unico parcial: solta a capa atual antes de definir a nova
  must(await supabase.from("property_images").update({ is_cover: false }).eq("property_id", propertyId).eq("is_cover", true), "soltar capa");
  must(await supabase.from("property_images").update({ is_cover: true }).eq("id", imageId).eq("property_id", propertyId), "definir capa");
}

export async function reorder(propertyId: string, orderedIds: string[]): Promise<void> {
  const supabase = await createSessionClient();
  for (let i = 0; i < orderedIds.length; i++) {
    must(await supabase.from("property_images").update({ position: i }).eq("id", orderedIds[i]).eq("property_id", propertyId), "reordenar fotos");
  }
}
