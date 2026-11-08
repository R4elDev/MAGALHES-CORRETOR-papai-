import Link from "next/link";
import { listAdminProperties } from "@/lib/admin/queries";
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, PROPERTY_TYPE_LABEL, type PropertyStatusValue } from "@/lib/admin/constants";
import { brl } from "@/lib/admin/format";
import { Badge, EmptyState, ErrorState, PageHeader, linkButton, cx } from "@/components/admin/ui";
import { PropertyRowActions } from "@/components/admin/property-row-actions";

export const metadata = { title: "Imóveis — Admin Magalhães" };
const tone = { draft: "gray", published: "green", reserved: "orange", sold: "navy", rented: "navy", archived: "gray" } as const;

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = PROPERTY_STATUSES.includes(sp.status as PropertyStatusValue) ? (sp.status as PropertyStatusValue) : undefined;
  let res;
  try {
    res = await listAdminProperties({ status, q: sp.q?.slice(0, 80), page: Number(sp.page) || 1 });
  } catch {
    return (<><PageHeader title="Imóveis" /><ErrorState message="Não consegui carregar os imóveis. Atualize a página." /></>);
  }
  const chip = (active: boolean) =>
    cx("inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium",
      active ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-300 bg-white text-slate-700");
  return (
    <>
      <PageHeader title="Imóveis" subtitle={`${res.total} no total`} actions={<Link href="/admin/imoveis/novo" className={linkButton()}>+ Novo imóvel</Link>} />
      <form className="mb-3 flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={sp.q} placeholder="Buscar por título, código ou bairro" aria-label="Buscar imóveis"
          className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base sm:text-sm" />
        <button className={linkButton("navy")}>Buscar</button>
      </form>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/imoveis" className={chip(!status)}>Todos</Link>
        {PROPERTY_STATUSES.map((s) => (
          <Link key={s} href={`/admin/imoveis?status=${s}`} className={chip(status === s)}>{PROPERTY_STATUS_LABEL[s]}</Link>
        ))}
      </div>
      {res.items.length === 0 ? (
        <EmptyState
          image="/magalhaes/rosto/04_pensativo.png"
          title={status || sp.q ? "Nenhum imóvel com esse filtro" : "Nenhum imóvel cadastrado"}
          text={status || sp.q ? "Ajuste a busca ou limpe os filtros." : "Cadastre o primeiro imóvel para começar."}
          action={<Link href="/admin/imoveis/novo" className={linkButton()}>Cadastrar imóvel</Link>}
        />
      ) : (
        <ul className="space-y-3">
          {res.items.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Link href={`/admin/imoveis/${p.id}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-32">
                {p.cover_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <span className="grid h-full place-items-center px-1 text-center text-xs text-slate-400">Sem foto</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={tone[p.status as PropertyStatusValue]}>{PROPERTY_STATUS_LABEL[p.status as PropertyStatusValue]}</Badge>
                  {p.featured && <Badge tone="orange">Destaque</Badge>}
                  <span className="text-xs text-slate-500">{p.code}</span>
                </div>
                <Link href={`/admin/imoveis/${p.id}`} className="mt-1 block truncate font-bold text-[#092A5E] hover:underline">{p.title}</Link>
                <p className="truncate text-sm text-slate-600">
                  {PROPERTY_TYPE_LABEL[p.type as keyof typeof PROPERTY_TYPE_LABEL] ?? p.type} · {p.neighborhood}, {p.city}/{p.state}
                </p>
                <p className="text-sm font-semibold text-slate-900">{brl(p.price)}</p>
                <PropertyRowActions id={p.id} status={p.status as PropertyStatusValue} featured={!!p.featured} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {res.total > res.items.length && (
        <nav className="mt-4 flex justify-between text-sm" aria-label="Paginação">
          {(Number(sp.page) || 1) > 1
            ? <Link className={linkButton("outline")} href={`/admin/imoveis?${new URLSearchParams({ ...(status && { status }), ...(sp.q && { q: sp.q }), page: String((Number(sp.page) || 1) - 1) })}`}>← Anterior</Link>
            : <span />}
          {res.hasMore && <Link className={linkButton("outline")} href={`/admin/imoveis?${new URLSearchParams({ ...(status && { status }), ...(sp.q && { q: sp.q }), page: String((Number(sp.page) || 1) + 1) })}`}>Próxima →</Link>}
        </nav>
      )}
    </>
  );
}
