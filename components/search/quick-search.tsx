"use client";

import { useRef, useState } from "react";
import { SearchResults, type SearchResponse } from "./search-results";

const TYPES = [
  { v: "", l: "Indiferente" },
  { v: "house", l: "Casa" },
  { v: "apartment", l: "Apartamento" },
  { v: "land", l: "Terreno" },
];
const INCOMES = ["Até R$ 3 mil", "R$ 3 a 5 mil", "R$ 5 a 8 mil", "Acima de R$ 8 mil"];
const FINANCING = [
  { v: "", l: "Prefiro não dizer" },
  { v: "financiar", l: "Pretendo financiar" },
  { v: "a_vista", l: "À vista" },
  { v: "avaliando", l: "Ainda avaliando" },
];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

type Status = "idle" | "loading" | "done" | "error";

/**
 * Busca da home (sem IA), tudo na mesma página: formulário compacto + "Refine sua busca" (renda,
 * financiamento, banheiros, vagas) + resultados inline em #resultados. Nada navega para outra página.
 */
export function QuickSearch({ cities }: { cities: string[] }) {
  const [place, setPlace] = useState("");
  const [budget, setBudget] = useState(""); // só dígitos
  const [type, setType] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [parking, setParking] = useState(0);
  const [income, setIncome] = useState("");
  const [financing, setFinancing] = useState("");
  const [notes, setNotes] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const placeRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function nearMe() {
    if (geo) {
      setGeo(null);
      setGeoMsg("");
      return;
    }
    if (!navigator.geolocation) return setGeoMsg("Seu navegador não oferece localização.");
    setGeoMsg("Aguardando permissão...");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoMsg("Usada só nesta busca, sem ser guardada.");
      },
      () => setGeoMsg("Sem problema, seguimos sem a sua localização."),
      { maximumAge: 60_000, timeout: 8_000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    // "place" casa cidade OU bairro no servidor: evita falso zero quando o texto é um bairro.
    const filters: Record<string, string | number> = {};
    const q = place.trim();
    if (q) filters.place = q;
    const max = Number(budget);
    if (max > 0) filters.maxPrice = max;
    if (type) filters.type = type;
    if (bedrooms > 0) filters.minBedrooms = bedrooms;
    if (bathrooms > 0) filters.minBathrooms = bathrooms;
    if (parking > 0) filters.minParking = parking;

    setSummary([
      q || "Qualquer local",
      max > 0 ? `até ${brl(max)}` : "Sem limite de valor",
      TYPES.find((t) => t.v === type)?.l ?? "Indiferente",
      bedrooms > 0 ? `${bedrooms}+ quartos` : "Qualquer nº de quartos",
      ...(bathrooms > 0 ? [`${bathrooms}+ banheiros`] : []),
      ...(parking > 0 ? [`${parking}+ vagas`] : []),
      ...(geo ? ["perto de você"] : []),
    ]);
    setStatus("loading");
    setData(null);
    requestAnimationFrame(() => document.getElementById("resultados")?.scrollIntoView({ block: "start" }));
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filters,
          geo: geo ?? undefined,
          // renda/financiamento só no corpo POST: não filtram o catálogo e não vão para URL/log
          prefs: { region: q || undefined, income: income || undefined, financing: financing || undefined, notes: notes.trim() || undefined },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as SearchResponse);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function edit() {
    placeRef.current?.scrollIntoView({ block: "center" });
    placeRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="w-full min-w-0">
      <form ref={formRef} onSubmit={submit} aria-label="Buscar imóveis">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[1.5fr_1.1fr_1fr_.8fr_auto] lg:items-start">
          <div className="min-w-0">
            <label htmlFor="qs-local" className="mb-1 block text-xs font-semibold text-navy">
              Local
            </label>
            <input
              id="qs-local"
              ref={placeRef}
              className="input w-full"
              list="qs-cidades"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Cidade ou bairro"
              autoComplete="off"
              maxLength={80}
            />
            <datalist id="qs-cidades">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <button type="button" onClick={nearMe} aria-pressed={!!geo} className="mt-1 min-h-6 text-xs font-medium text-blue underline underline-offset-2">
              {geo ? "Não usar minha localização" : "Perto de mim"}
            </button>
            {geoMsg && <span className="ml-2 text-xs text-muted">{geoMsg}</span>}
          </div>

          <div className="min-w-0">
            <label htmlFor="qs-orc" className="mb-1 block text-xs font-semibold text-navy">
              Orçamento máximo
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
              <input
                id="qs-orc"
                className="input w-full pl-10"
                inputMode="numeric"
                value={budget ? Number(budget).toLocaleString("pt-BR") : ""}
                onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="300.000"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor="qs-tipo" className="mb-1 block text-xs font-semibold text-navy">
              Tipo
            </label>
            <select id="qs-tipo" className="input w-full" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="qs-quartos" className="mb-1 block text-xs font-semibold text-navy">
              Quartos (mín.)
            </label>
            <select id="qs-quartos" className="input w-full" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}>
              <option value={0}>Tanto faz</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-12 rounded-full bg-orange px-6 font-semibold text-white transition-transform duration-150 active:scale-[.97] disabled:opacity-60 lg:mt-5"
          >
            {status === "loading" ? "Buscando..." : "Ver imóveis que combinam"}
          </button>
        </div>

        <details className="group mt-3 border-t border-border pt-3">
          <summary className="min-h-11 cursor-pointer list-none text-sm font-semibold text-blue marker:hidden">
            Refinar minha busca <span className="font-normal text-muted">(renda, financiamento, mais detalhes)</span>
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <fieldset className="min-w-0">
              <legend className="mb-1 text-xs font-semibold text-navy">Renda mensal aproximada (opcional)</legend>
              <div className="flex flex-wrap gap-2">
                {INCOMES.map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={income === i}
                    onClick={() => setIncome(income === i ? "" : i)}
                    className={`min-h-11 rounded-full border px-3 text-sm ${income === i ? "border-blue bg-blue text-white" : "border-border bg-white"}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Só ajuda a entender o orçamento. Não é análise de crédito nem aprovação.</p>
            </fieldset>
            <div className="min-w-0">
              <label htmlFor="qs-fin" className="mb-1 block text-xs font-semibold text-navy">
                Como pretende pagar?
              </label>
              <select id="qs-fin" className="input w-full" value={financing} onChange={(e) => setFinancing(e.target.value)}>
                {FINANCING.map((f) => (
                  <option key={f.v} value={f.v}>
                    {f.l}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label htmlFor="qs-ban" className="mb-1 block text-xs font-semibold text-navy">
                    Banheiros (mín.)
                  </label>
                  <select id="qs-ban" className="input w-full" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}>
                    <option value={0}>Tanto faz</option>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="qs-vag" className="mb-1 block text-xs font-semibold text-navy">
                    Vagas (mín.)
                  </label>
                  <select id="qs-vag" className="input w-full" value={parking} onChange={(e) => setParking(Number(e.target.value))}>
                    <option value={0}>Tanto faz</option>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}+
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 min-w-0">
            <label htmlFor="qs-notes" className="mb-1 block text-xs font-semibold text-navy">
              Algo mais que seja importante? (opcional)
            </label>
            <textarea
              id="qs-notes"
              className="input w-full"
              style={{ height: "auto", minHeight: "5rem" }}
              rows={3}
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: perto de escola, quintal, andar baixo"
            />
            <p className="mt-1 text-xs text-muted">Vai na mensagem para o Magalhães. Não filtra o catálogo.</p>
          </div>
        </details>
      </form>

      {status !== "idle" && (
        <section id="resultados" aria-live="polite" aria-busy={status === "loading"} className="scroll-mt-4">
          {status === "loading" && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Carregando resultados">
              {[0, 1].map((i) => (
                <li key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
                  <div className="aspect-[4/3] animate-pulse bg-surface" />
                  <div className="space-y-2 p-4">
                    <div className="h-5 w-1/2 animate-pulse rounded bg-surface" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {status === "error" && (
            <div role="alert" className="mt-6 rounded-2xl bg-surface p-5">
              <p>Não consegui buscar agora. Tente de novo em instantes ou fale direto com o Magalhães.</p>
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                className="mt-3 min-h-11 text-sm font-semibold text-blue underline underline-offset-2"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {status === "done" && data && <SearchResults data={data} summary={summary} onEdit={edit} scroll="start" />}
        </section>
      )}
    </div>
  );
}
