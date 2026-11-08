"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeImage, reorderImages, setCoverImage, uploadImages } from "@/lib/admin/actions/images";
import { IMAGE_ACCEPTED_ADMIN, IMAGE_MAX_BYTES_ADMIN, MAX_IMAGES_PER_PROPERTY } from "@/lib/admin/constants";
import { Button, Card } from "./ui";
import { Feedback, useAction } from "./use-action";

export type ImageItem = { id: string; url: string; is_cover: boolean };

export function ImageManager({ propertyId, images }: { propertyId: string; images: ImageItem[] }) {
  const router = useRouter();
  const { pending, message, run } = useAction();
  const [local, setLocal] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const input = useRef<HTMLInputElement>(null);

  function pick(list: FileList | null) {
    const arr = Array.from(list ?? []);
    const bad: string[] = [];
    const good = arr.filter((f) => {
      if (!(IMAGE_ACCEPTED_ADMIN as readonly string[]).includes(f.type)) { bad.push(`${f.name}: use JPG, PNG ou WebP`); return false; }
      if (f.size > IMAGE_MAX_BYTES_ADMIN) { bad.push(`${f.name}: máx. ${IMAGE_MAX_BYTES_ADMIN / 1048576} MB`); return false; }
      return true;
    });
    if (images.length + good.length > MAX_IMAGES_PER_PROPERTY) { setLocal(`Limite de ${MAX_IMAGES_PER_PROPERTY} fotos.`); return; }
    setLocal(bad.length ? bad.join(" • ") : null);
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles(good);
    setPreviews(good.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })));
  }
  function send() {
    const fd = new FormData();
    fd.set("propertyId", propertyId);
    files.forEach((f) => fd.append("files", f));
    run(() => uploadImages(fd), () => { setFiles([]); setPreviews([]); if (input.current) input.current.value = ""; router.refresh(); });
  }
  function move(i: number, dir: -1 | 1) {
    const ids = images.map((x) => x.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => reorderImages({ propertyId, orderedIds: ids }), () => router.refresh());
  }

  return (
    <Card title={`Fotos (${images.length}/${MAX_IMAGES_PER_PROPERTY})`}>
      <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
        <input ref={input} id="fotos" type="file" multiple accept={IMAGE_ACCEPTED_ADMIN.join(",")} className="sr-only" onChange={(e) => pick(e.target.files)} />
        <label htmlFor="fotos" className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-[#092A5E] px-4 text-sm font-semibold text-white">Escolher fotos</label>
        <p className="mt-2 text-xs text-slate-500">JPG, PNG ou WebP · até 10 MB cada · otimizadas automaticamente para o site</p>
      </div>
      {local && <p role="alert" className="mt-2 text-sm text-red-600">{local}</p>}
      {previews.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium">Prévia ({previews.length} para enviar)</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {previews.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.url} src={p.url} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
          <Button className="mt-3" disabled={pending} onClick={send}>{pending ? "Enviando…" : "Enviar fotos"}</Button>
        </div>
      )}
      <div className="mt-3"><Feedback message={message} /></div>
      {images.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nenhuma foto ainda. A primeira enviada vira a capa.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img.url
                  ? <img src={img.url} alt={`Foto ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  : <span className="grid aspect-[4/3] place-items-center bg-slate-100 text-xs text-slate-500">Prévia indisponível</span>}
                {img.is_cover && <span className="absolute left-2 top-2 rounded-full bg-[#FF7500] px-2 py-0.5 text-xs font-bold text-white">Capa</span>}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                <Button variant="outline" className="min-h-9 px-2" disabled={pending || i === 0} aria-label="Mover para antes" onClick={() => move(i, -1)}>←</Button>
                <Button variant="outline" className="min-h-9 px-2" disabled={pending || i === images.length - 1} aria-label="Mover para depois" onClick={() => move(i, 1)}>→</Button>
                {!img.is_cover && <Button variant="ghost" className="min-h-9 px-2" disabled={pending} onClick={() => run(() => setCoverImage({ propertyId, imageId: img.id }), () => router.refresh())}>Capa</Button>}
                <Button variant="danger" className="min-h-9 px-2" disabled={pending}
                  onClick={() => { if (window.confirm("Excluir esta foto?")) run(() => removeImage({ propertyId, imageId: img.id }), () => router.refresh()); }}>Excluir</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
