import { Building2, CalendarDays, CheckCircle2, Eye, Flame, MessageCircle, Plus, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { getDashboard } from "@/lib/admin/queries";
import { AdminOpenButton } from "@/components/admin/admin-workspace";
import { Card, EmptyState, ErrorState, PageHeader, cx, linkButton } from "@/components/admin/ui";

export const metadata = { title: "Painel — Admin Magalhães" };

type Tone = "navy" | "blue" | "orange" | "green";
const toneCls: Record<Tone, string> = {
  navy: "bg-[#092A5E]/10 text-[#092A5E]",
  blue: "bg-[#1769AA]/10 text-[#1769AA]",
  orange: "bg-[#FF7500]/15 text-[#a34c00]",
  green: "bg-emerald-100 text-emerald-700",
};

function Kpi({ label, value, hint, icon: Icon, tone, action, i }: {
  label: string; value: number | string; hint?: string; icon: LucideIcon; tone: Tone; action: "properties" | "leads"; i: number;
}) {
  return (
    <div className="adm-rise" style={{ ["--i" as string]: i }}>
    <AdminOpenButton action={action} className="adm-card adm-lift block min-h-11 w-full rounded-2xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]">
      <span className="contents">
        <span className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
          <span className={cx("grid h-8 w-8 place-items-center rounded-lg", toneCls[tone])}><Icon size={16} aria-hidden /></span>
        </span>
        <span className="mt-2 block text-3xl font-extrabold tabular-nums text-[#092A5E]">{value}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </AdminOpenButton>
    </div>
  );
}

function Ranking({ items, unit, icon: Icon }: { items: { id: string; title: string; count: number }[]; unit: string; icon: LucideIcon }) {
  return (
    <ol className="divide-y divide-slate-100">
      {items.map((p, idx) => (
        <li key={p.id}>
          <AdminOpenButton action="edit-property" propertyId={p.id}
            className="adm-press flex min-h-11 w-full items-center gap-3 rounded-lg py-2 text-left text-sm hover:bg-slate-50 sm:px-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#092A5E]/10 text-xs font-bold text-[#092A5E]">{idx + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-[#092A5E]">{p.title}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-slate-600"><Icon size={14} aria-hidden />{p.count} {unit}</span>
          </AdminOpenButton>
        </li>
      ))}
    </ol>
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
  const max = Math.max(...s.leadsByWeek.map((x) => x.count), 1);
  return (
    <>
      <section className="adm-rise relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#092A5E] via-[#0c3678] to-[#1769AA] p-5 text-white shadow-[0_16px_32px_-20px_rgb(9_42_94/0.7)] sm:p-6">
        <div className="relative z-10 max-w-md">
          <h1 className="text-2xl font-extrabold tracking-tight">Painel</h1>
          <p className="mt-1 text-sm text-white/80">Indicadores reais da sua operação.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminOpenButton action="new-property" className={linkButton("primary")}><Plus size={16} aria-hidden /> Novo imóvel</AdminOpenButton>
            <AdminOpenButton action="properties" className={cx(linkButton("outline"), "border-white/30 bg-white/10 text-white hover:bg-white/20")}><Building2 size={16} aria-hidden /> Imóveis</AdminOpenButton>
            <AdminOpenButton action="leads" className={cx(linkButton("outline"), "border-white/30 bg-white/10 text-white hover:bg-white/20")}><Users size={16} aria-hidden /> Interessados</AdminOpenButton>
            <AdminOpenButton action="visits" className={cx(linkButton("outline"), "border-white/30 bg-white/10 text-white hover:bg-white/20")}><CalendarDays size={16} aria-hidden /> Agenda</AdminOpenButton>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/magalhaes/rosto/01_sorrindo_oculos.png" alt="" width={120} height={120} loading="lazy"
          className="pointer-events-none absolute -bottom-3 right-2 hidden h-32 w-32 object-contain sm:block" />
      </section>

      {empty && (
        <div className="mb-5">
          <EmptyState
            image="/magalhaes/rosto/06_chaves_do_imovel.png"
            title="Você ainda não cadastrou imóveis"
            text="Cadastre o primeiro imóvel com fotos e publique para ele aparecer no site e ser recomendado pela IA."
            action={<AdminOpenButton action="new-property" className={linkButton()}>Cadastrar primeiro imóvel</AdminOpenButton>}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi i={0} action="properties" icon={Building2} tone="navy" label="Imóveis cadastrados" value={s.totalProperties} />
        <Kpi i={1} action="properties" icon={CheckCircle2} tone="green" label="Disponíveis" value={s.published} hint="publicados no site" />
        <Kpi i={2} action="properties" icon={Flame} tone="orange" label="Reservados / vendidos" value={s.reservedOrSold} />
        <Kpi i={3} action="leads" icon={Users} tone="blue" label="Novos interessados" value={s.newLeads} />
        <Kpi i={4} action="leads" icon={MessageCircle} tone="orange" label="Em atendimento" value={s.leadsInProgress} />
        <Kpi i={5} action="leads" icon={TrendingUp} tone="navy" label="Leads (30 dias)" value={s.leadsLast30d} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Imóveis mais vistos">
          {s.mostViewed.length ? <Ranking items={s.mostViewed} unit="visualizações" icon={Eye} /> : <p className="text-sm text-slate-500">Ainda não há visualizações registradas.</p>}
        </Card>
        <Card title="Mais demonstrações de interesse">
          {s.mostInterest.length ? <Ranking items={s.mostInterest} unit="interessados" icon={Users} /> : <p className="text-sm text-slate-500">Ainda não há interessados vinculados a imóveis.</p>}
        </Card>
        <Card title="Leads por período (últimas semanas)" className="lg:col-span-2">
          {s.leadsByWeek.some((w) => w.count > 0) ? (
            <div className="flex h-36 items-end gap-2" role="img" aria-label="Leads por semana">
              {s.leadsByWeek.map((w, idx) => (
                <div key={w.week} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-semibold tabular-nums text-[#092A5E]">{w.count}</span>
                  <div className="adm-grow w-full rounded-t-md bg-gradient-to-t from-[#1769AA] to-[#3b8fd0]" style={{ height: `${Math.max((w.count / max) * 100, 4)}%`, ["--i" as string]: idx }} />
                  <span className="text-[10px] text-slate-500">{w.week}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">Nenhum lead registrado no período.</p>}
        </Card>
      </div>
    </>
  );
}
