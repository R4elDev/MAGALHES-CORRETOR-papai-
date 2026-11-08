"use client";

import { useEffect, useRef } from "react";
import type { AlternativeCard, FilterKey, PropertyCard } from "@/lib/search/types";

export type SearchResponse = {
  mode: "structured" | "hybrid";
  results: PropertyCard[];
  alternatives: AlternativeCard[];
  noResults: boolean;
  whatsappFallback: { url: string | null };
  propertyLinks: Record<string, string>;
};

const LABEL: Record<FilterKey, string> = {
  place: "o local",
  city: "a cidade",
  neighborhood: "o bairro",
  type: "o tipo de imóvel",
  purpose: "a finalidade",
  minPrice: "o valor mínimo",
  maxPrice: "o seu orçamento",
  minBedrooms: "o mínimo de quartos",
  minBathrooms: "o mínimo de banheiros",
  minParking: "as vagas",
  availability: "a disponibilidade",
};

const brl = (n: number | null) =>
  n == null ? "Preço sob consulta" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Card({ c, unmet, phoneUrl }: { c: PropertyCard; unmet?: FilterKey[]; phoneUrl: string | null }) {
  const facts = [
    c.bedrooms != null && `${c.bedrooms} quarto${c.bedrooms === 1 ? "" : "s"}`,
    c.bathrooms != null && `${c.bathrooms} banheiro${c.bathrooms === 1 ? "" : "s"}`,
    c.parking != null && `${c.parking} vaga${c.parking === 1 ? "" : "s"}`,
    c.areaM2 != null && `${c.areaM2} m²`,
  ].filter(Boolean);
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {c.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.coverUrl} alt={c.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-surface text-sm text-muted">Foto em breve</div>
      )}
      <div className="space-y-2 p-4">
        <p className="text-xl font-bold text-navy">{brl(c.price)}</p>
        <h3 className="font-semibold leading-snug">{c.title}</h3>
        <p className="text-sm text-muted">
          {[c.neighborhood, c.city].filter(Boolean).join(", ") || "Localização a confirmar"}
          {c.distanceKm != null && ` · a ~${c.distanceKm.toLocaleString("pt-BR")} km de você`}
        </p>
        {facts.length > 0 && <p className="text-sm">{facts.join(" · ")}</p>}
        {unmet && unmet.length > 0 && (
          <p className="rounded-lg bg-surface p-2 text-xs">
            Não atende exatamente: {unmet.map((k) => LABEL[k]).join(", ")}.
          </p>
        )}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <a href={`/imoveis/${c.slug ?? c.id}`} className="min-h-11 rounded-full border border-blue px-4 py-2.5 text-center text-sm font-semibold text-blue">
            Ver imóvel
          </a>
          {phoneUrl && (
            <a href={phoneUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 rounded-full bg-whatsapp px-4 py-2.5 text-center text-sm font-semibold text-white">
              Conversar sobre este imóvel
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export function SearchResults({
  data,
  summary,
  onEdit,
  scroll = "nearest",
}: {
  data: SearchResponse;
  summary: string[];
  onEdit: () => void;
  scroll?: "start" | "nearest";
}) {
  const wa = data.whatsappFallback.url;
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // acessibilidade: foco no resumo; suavidade/reduced-motion vêm do CSS global
    top.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView({ block: scroll });
  }, [scroll]);
  return (
    <div className="mt-6 space-y-5">
      <div ref={top} tabIndex={-1} className="scroll-mt-4 rounded-xl bg-surface p-3 outline-none">
        <p className="text-xs font-medium text-muted">Sua busca</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {summary.map((t) => (
            <li key={t} className="rounded-full bg-white px-3 py-1 text-xs font-medium">
              {t}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onEdit} className="mt-2 min-h-11 text-sm font-semibold text-blue underline underline-offset-2">
          Alterar filtros
        </button>
      </div>
      {data.noResults ? (
        <div className="rounded-2xl bg-surface p-5">
          <p className="text-base leading-relaxed">
            Não encontrei por aqui um imóvel que combine exatamente com o que você procura neste momento. Mas vale conversar com o
            Magalhães! Ele pode te ajudar a avaliar outras possibilidades e encontrar uma opção que faça mais sentido para você.
          </p>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-4 block min-h-12 rounded-full bg-whatsapp px-6 py-3 text-center font-semibold text-white">
              Conversar com o Magalhães no WhatsApp
            </a>
          ) : (
            <p className="mt-3 text-sm text-muted">O contato do Magalhães será exibido aqui assim que for configurado.</p>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">
            {data.results.length} imóve{data.results.length === 1 ? "l" : "is"} disponíve{data.results.length === 1 ? "l" : "is"} para você
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.results.map((c) => (
              <Card key={c.id} c={c} phoneUrl={data.propertyLinks[c.id] ?? null} />
            ))}
          </ul>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="block min-h-12 rounded-full bg-whatsapp px-6 py-3 text-center font-semibold text-white">
              Enviar minhas preferências ao Magalhães
            </a>
          )}
          <p className="text-xs text-muted">O WhatsApp abre com a mensagem pronta para você conferir; ela só é enviada quando você confirmar.</p>
        </>
      )}

      {data.alternatives.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Opções parecidas</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.alternatives.map((a) => (
              <Card key={a.card.id} c={a.card} unmet={a.unmetCriteria} phoneUrl={data.propertyLinks[a.card.id] ?? null} />
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onEdit} className="min-h-11 text-sm font-medium text-blue underline underline-offset-2">
        Alterar filtros e buscar de novo
      </button>
    </div>
  );
}
