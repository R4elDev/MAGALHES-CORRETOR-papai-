"use client";
import { useState } from "react";
import type { AdminPropertyRow, Paged } from "@/types/db";
import type { PropertyFilters } from "@/lib/admin/workspace-types";
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL, type PropertyStatusValue } from "@/lib/admin/constants";
import { brl } from "@/lib/admin/format";
import { Badge, Button, Field, Input, Select } from "./ui";
import { PropertyRowActions } from "./property-row-actions";

export function WorkspaceProperties({ data, loading, onLoad, onOpen, onChanged }: {
  data: Paged<AdminPropertyRow> | null; loading: boolean; onLoad: (filters: PropertyFilters) => void;
  onOpen: (id?: string) => void; onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>({});
  function apply(next: PropertyFilters) { setFilters(next); onLoad(next); }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{data ? `${data.total} imóveis no total` : "Seu catálogo de imóveis"}</p><Button onClick={() => onOpen()}>+ Novo imóvel</Button></div>
    <form role="search" className="flex gap-2" onSubmit={(event) => { event.preventDefault(); apply({ ...filters, q: query, page: 1 }); }}><Input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} placeholder="Título, código ou bairro" aria-label="Buscar imóveis" className="min-w-0 flex-1" /><Button type="submit" variant="navy" disabled={loading}>Buscar</Button></form>
    <Field label="Filtrar situação"><Select value={filters.status ?? ""} disabled={loading} onChange={(event) => apply({ ...filters, status: (event.target.value || undefined) as PropertyStatusValue | undefined, page: 1 })}><option value="">Todas as situações</option>{PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_STATUS_LABEL[status]}</option>)}</Select></Field>
    {data && !data.items.length && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center"><h3 className="font-bold text-[#092A5E]">{filters.q || filters.status ? "Nenhum imóvel com esse filtro" : "Cadastre seu primeiro imóvel"}</h3><p className="my-3 text-sm text-slate-500">{filters.q || filters.status ? "Ajuste os filtros para encontrar o imóvel." : "Vamos guiar você pelas informações, valores e fotos."}</p><Button variant="outline" onClick={() => filters.q || filters.status ? (setQuery(""), apply({})) : onOpen()}>{filters.q || filters.status ? "Limpar filtros" : "Cadastrar imóvel"}</Button></div>}
    <ul className="space-y-3" aria-busy={loading}>{data?.items.map((property) => <li key={property.id} className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex gap-3"><button type="button" onClick={() => onOpen(property.id)} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100" aria-label={`Editar ${property.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {property.cover_url ? <img src={property.cover_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-400">Sem foto</span>}
      </button><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge tone={property.status === "published" ? "green" : "gray"}>{PROPERTY_STATUS_LABEL[property.status]}</Badge><span className="text-xs text-slate-500">{property.code}</span></div><button type="button" onClick={() => onOpen(property.id)} className="min-h-11 max-w-full break-words text-left font-bold text-[#092A5E]">{property.title}</button><p className="break-words text-sm text-slate-500">{PROPERTY_TYPE_LABEL[property.type as keyof typeof PROPERTY_TYPE_LABEL] ?? property.type} · {property.neighborhood}, {property.city}</p><p className="font-semibold">{brl(property.price)}</p></div></div>
      <PropertyRowActions id={property.id} status={property.status} featured={property.featured} onChanged={onChanged} />
    </li>)}</ul>
    {data && (data.page > 1 || data.hasMore) && <nav aria-label="Paginação de imóveis" className="flex items-center justify-between gap-2"><Button variant="outline" disabled={loading || data.page <= 1} onClick={() => apply({ ...filters, page: data.page - 1 })}>← Anterior</Button><span className="text-sm text-slate-500">Página {data.page}</span><Button variant="outline" disabled={loading || !data.hasMore} onClick={() => apply({ ...filters, page: data.page + 1 })}>Próxima →</Button></nav>}
  </div>;
}
