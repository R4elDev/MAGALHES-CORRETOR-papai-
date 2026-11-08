import "server-only";
import sharp from "sharp";

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 2000;
export const IMAGE_ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAcceptedImage(mime: string, size: number): boolean {
  return (IMAGE_ACCEPTED_MIME as readonly string[]).includes(mime) && size > 0 && size <= IMAGE_MAX_BYTES;
}

/** Redimensiona (máx. 2000px), corrige rotação EXIF, remove metadados e converte para WebP. */
export async function optimizeImage(input: Buffer) {
  const { data, info } = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({ width: IMAGE_MAX_DIMENSION, height: IMAGE_MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, mime: "image/webp" as const };
}
