"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProperty } from "@/lib/admin/actions/properties";
import {
  PROPERTY_PURPOSES, PROPERTY_PURPOSE_LABEL, PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, PROPERTY_TYPES, PROPERTY_TYPE_LABEL,
} from "@/lib/admin/constants";
import { Button, Card, Field, Input, Select, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

export type PropertyFormInitial = Partial<Record<string, string | number | boolean | null>> & { id?: string; featureIds?: string[] };
export type FeatureOption = { id: string; name: string };

const s = (v: unknown) => (v == null ? "" : String(v));

export function PropertyForm({ initial, features }: { initial?: PropertyFormInitial; features: FeatureOption[] }) {
  const router = useRouter();
  const { pending, message, fieldErrors: fe, run } = useAction();
  const [hideAddress, setHideAddress] = useState(initial?.hideAddress !== false);
  const [featured, setFeatured] = useState(!!initial?.featured);
  const [featureIds, setFeatureIds] = useState<string[]>(initial?.featureIds ?? []);
  const d = initial ?? {};

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    run(
      () => saveProperty({ ...f, id: initial?.id, hideAddress, featured, featureIds }),
      (r) => (initial?.id ? router.refresh() : router.push(`/admin/imoveis/${r.id}?novo=1`)),
    );
  }
  const input = (name: string, label: string, p: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label} error={fe[name]}>
      <Input name={name} defaultValue={s(d[name])} aria-invalid={!!fe[name]} {...p} />
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Card title="Identificação">
        <div className="grid gap-3 sm:grid-cols-2">
          {input("code", "Código interno *", { required: true, maxLength: 40 })}
          {input("title", "Título *", { required: true, maxLength: 140 })}
          <Field label="Tipo *" error={fe.type}>
            <Select name="type" defaultValue={s(d.type) || "apartment"}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{PROPERTY_TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="Finalidade *" error={fe.purpose}>
            <Select name="purpose" defaultValue={s(d.purpose) || "sale"}>
              {PROPERTY_PURPOSES.map((t) => <option key={t} value={t}>{PROPERTY_PURPOSE_LABEL[t]}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Descrição" error={fe.description} hint="Usada no site e pela IA para entender o imóvel. Não invente informações.">
            <Textarea name="description" defaultValue={s(d.description)} rows={6} maxLength={8000} />
          </Field>
        </div>
      </Card>

      <Card title="Valores e medidas">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {input("price", "Preço (R$) *", { inputMode: "decimal", required: true })}
          {input("condoFee", "Condomínio (R$)", { inputMode: "decimal" })}
          {input("iptu", "IPTU (R$)", { inputMode: "decimal" })}
          {input("areaUseful", "Área útil (m²)", { inputMode: "decimal" })}
          {input("areaTotal", "Área total (m²)", { inputMode: "decimal" })}
          {input("bedrooms", "Quartos", { inputMode: "numeric" })}
          {input("suites", "Suítes", { inputMode: "numeric" })}
          {input("bathrooms", "Banheiros", { inputMode: "numeric" })}
          {input("parking", "Vagas", { inputMode: "numeric" })}
        </div>
      </Card>

      <Card title="Localização">
        <div className="grid gap-3 sm:grid-cols-3">
          {input("neighborhood", "Bairro *", { required: true })}
          {input("city", "Cidade *", { required: true })}
          {input("state", "UF *", { required: true, maxLength: 2, placeholder: "SP" })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">{input("address", "Endereço completo")}</div>
          {input("latitude", "Latitude", { inputMode: "decimal" })}
          {input("longitude", "Longitude", { inputMode: "decimal" })}
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={hideAddress} onChange={(e) => setHideAddress(e.target.checked)} className="h-5 w-5 accent-[#FF7500]" />
          <span><strong>Ocultar endereço exato no site</strong> — o público verá só bairro e cidade.</span>
        </label>
      </Card>

      {features.length > 0 && (
        <Card title="Comodidades e diferenciais">
          <div className="flex flex-wrap gap-2">
            {features.map((ft) => {
              const on = featureIds.includes(ft.id);
              return (
                <button type="button" key={ft.id} aria-pressed={on}
                  onClick={() => setFeatureIds(on ? featureIds.filter((x) => x !== ft.id) : [...featureIds, ft.id])}
                  className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-300 bg-white text-slate-700"}`}>
                  {ft.name}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card title="Publicação">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Situação" error={fe.status} hint="Só “Publicado” aparece no site e é recomendado pela IA.">
            <Select name="status" defaultValue={s(d.status) || "draft"}>
              {PROPERTY_STATUSES.map((t) => <option key={t} value={t}>{PROPERTY_STATUS_LABEL[t]}</option>)}
            </Select>
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 accent-[#FF7500]" />
            Destacar na página inicial
          </label>
        </div>
      </Card>

      <Feedback message={message} />
      {fe._ && <p role="alert" className="text-sm text-red-600">{fe._[0]}</p>}
      <div className="sticky bottom-16 z-10 flex justify-end gap-2 rounded-xl bg-white/90 p-2 backdrop-blur lg:bottom-2">
        <Button variant="outline" onClick={() => router.push("/admin/imoveis")}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : initial?.id ? "Salvar alterações" : "Criar imóvel"}</Button>
      </div>
    </form>
  );
}
