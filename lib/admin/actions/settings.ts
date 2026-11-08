"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import * as siteSettings from "@/lib/dal/siteSettings";
import { uploadSiteAsset } from "@/lib/storage";
import { optimizeImage } from "@/lib/images";
import { adminAction } from "../guard";
import { ok, fail, type ActionResult } from "../result";
import { settingsSchema } from "../forms";
import { IMAGE_ACCEPTED_ADMIN, IMAGE_MAX_BYTES_ADMIN } from "../constants";

// Nenhum campo de chave/URL de IA existe aqui: ficam só no ambiente do servidor.
export const saveSettings = adminAction(settingsSchema, async (d) => {
  await siteSettings.update({
    business_name: d.businessName, whatsapp: d.whatsapp, email: d.email ?? null,
    creci: d.creci ?? null, bio: d.bio ?? null,
    instagram: d.instagram ?? null, facebook: d.facebook ?? null, youtube: d.youtube ?? null, tiktok: d.tiktok ?? null,
    default_message: d.defaultMessage ?? null, hero_title: d.heroTitle ?? null, hero_subtitle: d.heroSubtitle ?? null,
    featured_limit: d.featuredLimit ?? undefined,
  });
  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  return ok(undefined, "Configurações salvas.");
});

export async function uploadBrandAsset(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
    const kind = formData.get("kind");
    const file = formData.get("file");
    if (kind !== "logo" && kind !== "avatar") return fail("Tipo de imagem inválido.");
    if (!(file instanceof File) || !file.size) return fail("Selecione uma imagem.");
    if (!(IMAGE_ACCEPTED_ADMIN as readonly string[]).includes(file.type)) return fail("Use JPG, PNG ou WebP.");
    if (file.size > IMAGE_MAX_BYTES_ADMIN) return fail("Imagem maior que 10 MB.");
    const opt = await optimizeImage(Buffer.from(await file.arrayBuffer()));
    const up = await uploadSiteAsset(kind, opt.buffer);
    await siteSettings.update(kind === "logo" ? { logo_url: up.url } : { avatar_url: up.url });
    revalidatePath("/admin/configuracoes");
    revalidatePath("/");
    return ok({ url: up.url }, "Imagem atualizada.");
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    return fail("Não foi possível enviar a imagem.");
  }
}
