import Link from "next/link";
import { CatalogEmpty } from "@/components/site/catalog-empty";
import { PropertyCard } from "@/components/site/property-card";
import { catalogHref, type SP } from "@/lib/site/params";
import type { PropertyCard as Card, PublicFilters, PublicSort, SiteSettings } from "@/types/db";

type Props = {
  sp: SP;
  filters: PublicFilters;
  sort: PublicSort;
  page: number;
  filtered: boolean;
  items: Card[];
  total: number;
  hasMore: boolean;
  error: boolean;
  settings: SiteSettings | null;
  whatsappHref: string | null;
};

export function Catalog({ sp, filters, sort, page, filtered, items, total, hasMore, error, settings, whatsappHref }: Props) {
  return (
    <section id="imoveis" className="mx-auto max-w-6xl px-4 pt-20">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Catálogo</p>
          <h2 className="mt-1 text-3xl font-extrabold text-navy md:text-4xl">Imóveis disponíveis</h2>
        </div>
        {!error && total > 0 && <p className="text-sm text-muted">{total} {total === 1 ? "imóvel" : "imóveis"}</p>}
      </div>

      <form method="get" action="/#imoveis" className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
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
        <Field label="Preço máximo (R$)">
          <input name="max" inputMode="numeric" defaultValue={one(sp.max)} placeholder="Sem limite" className="input" />
        </Field>
        <Field label="Quartos (mín.)">
          <select name="quartos" defaultValue={filters.minBedrooms?.toString() ?? ""} className="input">
            <option value="">Qualquer</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </Field>
        <button type="submit" className="btn-press h-11 rounded-full bg-orange px-7 font-semibold text-white sm:col-span-2 lg:col-span-1">
          Filtrar
        </button>

        <details className="group sm:col-span-2 lg:col-span-5" open={Boolean(filters.purpose || filters.minPrice || filters.minParking || sort !== "recent")}>
          <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue hover:text-orange">
            Mais filtros <span aria-hidden className="transition-transform duration-150 group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Finalidade">
              <select name="finalidade" defaultValue={filters.purpose ?? ""} className="input">
                <option value="">Compra ou aluguel</option>
                <option value="sale">Compra</option>
                <option value="rent">Aluguel</option>
              </select>
            </Field>
            <Field label="Preço mínimo (R$)">
              <input name="min" inputMode="numeric" defaultValue={one(sp.min)} className="input" />
            </Field>
            <Field label="Vagas (mín.)">
              <select name="vagas" defaultValue={filters.minParking?.toString() ?? ""} className="input">
                <option value="">Qualquer</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}+</option>
                ))}
              </select>
            </Field>
            <Field label="Ordenar por">
              <select name="ordem" defaultValue={sort} className="input">
                <option value="recent">Mais recentes</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </Field>
          </div>
        </details>
      </form>

      {filtered && (
        <p className="mt-3 text-sm">
          <Link href="/#imoveis" className="font-semibold text-blue hover:text-orange">Limpar filtros</Link>
        </p>
      )}

      <div className="mt-8">
        {items.length === 0 ? (
          <CatalogEmpty error={error} filtered={filtered} whatsappHref={whatsappHref} />
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <PropertyCard key={c.id} card={c} settings={settings} />
            ))}
          </div>
        )}
      </div>

      {(page > 1 || hasMore) && (
        <nav aria-label="Paginação do catálogo" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={catalogHref(sp, page - 1)} className="btn-press flex h-11 items-center rounded-full border border-navy px-6 font-semibold text-navy">← Anterior</Link>
          )}
          <span className="text-sm text-muted">Página {page}</span>
          {hasMore && (
            <Link href={catalogHref(sp, page + 1)} className="btn-press flex h-11 items-center rounded-full bg-navy px-6 font-semibold text-white">Próxima →</Link>
          )}
        </nav>
      )}
    </section>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm font-medium text-navy">
      {label}
      {children}
    </label>
  );
}
