"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { addLeadNote, changeLeadStatus, confirmLeadContact } from "@/lib/admin/actions/leads";
import { CONTACT_KIND_LABEL, LEAD_STATUSES, LEAD_STATUS_LABEL, type LeadStatusValue } from "@/lib/admin/constants";
import { brl, dateBR, dateTimeBR } from "@/lib/admin/format";
import { AdminDialog } from "./admin-dialog";
import { Badge, Button, EmptyState, Field, Select, Textarea, chipClass } from "./ui";
import { Feedback, useAction } from "./use-action";

export type LeadRow = {
  id: string; name: string | null; phone: string | null; status: LeadStatusValue; source: string | null;
  contactKind: "click" | "confirmed" | "manual"; createdAt: string; propertyTitle: string | null; region: string | null;
  budget: number | null; income: string | null; preferences: string | null; nextContactAt: string | null; whatsappHref: string | null;
};
const SOURCE: Record<string, string> = { property: "Imóvel", search: "Busca", search_no_results: "Busca sem resultado", chat: "Chat IA", admin: "Cadastro manual" };
const kindTone = (k: LeadRow["contactKind"]) => (k === "confirmed" ? "green" : k === "manual" ? "blue" : "gray");

function Avatar({ name }: { name: string | null }) {
  return <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#092A5E]/10 text-sm font-bold text-[#092A5E]">{(name?.trim()[0] ?? "?").toUpperCase()}</span>;
}

function LeadDetail({ lead, onChanged }: { lead: LeadRow; onChanged: () => void }) {
  const { pending, message, fieldErrors, run } = useAction();
  const [note, setNote] = useState("");
  // Otimismo: reflete a mudança na hora; vale só enquanto o dado do servidor ainda é o de origem.
  const [ov, setOv] = useState<{ status?: [LeadStatusValue, LeadStatusValue]; kind?: [LeadRow["contactKind"], LeadRow["contactKind"]] }>({});
  const status = ov.status && ov.status[0] === lead.status ? ov.status[1] : lead.status;
  const kind = ov.kind && ov.kind[0] === lead.contactKind ? ov.kind[1] : lead.contactKind;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={kindTone(kind)}>{CONTACT_KIND_LABEL[kind]}</Badge>
        <span className="text-xs text-slate-500">{dateBR(lead.createdAt)} · {SOURCE[lead.source ?? ""] ?? lead.source ?? "Origem desconhecida"}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {lead.phone && <><dt className="text-slate-500">Telefone</dt><dd>{lead.phone}</dd></>}
        {lead.propertyTitle && <><dt className="text-slate-500">Imóvel</dt><dd>{lead.propertyTitle}</dd></>}
        {lead.region && <><dt className="text-slate-500">Região</dt><dd>{lead.region}</dd></>}
        {lead.budget != null && <><dt className="text-slate-500">Orçamento</dt><dd>{brl(lead.budget)}</dd></>}
        {lead.income != null && <><dt className="text-slate-500">Renda declarada</dt><dd>{lead.income}</dd></>}
        {lead.nextContactAt && <><dt className="text-slate-500">Próximo contato</dt><dd>{dateTimeBR(lead.nextContactAt)}</dd></>}
      </dl>
      {lead.preferences && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{lead.preferences}</p>}

      <Field label="Etapa do funil">
        <Select value={status} disabled={pending}
          onChange={(e) => {
            const to = e.target.value as LeadStatusValue;
            setOv((o) => ({ ...o, status: [lead.status, to] }));
            run(() => changeLeadStatus({ id: lead.id, status: to }), onChanged);
          }}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
        </Select>
      </Field>

      {kind === "click" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-700">Este contato veio de um clique no WhatsApp. Confirme apenas depois de ter conversado com a pessoa.</p>
          <Button variant="outline" className="mt-2" loading={pending} onClick={() => {
            setOv((o) => ({ ...o, kind: [lead.contactKind, "confirmed"] }));
            run(() => confirmLeadContact({ leadId: lead.id }), onChanged);
          }}>Confirmar contato</Button>
        </div>
      )}

      {lead.whatsappHref && (
        <a href={lead.whatsappHref} target="_blank" rel="noopener noreferrer"
          className="adm-press inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-[#06361a]">
          <MessageCircle size={16} aria-hidden /> Abrir WhatsApp
        </a>
      )}

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <Field label="Nova observação interna" error={fieldErrors.note}>
          <Textarea value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button disabled={!note.trim()} loading={pending} onClick={() => run(() => addLeadNote({ leadId: lead.id, note }), () => { setNote(""); onChanged(); })}>Salvar observação</Button>
      </div>
      <Feedback message={message} />
    </div>
  );
}

export function LeadList({ leads, onChanged }: { leads: LeadRow[]; onChanged?: () => void }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null); // mantém o conteúdo durante a animação de saída
  const [filter, setFilter] = useState<LeadStatusValue | "all">("all");
  const changed = () => { if (onChanged) onChanged(); else router.refresh(); };
  const selected = leads.find((l) => l.id === (selectedId ?? shown)) ?? null;
  const visible = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const countOf = (s: LeadStatusValue) => leads.filter((l) => l.status === s).length;

  return (
    <>
      {leads.length > 0 && (
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar por etapa">
          <button type="button" aria-pressed={filter === "all"} className={chipClass(filter === "all")} onClick={() => setFilter("all")}>Todos ({leads.length})</button>
          {LEAD_STATUSES.filter((s) => countOf(s) > 0 || filter === s).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} className={chipClass(filter === s)} onClick={() => setFilter(s)}>{LEAD_STATUS_LABEL[s]} ({countOf(s)})</button>
          ))}
        </div>
      )}
      {visible.length === 0 ? (
        <EmptyState image="/magalhaes/rosto/09_atendendo_cliente.png" title="Nenhum interessado por aqui"
          text="Quando alguém clicar em “Tenho interesse”, usar a busca ou o chat, o contato aparece nesta lista. Você também pode cadastrar manualmente." />
      ) : (
        <ul className="space-y-2">
          {visible.map((l, i) => (
            <li key={l.id} className="adm-rise" style={{ ["--i" as string]: Math.min(i, 8) }}>
              <button type="button" onClick={() => { setSelectedId(l.id); setShown(l.id); }}
                className="adm-press adm-lift adm-card flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left">
                <Avatar name={l.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-[#092A5E]">{l.name ?? "Sem nome informado"}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {[l.propertyTitle, l.region, dateBR(l.createdAt)].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="navy">{LEAD_STATUS_LABEL[l.status]}</Badge>
                    <Badge tone={kindTone(l.contactKind)}>{CONTACT_KIND_LABEL[l.contactKind]}</Badge>
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <AdminDialog
        open={selectedId !== null}
        title={selected?.name ?? "Sem nome informado"}
        description={selected?.propertyTitle ?? undefined}
        onClose={() => setSelectedId(null)}
        size="md"
      >
        {selected && <LeadDetail key={selected.id} lead={selected} onChanged={changed} />}
      </AdminDialog>
    </>
  );
}
