import Link from "next/link";
import { getDashboard } from "@/lib/admin/queries";
import { Card, EmptyState, ErrorState, PageHeader, linkButton } from "@/components/admin/ui";

export const metadata = { title: "Painel — Admin Magalhães" };

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-[#092A5E]">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function Dashboard() {
  let s;
  try {
    s = await getDashboard();
  } catch {
    return (
      <>
        <PageHeader title="Painel" />
        <ErrorState message="Não consegui carregar os indicadores agora. Atualize a página em instantes." />
      </>
    );
  }
  const empty = s.totalProperties === 0;
  return (
    <>
      <PageHeader
        title="Painel"
        subtitle="Indicadores reais da sua operação."
        actions={<Link href="/admin/imoveis/novo" className={linkButton()}>+ Novo imóvel</Link>}
      />
      {empty && (
        <div className="mb-5">
          <EmptyState
            image="/magalhaes/rosto/06_chaves_do_imovel.png"
            title="Você ainda não cadastrou imóveis"
            text="Cadastre o primeiro imóvel com fotos e publique para ele aparecer no site e ser recomendado pela IA."
            action={<Link href="/admin/imoveis/novo" className={linkButton()}>Cadastrar primeiro imóvel</Link>}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Imóveis cadastrados" value={s.totalProperties} />
        <Kpi label="Disponíveis" value={s.published} hint="publicados no site" />
        <Kpi label="Reservados / vendidos" value={s.reservedOrSold} />
        <Kpi label="Novos interessados" value={s.newLeads} />
        <Kpi label="Em atendimento" value={s.leadsInProgress} />
        <Kpi label="Leads (30 dias)" value={s.leadsLast30d} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Imóveis mais vistos">
          {s.mostViewed.length ? (
            <ol className="divide-y divide-slate-100">
              {s.mostViewed.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/admin/imoveis/${p.id}`} className="min-w-0 truncate font-medium text-[#092A5E] hover:underline">{p.title}</Link>
                  <span className="shrink-0 text-slate-600">{p.count} visualizações</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">Ainda não há visualizações registradas.</p>}
        </Card>
        <Card title="Mais demonstrações de interesse">
          {s.mostInterest.length ? (
            <ol className="divide-y divide-slate-100">
              {s.mostInterest.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/admin/imoveis/${p.id}`} className="min-w-0 truncate font-medium text-[#092A5E] hover:underline">{p.title}</Link>
                  <span className="shrink-0 text-slate-600">{p.count} interessados</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-slate-500">Ainda não há interessados vinculados a imóveis.</p>}
        </Card>
        <Card title="Leads por período (últimas semanas)" className="lg:col-span-2">
          {s.leadsByWeek.some((w) => w.count > 0) ? (
            <div className="flex h-36 items-end gap-2" role="img" aria-label="Leads por semana">
              {s.leadsByWeek.map((w) => {
                const max = Math.max(...s.leadsByWeek.map((x) => x.count), 1);
                return (
                  <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-[#092A5E]">{w.count}</span>
                    <div className="w-full rounded-t bg-[#1769AA]" style={{ height: `${Math.max((w.count / max) * 100, 4)}%` }} />
                    <span className="text-[10px] text-slate-500">{w.week}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-500">Nenhum lead registrado no período.</p>}
        </Card>
      </div>
    </>
  );
}
