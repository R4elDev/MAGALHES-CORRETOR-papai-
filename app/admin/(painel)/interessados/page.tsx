import Link from "next/link";
import { listAdminLeads, propertyOptions } from "@/lib/admin/queries";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatusValue } from "@/lib/admin/constants";
import { EmptyState, ErrorState, PageHeader, cx } from "@/components/admin/ui";
import { LeadList } from "@/components/admin/lead-list";
import { NewLeadForm } from "@/components/admin/new-lead-form";
import { buildWhatsAppLink, messageForLeadFollowUp } from "@/lib/whatsapp";

export const metadata = { title: "Interessados — Admin Magalhães" };

export default async function Interessados({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = LEAD_STATUSES.includes(sp.status as LeadStatusValue) ? (sp.status as LeadStatusValue) : undefined;
  let res, props;
  try {
    [res, props] = await Promise.all([listAdminLeads({ status, page: Number(sp.page) || 1 }), propertyOptions()]);
  } catch {
    return (<><PageHeader title="Interessados" /><ErrorState message="Não consegui carregar os interessados. Atualize a página." /></>);
  }
  const chip = (a: boolean) => cx("inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium",
    a ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-300 bg-white text-slate-700");
  const rows = res.items.map((l) => ({
    id: l.id, name: l.name ?? null, phone: l.phone ?? null, status: l.status as LeadStatusValue,
    source: l.source ?? null, contactKind: l.contact_kind ?? "click", createdAt: l.created_at,
    propertyTitle: l.property_title ?? null, region: l.region ?? null, budget: l.budget ?? null, income: l.income ?? null,
    preferences: l.preferences ?? null, nextContactAt: l.next_contact_at ?? null,
    // Link só existe se houver telefone válido (helper retorna null caso contrário).
    whatsappHref: l.phone ? buildWhatsAppLink(l.phone, messageForLeadFollowUp({ name: l.name ?? undefined, propertyTitle: l.property_title ?? undefined })) : null,
  }));
  return (
    <>
      <PageHeader title="Interessados" subtitle="Cliques no WhatsApp não são contatos confirmados até você confirmar." />
      <NewLeadForm properties={props} />
      <div className="my-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/interessados" className={chip(!status)}>Todos</Link>
        {LEAD_STATUSES.map((s) => <Link key={s} href={`/admin/interessados?status=${s}`} className={chip(status === s)}>{LEAD_STATUS_LABEL[s]}</Link>)}
      </div>
      {rows.length === 0 ? (
        <EmptyState image="/magalhaes/rosto/09_atendendo_cliente.png" title="Nenhum interessado por aqui"
          text="Quando alguém clicar em “Tenho interesse”, usar a busca ou o chat, o contato aparece nesta lista. Você também pode cadastrar manualmente." />
      ) : <LeadList leads={rows} />}
    </>
  );
}
