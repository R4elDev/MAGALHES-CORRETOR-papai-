"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLeadNote, changeLeadStatus, confirmLeadContact } from "@/lib/admin/actions/leads";
import { CONTACT_KIND_LABEL, LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatusValue } from "@/lib/admin/constants";
import { brl, dateBR, dateTimeBR } from "@/lib/admin/format";
import { Badge, Button, Field, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

export type LeadRow = {
  id: string; name: string | null; phone: string | null; status: LeadStatusValue; source: string | null;
  contactKind: "click" | "confirmed" | "manual"; createdAt: string; propertyTitle: string | null; region: string | null;
  budget: number | null; income: number | null; preferences: string | null; nextContactAt: string | null; whatsappHref: string | null;
};
const SOURCE: Record<string, string> = { property: "Imóvel", search: "Busca", search_no_results: "Busca sem resultado", chat: "Chat IA", admin: "Cadastro manual" };

function LeadCard({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const { pending, message, fieldErrors, run } = useAction();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const refresh = () => router.refresh();
  const tone = lead.contactKind === "confirmed" ? "green" : lead.contactKind === "manual" ? "blue" : "gray";
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-[#092A5E]">{lead.name ?? "Sem nome informado"}</p>
          <p className="text-xs text-slate-500">{dateBR(lead.createdAt)} · {SOURCE[lead.source ?? ""] ?? lead.source ?? "Origem desconhecida"}</p>
        </div>
        <Badge tone={tone}>{CONTACT_KIND_LABEL[lead.contactKind]}</Badge>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {lead.propertyTitle && <><dt className="text-slate-500">Imóvel</dt><dd className="truncate">{lead.propertyTitle}</dd></>}
        {lead.region && <><dt className="text-slate-500">Região</dt><dd>{lead.region}</dd></>}
        {lead.budget != null && <><dt className="text-slate-500">Orçamento</dt><dd>{brl(lead.budget)}</dd></>}
        {lead.income != null && <><dt className="text-slate-500">Renda declarada</dt><dd>{brl(lead.income)}</dd></>}
        {lead.nextContactAt && <><dt className="text-slate-500">Próximo contato</dt><dd>{dateTimeBR(lead.nextContactAt)}</dd></>}
      </dl>
      {lead.preferences && <p className="mt-2 text-sm text-slate-700">{lead.preferences}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select aria-label="Status do funil" value={lead.status} disabled={pending} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          onChange={(e) => run(() => changeLeadStatus({ id: lead.id, status: e.target.value }), refresh)}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
        </select>
        {lead.whatsappHref && (
          <a href={lead.whatsappHref} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-[#06361a]">WhatsApp</a>
        )}
        {lead.contactKind === "click" && (
          <Button variant="outline" className="min-h-10" disabled={pending} onClick={() => run(() => confirmLeadContact({ leadId: lead.id }), refresh)}>
            Confirmar contato
          </Button>
        )}
        <Button variant="ghost" className="min-h-10" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Fechar" : "Observações"}</Button>
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <Field label="Nova observação interna" error={fieldErrors.note}>
            <Textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button disabled={pending || !note.trim()} onClick={() => run(() => addLeadNote({ leadId: lead.id, note }), () => { setNote(""); refresh(); })}>Salvar observação</Button>
        </div>
      )}
      <div className="mt-2"><Feedback message={message} /></div>
    </li>
  );
}

export function LeadList({ leads }: { leads: LeadRow[] }) {
  return <ul className="space-y-3">{leads.map((l) => <LeadCard key={l.id} lead={l} />)}</ul>;
}
