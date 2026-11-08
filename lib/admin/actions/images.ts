"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import * as propertyImages from "@/lib/dal/propertyImages";
import { uploadPropertyImage, deletePropertyImage } from "@/lib/storage";
import { optimizeImage } from "@/lib/images";
import { adminAction } from "../guard";
import { ok, fail, type ActionResult } from "../result";
import { imageIdSchema, imageReorderSchema } from "../forms";
import { IMAGE_ACCEPTED_ADMIN, IMAGE_MAX_BYTES_ADMIN, MAX_IMAGES_PER_PROPERTY } from "../constants";

const refresh = (propertyId: string) => {
  revalidatePath(`/admin/imoveis/${propertyId}`);
  revalidatePath("/imoveis");
};

/** FormData: propertyId + files[]. Valida tipo/tamanho no servidor, otimiza (Farol) e envia ao Storage (Lastro). */
export async function uploadImages(formData: FormData): Promise<ActionResult<{ added: number; rejected: string[] }>> {
  try {
    await requireAdmin();
    const propertyId = String(formData.get("propertyId") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return fail("Imóvel inválido.");
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return fail("Selecione ao menos uma foto.");
    const current = await propertyImages.list(propertyId);
    if (current.length + files.length > MAX_IMAGES_PER_PROPERTY)
      return fail(`Limite de ${MAX_IMAGES_PER_PROPERTY} fotos por imóvel.`);
    let added = 0;
    const rejected: string[] = [];
    for (const file of files) {
      if (!(IMAGE_ACCEPTED_ADMIN as readonly string[]).includes(file.type)) {
        rejected.push(`${file.name}: formato não aceito (use JPG, PNG ou WebP)`);
        continue;
      }
      if (file.size > IMAGE_MAX_BYTES_ADMIN) {
        rejected.push(`${file.name}: maior que ${IMAGE_MAX_BYTES_ADMIN / 1048576} MB`);
        continue;
      }
      try {
        const opt = await optimizeImage(Buffer.from(await file.arrayBuffer()));
        const up = await uploadPropertyImage(propertyId, opt.buffer, {
          mime: opt.mime, width: opt.width, height: opt.height, name: file.name,
        });
        await propertyImages.add(propertyId, {
          path: up.path, width: up.width, height: up.height,
          is_cover: current.length + added === 0,
        });
        added++;
      } catch (e) {
        console.error("[admin-upload]", e instanceof Error ? e.message : "erro");
        rejected.push(`${file.name}: falha no envio, tente novamente`);
      }
    }
    refresh(propertyId);
    if (!added) return fail(rejected.join(" • ") || "Nenhuma foto enviada.");
    return ok(
      { added, rejected },
      rejected.length ? `${added} enviada(s); ${rejected.length} recusada(s).` : `${added} foto(s) enviada(s).`,
    );
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    return fail("Não foi possível enviar as fotos. Tente novamente.");
  }
}

export const setCoverImage = adminAction(imageIdSchema, async ({ propertyId, imageId }) => {
  await propertyImages.setCover(propertyId, imageId);
  refresh(propertyId);
  return ok(undefined, "Capa atualizada.");
});

export const reorderImages = adminAction(imageReorderSchema, async ({ propertyId, orderedIds }) => {
  await propertyImages.reorder(propertyId, orderedIds);
  refresh(propertyId);
  return ok();
});

export const removeImage = adminAction(imageIdSchema, async ({ propertyId, imageId }) => {
  const img = (await propertyImages.list(propertyId)).find((i) => i.id === imageId);
  if (!img) return fail("Foto não encontrada.");
  await propertyImages.remove(propertyId, imageId);
  await deletePropertyImage(img.path);
  refresh(propertyId);
  return ok(undefined, "Foto excluída.");
});
