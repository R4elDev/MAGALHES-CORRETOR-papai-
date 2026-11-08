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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-2" aria-label="Filtrar por tipo">
          {TYPES.map(([value, label]) => (
            <li key={label}>
              <Chip href={withParams(sp, { tipo: value, pagina: undefined })} active={(filters.type ?? "") === value}>{label}</Chip>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap items-center gap-2" aria-label="Ordenar">
          <li className="text-sm text-muted">Ordenar:</li>
          {SORTS.map(([value, label]) => (
            <li key={value}>
              <Chip href={withParams(sp, { ordem: value === "recent" ? undefined : value, pagina: undefined })} active={sort === value}>{label}</Chip>
            </li>
          ))}
        </ul>
      </div>

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

const TYPES: [string, string][] = [["", "Todos"], ["house", "Casas"], ["apartment", "Apartamentos"], ["land", "Terrenos"]];
const SORTS: [PublicSort, string][] = [["recent", "Recentes"], ["price_asc", "Menor preço"], ["price_desc", "Maior preço"]];

function withParams(sp: SP, patch: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) u.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) u.set(k, v);
    else u.delete(k);
  }
  const q = u.toString();
  return `/${q ? `?${q}` : ""}#imoveis`;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`btn-press inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold ${
        active ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:border-navy"
      }`}
    >
      {children}
    </Link>
  );
}
