"use client";
import { useEffect, useRef, useState } from "react";
import { saveProperty, changePropertyStatus } from "@/lib/admin/actions/properties";
import { uploadImages } from "@/lib/admin/actions/images";
import { PROPERTY_PURPOSES, PROPERTY_PURPOSE_LABEL, PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, PROPERTY_TYPES, PROPERTY_TYPE_LABEL, IMAGE_ACCEPTED_ADMIN, IMAGE_MAX_BYTES_ADMIN, MAX_IMAGES_PER_PROPERTY } from "@/lib/admin/constants";
import { propertySteps, persistPropertyDraft, validatePropertyStep, stepForPropertyErrors, type PropertyDraft, type PropertyValues } from "@/lib/admin/property-wizard";
import { brl } from "@/lib/admin/format";
import { Button, Card, Field, Input, Select, Textarea } from "./ui";
import { ImageManager, type ImageItem } from "./image-manager";

export type PropertyFormInitial = PropertyValues & { id?: string; featureIds?: string[] };
export type FeatureOption = { id: string; name: string };

function StagedPhoto({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={file.name} className="aspect-square w-full rounded-lg object-cover" /> : null;
}

export function PropertyForm({ draft, features, images, onDraftChange, onSaved, onDiscard, onBusyChange, onImagesChanged }: {
  draft: PropertyDraft; features: FeatureOption[]; images: ImageItem[]; onDraftChange: (draft: PropertyDraft) => void;
  onSaved: (id: string) => void; onDiscard: () => void; onBusyChange?: (busy: boolean) => void; onImagesChanged: () => void;
}) {
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { const scroll = form.current?.closest<HTMLElement>("[data-admin-dialog-scroll]"); if (scroll) scroll.scrollTop = 0; }, [draft.step]);
  const d = draft.values;
  const update = (key: string, value: PropertyValues[string]) => onDraftChange({ ...draft, values: { ...d, [key]: value } });
  const changeStep = (step: number) => { onDraftChange({ ...draft, step }); setErrors({}); setMessage(null); };
  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label} error={errors[name]}><Input name={name} value={d[name] == null ? "" : String(d[name])} onChange={(event) => update(name, event.target.value)} aria-invalid={!!errors[name]} {...props} /></Field>
  );
  function next() {
    const found = validatePropertyStep(d, draft.step);
    setErrors(found);
    if (Object.keys(found).length) { setMessage("Revise os campos indicados antes de continuar."); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    changeStep(Math.min(5, draft.step + 1));
  }
  async function submit() {
    if (saving.current) return;
    const found = validatePropertyStep(d);
    if (Object.keys(found).length) { onDraftChange({ ...draft, step: stepForPropertyErrors(found) }); setErrors(found); setMessage("Revise os campos indicados."); return; }
    saving.current = true; setPending(true); onBusyChange?.(true); setMessage(null);
    try {
      const result = await persistPropertyDraft(draft, {
        save: saveProperty,
        upload: (id, file) => { const data = new FormData(); data.set("propertyId", id); data.append("files", file); return uploadImages(data); },
        publish: (id, status) => changePropertyStatus({ id, status }),
      }, onDraftChange);
      onImagesChanged();
      if (result.ok) onSaved(result.data.id);
      else { setMessage(result.error); setErrors(result.fieldErrors ?? {}); }
    } catch { setMessage("A conexão foi interrompida. Os dados e as fotos pendentes continuam aqui. Confira o imóvel antes de tentar novamente."); }
    finally { saving.current = false; setPending(false); onBusyChange?.(false); }
  }
  function pick(list: FileList | null) {
    const files = Array.from(list ?? []);
    const bad = files.filter((file) => !(IMAGE_ACCEPTED_ADMIN as readonly string[]).includes(file.type) || file.size === 0 || file.size > IMAGE_MAX_BYTES_ADMIN);
    if (bad.length) { setMessage(`Confira formato e tamanho de: ${bad.map((file) => file.name).join(", ")}. Use JPG, PNG ou WebP até 10 MB.`); return; }
    if (images.length + draft.files.length + files.length > MAX_IMAGES_PER_PROPERTY) { setMessage(`Limite de ${MAX_IMAGES_PER_PROPERTY} fotos.`); return; }
    onDraftChange({ ...draft, files: [...draft.files, ...files] }); setMessage(null);
  }
  return (
    <form ref={form} className="space-y-5" noValidate onSubmit={(event) => { event.preventDefault(); if (draft.step === 5) void submit(); else next(); }}>
      <nav aria-label="Etapas do imóvel" className="flex gap-2 overflow-x-auto pb-2">
        {propertySteps.map((label, index) => <button key={label} type="button" disabled={pending} aria-current={draft.step === index ? "step" : undefined} onClick={() => changeStep(index)} className={`min-h-11 shrink-0 rounded-full border px-3 text-sm ${draft.step === index ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-200 bg-white text-slate-600"}`}>{index + 1}. {label}</button>)}
      </nav>
      <p role="status" className="text-xs text-slate-500">Etapa {draft.step + 1} de 6 · Seu rascunho permanece aqui ao fechar esta janela. Recarregar a página ou sair descarta o que ainda não foi salvo.</p>
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        {draft.step === 0 && <Card title="Identificação"><div className="grid gap-3 sm:grid-cols-2">
          {input("code", "Código interno *", { maxLength: 40, required: true })}{input("title", "Título *", { maxLength: 140, required: true })}
          <Field label="Tipo *" error={errors.type}><Select name="type" value={String(d.type)} onChange={(e) => update("type", e.target.value)}>{PROPERTY_TYPES.map((value) => <option key={value} value={value}>{PROPERTY_TYPE_LABEL[value]}</option>)}</Select></Field>
          <Field label="Finalidade *" error={errors.purpose}><Select name="purpose" value={String(d.purpose)} onChange={(e) => update("purpose", e.target.value)}>{PROPERTY_PURPOSES.map((value) => <option key={value} value={value}>{PROPERTY_PURPOSE_LABEL[value]}</option>)}</Select></Field>
          <div className="sm:col-span-2"><Field label="Descrição" error={errors.description}><Textarea name="description" value={String(d.description ?? "")} maxLength={8000} rows={5} onChange={(e) => update("description", e.target.value)} /></Field></div>
        </div></Card>}
        {draft.step === 1 && <Card title="Valores e medidas"><div className="grid gap-3 sm:grid-cols-3">
          {input("price", "Preço (R$) *", { inputMode: "decimal" })}{input("condoFee", "Condomínio (R$)", { inputMode: "decimal" })}{input("iptu", "IPTU (R$)", { inputMode: "decimal" })}
          {input("areaUseful", "Área útil (m²)", { inputMode: "decimal" })}{input("areaTotal", "Área total (m²)", { inputMode: "decimal" })}
          {input("bedrooms", "Quartos", { inputMode: "numeric" })}{input("suites", "Suítes", { inputMode: "numeric" })}{input("bathrooms", "Banheiros", { inputMode: "numeric" })}{input("parking", "Vagas", { inputMode: "numeric" })}
        </div></Card>}
        {draft.step === 2 && <Card title="Localização"><div className="grid gap-3 sm:grid-cols-3">
          {input("neighborhood", "Bairro *", { maxLength: 80 })}{input("city", "Cidade *", { maxLength: 80 })}{input("state", "UF *", { maxLength: 2 })}
          <div className="sm:col-span-3">{input("address", "Endereço completo", { maxLength: 200 })}</div>
          {input("latitude", "Latitude", { inputMode: "decimal" })}{input("longitude", "Longitude", { inputMode: "decimal" })}
        </div><label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={d.hideAddress !== false} onChange={(e) => update("hideAddress", e.target.checked)} className="h-5 w-5" />Ocultar endereço exato no site</label></Card>}
        {draft.step === 3 && <Card title="Comodidades"><div className="flex flex-wrap gap-2">{features.length ? features.map((feature) => {
          const ids = (d.featureIds ?? []) as string[]; const selected = ids.includes(feature.id);
          return <button key={feature.id} type="button" aria-pressed={selected} onClick={() => update("featureIds", selected ? ids.filter((id) => id !== feature.id) : [...ids, feature.id])} className={`min-h-11 rounded-full border px-4 text-sm ${selected ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-300"}`}>{feature.name}</button>;
        }) : <p className="text-sm text-slate-500">Nenhuma comodidade disponível. Você pode continuar.</p>}</div></Card>}
        {draft.step === 4 && <>
          {draft.savedId && <ImageManager propertyId={draft.savedId} images={images} onChanged={onImagesChanged} allowUpload={false} />}
          <Card title="Fotos para salvar"><Field label="Adicionar fotos" hint="JPG, PNG ou WebP · até 10 MB cada. O envio acontece ao salvar na revisão."><input type="file" multiple accept={IMAGE_ACCEPTED_ADMIN.join(",")} className="block w-full min-w-0 rounded-lg border border-slate-300 p-2 text-sm" onChange={(event) => { pick(event.target.files); event.target.value = ""; }} /></Field>
            {draft.files.length > 0 && <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{draft.files.map((file, index) => <li key={`${file.name}-${index}`} className="min-w-0 rounded-xl border border-slate-200 p-2"><StagedPhoto file={file} /><p className="my-1 truncate text-xs">{file.name}</p><div className="flex flex-wrap gap-1">
              <Button variant="outline" aria-label={`Mover ${file.name} para antes`} disabled={index === 0} onClick={() => { const files = [...draft.files]; [files[index - 1], files[index]] = [files[index], files[index - 1]]; onDraftChange({ ...draft, files }); }}>←</Button>
              <Button variant="outline" aria-label={`Mover ${file.name} para depois`} disabled={index === draft.files.length - 1} onClick={() => { const files = [...draft.files]; [files[index + 1], files[index]] = [files[index], files[index + 1]]; onDraftChange({ ...draft, files }); }}>→</Button>
              <Button variant="ghost" onClick={() => onDraftChange({ ...draft, files: draft.files.filter((_, i) => i !== index) })}>Remover</Button></div></li>)}</ul>}
            {!draft.savedId && <p className="mt-3 text-sm text-slate-500">A primeira foto será a capa. Reordene antes de salvar.</p>}
          </Card>
        </>}
        {draft.step === 5 && <Card title="Revisão e publicação"><dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 break-words text-sm"><dt>Título</dt><dd>{String(d.title || "Não informado")}</dd><dt>Código</dt><dd>{String(d.code || "Não informado")}</dd><dt>Valor</dt><dd>{String(d.price || "Não informado")}</dd><dt>Local</dt><dd>{String(d.neighborhood)}, {String(d.city)} / {String(d.state)}</dd><dt>Fotos</dt><dd>{images.length} salvas · {draft.files.length} para enviar</dd></dl>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Situação" error={errors.status} hint="Somente Publicado aparece no site."><Select value={String(d.status)} onChange={(e) => update("status", e.target.value)}>{PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_STATUS_LABEL[status]}</option>)}</Select></Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm"><input type="checkbox" checked={!!d.featured} onChange={(e) => update("featured", e.target.checked)} className="h-5 w-5" />Destacar na página inicial</label></div>
          <p className="mt-4 text-sm text-slate-500">Confira os dados. Nenhuma alteração neste formulário será enviada antes de salvar. Novos imóveis só são publicados após o envio completo das fotos.</p>
        </Card>}
      </fieldset>
      {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
      {confirmDiscard && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm"><p>Descartar alterações e fotos ainda não enviadas? {draft.savedId && "O imóvel e as fotos já salvas serão mantidos."}</p><div className="mt-2 flex gap-2"><Button variant="danger" disabled={pending} onClick={onDiscard}>Sim, descartar alterações</Button><Button variant="outline" onClick={() => setConfirmDiscard(false)}>Continuar editando</Button></div></div>}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white py-3">
        <Button variant="ghost" disabled={pending} onClick={() => setConfirmDiscard(true)}>Descartar</Button>
        <div className="flex gap-2">{draft.step > 0 && <Button variant="outline" disabled={pending} onClick={() => changeStep(draft.step - 1)}>Voltar</Button>}<Button type="submit" disabled={pending}>{pending ? "Salvando…" : draft.step === 5 ? "Salvar imóvel" : "Continuar"}</Button></div>
      </div>
    </form>
  );
}
