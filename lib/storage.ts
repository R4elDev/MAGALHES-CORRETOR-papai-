import "server-only";
import { randomUUID } from "node:crypto";
import { createSessionClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { must } from "@/lib/db/errors";

const PHOTOS = "property-images"; // PRIVADO: so URL assinada
const ASSETS = "site-assets"; // publico (logo/avatar)
export const PHOTO_URL_TTL_SECONDS = 60 * 60 * 6;

type UploadMeta = { mime?: string; width?: number; height?: number; name?: string };

/** Admin. Caminho: <propertyId>/<uuid>.webp. `url` e assinada (expira) — nao persistir. */
export async function uploadPropertyImage(
  propertyId: string,
  file: Buffer | File,
  meta: UploadMeta = {},
): Promise<{ path: string; url: string; width: number | null; height: number | null }> {
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) throw new Error("propertyId invalido");
  const supabase = await createSessionClient();
  const mime = meta.mime ?? (file instanceof File ? file.type : "image/webp");
  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  const path = `${propertyId}/${randomUUID()}.${ext}`;
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const up = await supabase.storage.from(PHOTOS).upload(path, body, { contentType: mime, upsert: false });
  if (up.error) {
    console.error("[storage] upload:", up.error.message);
    throw new Error("Falha no upload da imagem");
  }
  const signed = await supabase.storage.from(PHOTOS).createSignedUrl(path, PHOTO_URL_TTL_SECONDS);
  return { path, url: signed.data?.signedUrl ?? "", width: meta.width ?? null, height: meta.height ?? null };
}

export async function deletePropertyImage(path: string): Promise<void> {
  const supabase = await createSessionClient();
  const res = await supabase.storage.from(PHOTOS).remove([path]);
  must({ data: res.data, error: res.error }, "remover imagem");
}

/** Admin. Logo/avatar vao para bucket publico; `url` e publica e estavel. */
export async function uploadSiteAsset(
  kind: "logo" | "avatar",
  file: Buffer | File,
  meta: UploadMeta = {},
): Promise<{ path: string; url: string }> {
  const supabase = await createSessionClient();
  const mime = meta.mime ?? (file instanceof File ? file.type : "image/webp");
  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : mime === "image/svg+xml" ? "svg" : "webp";
  const path = `${kind}-${randomUUID()}.${ext}`; // nome novo evita cache antigo
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const up = await supabase.storage.from(ASSETS).upload(path, body, { contentType: mime, upsert: false });
  if (up.error) {
    console.error("[storage] asset:", up.error.message);
    throw new Error("Falha no upload da imagem");
  }
  return { path, url: supabase.storage.from(ASSETS).getPublicUrl(path).data.publicUrl };
}

/**
 * Publico/servidor: assina URLs de fotos. Usa o anon: a policy de storage so permite assinar
 * fotos de imoveis published. Caminhos de rascunho voltam sem URL (null).
 */
export async function signPhotoUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return out;
  const res = await createAnonClient().storage.from(PHOTOS).createSignedUrls(unique, PHOTO_URL_TTL_SECONDS);
  for (const r of res.data ?? []) if (r.path && r.signedUrl && !r.error) out.set(r.path, r.signedUrl);
  return out;
}

/** Admin: assina fotos (inclui rascunhos) com a sessao do admin. */
export async function signPhotoUrlsAdmin(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return out;
  const supabase = await createSessionClient();
  const res = await supabase.storage.from(PHOTOS).createSignedUrls(unique, PHOTO_URL_TTL_SECONDS);
  for (const r of res.data ?? []) if (r.path && r.signedUrl && !r.error) out.set(r.path, r.signedUrl);
  return out;
}
