"use client";

import { useEffect, useState } from "react";
import { SearchResults, type SearchResponse } from "./search-results";

const TYPES = [
  { v: "", l: "Indiferente" },
  { v: "house", l: "Casa" },
  { v: "apartment", l: "Apartamento" },
  { v: "land", l: "Terreno" },
];
const BUDGETS = [200_000, 300_000, 400_000, 600_000, 1_000_000];
const INCOMES = ["Até R$ 3 mil", "R$ 3 a 5 mil", "R$ 5 a 8 mil", "Acima de R$ 8 mil"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const chip = (on: boolean) =>
  `min-h-11 rounded-full border px-4 text-sm font-medium transition ${
    on ? "border-blue bg-blue text-white" : "border-border bg-white text-foreground hover:border-blue"
  }`;

const STEP_TITLES = ["Localização", "Renda", "Orçamento", "Preferências"];

export function SearchWizard({ cities: initialCities }: { cities?: string[] }) {
  const [fetched, setFetched] = useState<string[] | null>(null);
  const cities = initialCities ?? fetched ?? [];
  useEffect(() => {
    if (initialCities) return;
    let off = false;
    fetch("/api/search/cities")
      .then((r) => (r.ok ? r.json() : { cities: [] }))
      .then((d: { cities?: string[] }) => !off && setFetched(d.cities ?? []))
      .catch(() => !off && setFetched([]));
    return () => {
      off = true;
    };
  }, [initialCities]);

  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [income, setIncome] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [type, setType] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);

  const filters: Record<string, string | number> = {};
  if (city) filters.city = city;
  if (type) filters.type = type;
  if (maxPrice) filters.maxPrice = maxPrice;
  if (bedrooms > 0) filters.minBedrooms = bedrooms;

  function askGeo() {
    if (!navigator.geolocation) return setGeoMsg("Seu navegador não oferece localização.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoMsg("Localização usada só nesta busca, sem ser guardada.");
      },
      () => setGeoMsg("Tudo bem, seguimos sem a sua localização."),
      { maximumAge: 60_000, timeout: 8_000 },
    );
  }

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filters,
          geo: geo ?? undefined,
          prefs: { income: income || undefined, region: city || undefined },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as SearchResponse);
      setStep(5);
    } catch {
      setError("Não consegui buscar agora. Você pode tentar de novo ou falar direto com o Magalhães.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 5 && data) {
    return (
      <div aria-live="polite">
      <SearchResults
        data={data}
        summary={[
          city || "Qualquer cidade",
          maxPrice ? `até ${brl(maxPrice)}` : "Sem limite de valor",
          type ? (TYPES.find((t) => t.v === type)?.l ?? type) : "Qualquer tipo",
          bedrooms > 0 ? `${bedrooms}+ quartos` : "Qualquer nº de quartos",
        ]}
        onEdit={() => {
          setData(null); // mantém TODAS as respostas; volta ao primeiro passo
          setStep(1);
        }}
      />
      </div>
    );
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <section className="mt-6" aria-live="polite">
      <p className="text-xs font-medium text-muted">Etapa {step} de 4 · {STEP_TITLES[step - 1]}</p>
      <div className="mt-1 h-1.5 rounded-full bg-surface" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
        <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${step * 25}%` }} />
      </div>

      {step === 1 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Onde você quer morar?</h2>
          {cities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button key={c} type="button" className={chip(city === c)} onClick={() => setCity(c)}>
                  {c}
                </button>
              ))}
              <button type="button" className={chip(city === "")} onClick={() => setCity("")}>
                Qualquer cidade
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">Ainda não há imóveis publicados. Você pode seguir e falar com o Magalhães ao final.</p>
          )}
          <div>
            <button type="button" onClick={askGeo} className="text-sm font-medium text-blue underline underline-offset-2">
              Usar minha localização (opcional)
            </button>
            {geoMsg && <p className="mt-1 text-xs text-muted">{geoMsg}</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Qual é aproximadamente a sua renda mensal? (opcional)</h2>
          <p className="text-sm text-muted">Ajuda a entender o orçamento. Não é análise de crédito nem aprovação de financiamento.</p>
          <div className="flex flex-wrap gap-2">
            {INCOMES.map((i) => (
              <button key={i} type="button" className={chip(income === i)} onClick={() => setIncome(income === i ? "" : i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Quanto pretende investir, no máximo?</h2>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button key={b} type="button" className={chip(maxPrice === b)} onClick={() => setMaxPrice(b)}>
                até {brl(b)}
              </button>
            ))}
            <button type="button" className={chip(maxPrice === null)} onClick={() => setMaxPrice(null)}>
              Sem limite definido
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-6 space-y-5">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Que tipo de imóvel você procura?</h2>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t.v} type="button" className={chip(type === t.v)} onClick={() => setType(t.v)}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Mínimo de quartos</h2>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <button key={n} type="button" className={chip(bedrooms === n)} onClick={() => setBedrooms(n)}>
                  {n === 0 ? "Tanto faz" : `${n}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-surface p-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" onClick={back} disabled={step === 1} className="min-h-11 px-4 text-sm font-medium text-muted disabled:invisible">
          Voltar
        </button>
        {step < 4 ? (
          <button type="button" onClick={next} className="min-h-12 flex-1 rounded-full bg-orange px-6 font-semibold text-white sm:flex-none">
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="min-h-12 flex-1 rounded-full bg-orange px-6 font-semibold text-white disabled:opacity-60 sm:flex-none"
          >
            {loading ? "Buscando..." : "Ver imóveis"}
          </button>
        )}
      </div>
    </section>
  );
}
