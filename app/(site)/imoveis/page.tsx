import type { Metadata } from "next";
import Link from "next/link";
import { CatalogEmpty } from "@/components/site/catalog-empty";
import { PropertyCard } from "@/components/site/property-card";
import { loadList, loadSettings } from "@/lib/site/data";
import { phoneOf } from "@/lib/site/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { PublicFilters, PublicSort } from "@/types/db";

export const metadata: Metadata = { title: "Imóveis", description: "Catálogo de imóveis selecionados pelo Magalhães." };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const num = (v: string | string[] | undefined) => {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters: PublicFilters = {
    q: one(sp.q),
    city: one(sp.cidade),
    neighborhood: one(sp.bairro),
    type: one(sp.tipo),
    purpose: one(sp.finalidade) === "rent" ? "rent" : one(sp.finalidade) === "sale" ? "sale" : undefined,
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    minBedrooms: num(sp.quartos),
    minParking: num(sp.vagas),
  };
  const sortParam = one(sp.ordem);
  const sort: PublicSort = sortParam === "price_asc" || sortParam === "price_desc" ? sortParam : "recent";
  const page = Math.max(1, Math.floor(num(sp.pagina) ?? 1));

  const [{ data: settings }, { data: list, error }] = await Promise.all([loadSettings(), loadList(filters, page, sort)]);
  const wa = buildWhatsAppLink(phoneOf(settings), settings?.default_message ?? undefined);
  const filtered = Object.values(filters).some((v) => v !== undefined);

  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = one(v);
      if (val && k !== "pagina") u.set(k, val);
    }
    if (p > 1) u.set("pagina", String(p));
    const s = u.toString();
    return s ? `/imoveis?${s}` : "/imoveis";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold text-navy">Imóveis</h1>
      <p className="mt-1 text-sm text-muted">{error ? "" : `${list.total} ${list.total === 1 ? "imóvel encontrado" : "imóveis encontrados"}`}</p>

      <form method="get" action="/imoveis" className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Cidade ou bairro">
          <input name="q" defaultValue={filters.q} placeholder="Ex.: Barueri" className="input" />
        </Field>
        <Field label="Tipo">
          <select name="tipo" defaultValue={filters.type ?? ""} className="input">
            <option value="">Todos</option>
            <option value="house">Casa</option>
            <option value="apartment">Apartamento</option>
            <option value="land">Terreno</option>
            <option value="commercial">Comercial</option>
          </select>
        </Field>
        <Field label="Finalidade">
          <select name="finalidade" defaultValue={filters.purpose ?? ""} className="input">
            <option value="">Compra ou aluguel</option>
            <option value="sale">Compra</option>
            <option value="rent">Aluguel</option>
          </select>
        </Field>
        <Field label="Ordenar por">
          <select name="ordem" defaultValue={sort} className="input">
            <option value="recent">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </Field>
        <Field label="Preço mínimo (R$)">
          <input name="min" inputMode="numeric" defaultValue={sp.min as string | undefined} className="input" />
        </Field>
        <Field label="Preço máximo (R$)">
          <input name="max" inputMode="numeric" defaultValue={sp.max as string | undefined} className="input" />
        </Field>
        <Field label="Quartos (mín.)">
          <select name="quartos" defaultValue={filters.minBedrooms?.toString() ?? ""} className="input">
            <option value="">Qualquer</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </Field>
        <Field label="Vagas (mín.)">
          <select name="vagas" defaultValue={filters.minParking?.toString() ?? ""} className="input">
            <option value="">Qualquer</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="h-11 flex-1 rounded-full bg-orange font-semibold text-white sm:flex-none sm:px-8">Filtrar</button>
          {filtered && (
            <Link href="/imoveis" className="flex h-11 items-center rounded-full border border-navy px-6 font-semibold text-navy">Limpar</Link>
          )}
        </div>
      </form>

      <div className="mt-8">
        {list.items.length === 0 ? (
          <CatalogEmpty error={error} filtered={filtered} whatsappHref={wa} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((c, i) => (
              <PropertyCard key={c.id} card={c} settings={settings} priority={i < 3} />
            ))}
          </div>
        )}
      </div>

      {(page > 1 || list.hasMore) && (
        <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && <Link href={qs(page - 1)} className="flex h-11 items-center rounded-full border border-navy px-6 font-semibold text-navy">← Anterior</Link>}
          <span className="text-sm text-muted">Página {page}</span>
          {list.hasMore && <Link href={qs(page + 1)} className="flex h-11 items-center rounded-full bg-navy px-6 font-semibold text-white">Próxima →</Link>}
        </nav>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-navy">
      {label}
      {children}
    </label>
  );
}
