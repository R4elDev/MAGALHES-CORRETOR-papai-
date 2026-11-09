"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeImage, reorderImages, setCoverImage, uploadImages } from "@/lib/admin/actions/images";
import { IMAGE_ACCEPTED_ADMIN, IMAGE_MAX_BYTES_ADMIN, MAX_IMAGES_PER_PROPERTY } from "@/lib/admin/constants";
import { fail, ok } from "@/lib/admin/result";
import { AdminDialog } from "./admin-dialog";
import { Button, Card } from "./ui";
import { Feedback, useAction } from "./use-action";

export type ImageItem = { id: string; url: string; is_cover: boolean };
type Preview = { file: File; url: string };

export function ImageManager({ propertyId, images, onChanged, allowUpload = true }: { propertyId: string; images: ImageItem[]; onChanged?: () => void; allowUpload?: boolean }) {
  const router = useRouter();
  const { pending, message, run } = useAction();
  const [local, setLocal] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const previewRef = useRef(previews); previewRef.current = previews;
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const done = () => onChanged ? onChanged() : router.refresh();
  useEffect(() => () => { previewRef.current.forEach((preview) => URL.revokeObjectURL(preview.url)); }, []);
  function pick(list: FileList | null) {
    const files = Array.from(list ?? []);
    const invalid = files.filter((file) => !(IMAGE_ACCEPTED_ADMIN as readonly string[]).includes(file.type) || !file.size || file.size > IMAGE_MAX_BYTES_ADMIN);
    if (invalid.length) { setLocal(`Confira formato e tamanho de: ${invalid.map((file) => file.name).join(", ")}. Use JPG, PNG ou WebP até 10 MB.`); return; }
    if (images.length + files.length > MAX_IMAGES_PER_PROPERTY) { setLocal(`Limite de ${MAX_IMAGES_PER_PROPERTY} fotos.`); return; }
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews(files.map((file) => ({ file, url: URL.createObjectURL(file) }))); setLocal(null);
  }
  function send() {
    run(async () => {
      let sent = 0;
      for (const preview of previews) {
        const data = new FormData(); data.set("propertyId", propertyId); data.append("files", preview.file);
        const result = await uploadImages(data);
        if (!result.ok || result.data.added !== 1 || result.data.rejected.length) return fail(`${sent} foto(s) enviada(s). As demais continuam selecionadas. ${result.ok ? result.data.rejected.join(" • ") : result.error}`);
        sent++;
        setPreviews((current) => current.filter((item) => { if (item !== preview) return true; URL.revokeObjectURL(item.url); return false; }));
        done();
      }
      if (input.current) input.current.value = "";
      return ok(undefined, `${sent} foto(s) enviada(s).`);
    });
  }
  function move(index: number, direction: -1 | 1) {
    const ids = images.map((image) => image.id); const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderImages({ propertyId, orderedIds: ids }), done);
  }
  return <Card title={`Fotos salvas (${images.length}/${MAX_IMAGES_PER_PROPERTY})`}>
    {allowUpload && <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
      <input ref={input} id={id} type="file" multiple disabled={pending} accept={IMAGE_ACCEPTED_ADMIN.join(",")} className="sr-only" onChange={(event) => pick(event.target.files)} />
      <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-[#092A5E] px-4 text-sm font-semibold text-white">Escolher fotos</label><p className="mt-2 text-xs text-slate-500">JPG, PNG ou WebP · até 10 MB cada</p>
    </div>}
    {local && <p role="alert" className="mt-3 text-sm text-red-600">{local}</p>}
    {previews.length > 0 && <div className="mt-3"><p className="mb-2 text-sm">{previews.length} foto(s) para enviar</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{previews.map((preview) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={preview.url} src={preview.url} alt={preview.file.name} className="aspect-square w-full rounded-lg object-cover" />
    ))}</div><Button className="mt-3" disabled={pending} onClick={send}>{pending ? "Enviando…" : "Enviar fotos agora"}</Button></div>}
    <div className="mt-3"><Feedback message={message} /></div>
    {images.length === 0 ? <p className="text-sm text-slate-500">Nenhuma foto salva ainda. A primeira enviada será a capa.</p> : <>
      <p className="text-xs text-slate-500">Alterar capa, ordem e excluir fotos salvas aplica a alteração imediatamente.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image, index) => <li key={image.id} className="overflow-hidden rounded-lg border border-slate-200">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image.url ? <img src={image.url} alt={`Foto ${index + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <span className="grid aspect-[4/3] place-items-center bg-slate-100 text-xs text-slate-500">Prévia indisponível</span>}
          {image.is_cover && <span className="absolute left-2 top-2 rounded-full bg-[#FF7500] px-2 py-1 text-xs font-bold text-white">Capa</span>}
        </div>
        <div className="flex flex-wrap gap-1 p-2"><Button variant="outline" className="px-2" disabled={pending || index === 0} aria-label={`Mover foto ${index + 1} para antes`} onClick={() => move(index, -1)}>←</Button><Button variant="outline" className="px-2" disabled={pending || index === images.length - 1} aria-label={`Mover foto ${index + 1} para depois`} onClick={() => move(index, 1)}>→</Button>
          {!image.is_cover && <Button variant="ghost" className="px-2" disabled={pending} onClick={() => run(() => setCoverImage({ propertyId, imageId: image.id }), done)}>Capa</Button>}
          <Button variant="danger" className="px-2" disabled={pending} onClick={() => setRemoving(image.id)}>Excluir</Button>
        </div>
      </li>)}</ul>
    </>}
    <AdminDialog open={removing !== null} title="Excluir foto?" description="A foto será excluída imediatamente. Esta ação não pode ser desfeita." onClose={() => setRemoving(null)} busy={pending} size="md"><div className="flex flex-wrap gap-2"><Button variant="danger" disabled={pending} onClick={() => { if (removing) run(() => removeImage({ propertyId, imageId: removing }), () => { setRemoving(null); done(); }); }}>Excluir foto</Button><Button variant="outline" disabled={pending} onClick={() => setRemoving(null)}>Cancelar</Button></div><Feedback message={message} /></AdminDialog>
  </Card>;
}
