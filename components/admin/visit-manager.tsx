"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronRight, Trash2 } from "lucide-react";
import { deleteVisit, saveVisit } from "@/lib/admin/actions/visits";
import { VISIT_STATUSES, VISIT_STATUS_LABEL } from "@/lib/admin/constants";
import { dateTimeBR } from "@/lib/admin/format";
import { AdminDialog } from "./admin-dialog";
import { Badge, Button, EmptyState, Field, Input, Select, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

export type Visit = { id: string; propertyId: string; propertyTitle: string | null; visitorName: string | null; scheduledAt: string; notes: string | null; status: keyof typeof VISIT_STATUS_LABEL };
export type VisitPropertyOption = { id: string; label: string };

/** ISO -> valor de <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const tone = (s: Visit["status"]) => (s === "done" ? "green" : s === "scheduled" ? "orange" : "gray");

type Dlg = { visit: Visit | null; nonce: number };

export function VisitManager({ visits, properties, onChanged }: { visits: Visit[]; properties: VisitPropertyOption[]; onChanged?: () => void }) {
  const router = useRouter();
  const formId = useId();
  const { pending, message, fieldErrors: fe, run } = useAction();
  const [dlg, setDlg] = useState<Dlg | null>(null); // conteúdo do dialog (permanece durante a saída)
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const changed = () => { if (onChanged) onChanged(); else router.refresh(); };
  const openDialog = (visit: Visit | null) => { setDlg((d) => ({ visit, nonce: (d?.nonce ?? 0) + 1 })); setConfirming(false); setOpen(true); };
  const close = () => setOpen(false);

  const scheduled = visits.filter((v) => v.status === "scheduled");
  const rest = visits.filter((v) => v.status !== "scheduled");
  const editing = dlg?.visit ?? null;

  const list = (items: Visit[]) => (
    <ul className="space-y-2">
      {items.map((v, i) => (
        <li key={v.id} className="adm-rise" style={{ ["--i" as string]: Math.min(i, 8) }}>
          <button type="button" onClick={() => openDialog(v)} className="adm-press adm-lift adm-card flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left">
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#092A5E]">{dateTimeBR(v.scheduledAt)}</span>
                <Badge tone={tone(v.status)}>{VISIT_STATUS_LABEL[v.status]}</Badge>
              </span>
              <span className="block truncate text-sm">{v.propertyTitle ?? "Imóvel"}{v.visitorName ? ` · ${v.visitorName}` : ""}</span>
              {v.notes && <span className="block truncate text-xs text-slate-500">{v.notes}</span>}
            </span>
            <ChevronRight size={18} aria-hidden className="shrink-0 text-slate-400" />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => openDialog(null)} disabled={properties.length === 0}><CalendarPlus size={16} aria-hidden /> Agendar visita</Button>
      </div>
      {properties.length === 0 && <p className="text-sm text-slate-500">Cadastre um imóvel antes de agendar visitas.</p>}

      {visits.length === 0 ? (
        <EmptyState image="/magalhaes/rosto/05_piscadinha.png" title="Nenhuma visita registrada" text="Toque em “Agendar visita” para registrar a primeira." />
      ) : (
        <>
          {scheduled.length > 0 && <section><h2 className="mb-2 text-sm font-bold text-[#092A5E]">Pendentes ({scheduled.length})</h2>{list(scheduled)}</section>}
          {rest.length > 0 && <section><h2 className="mb-2 text-sm font-bold text-[#092A5E]">Histórico</h2>{list(rest)}</section>}
        </>
      )}

      <AdminDialog
        open={open}
        title={confirming ? "Remover visita?" : editing ? "Editar visita" : "Agendar visita"}
        description={confirming ? undefined : editing?.propertyTitle ?? undefined}
        onClose={close}
        onBack={confirming ? () => setConfirming(false) : undefined}
        backLabel="Voltar para a visita"
        busy={pending}
        size="md"
        footer={confirming ? (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={pending} onClick={() => setConfirming(false)}>Manter visita</Button>
            <Button variant="solidDanger" loading={pending} onClick={() => editing && run(() => deleteVisit({ id: editing.id }), () => { close(); changed(); })}>
              <Trash2 size={16} aria-hidden /> Remover visita
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {editing ? <Button variant="danger" disabled={pending} onClick={() => setConfirming(true)}><Trash2 size={16} aria-hidden /> Remover</Button> : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" disabled={pending} onClick={close}>Cancelar</Button>
              <Button type="submit" form={formId} loading={pending}>{pending ? "Salvando…" : editing ? "Salvar alterações" : "Agendar visita"}</Button>
            </div>
          </div>
        )}
      >
        {confirming && editing && (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">Você vai remover a visita de <strong>{dateTimeBR(editing.scheduledAt)}</strong>{editing.visitorName ? ` com ${editing.visitorName}` : ""}. Essa ação não pode ser desfeita.</p>
            <Feedback message={message} />
          </div>
        )}
        {/* Sempre montado (só oculto na confirmação): voltar preserva o que foi digitado. */}
        {(
          <form key={dlg?.nonce ?? 0} id={formId} hidden={confirming} className="space-y-3" noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget).entries());
              run(() => saveVisit({ ...f, ...(editing ? { id: editing.id } : {}) }), () => { close(); changed(); });
            }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Imóvel *" error={fe.propertyId}>
                <Select name="propertyId" required defaultValue={editing?.propertyId ?? ""} aria-invalid={!!fe.propertyId}>
                  <option value="" disabled>Escolha…</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </Select>
              </Field>
              <Field label="Visitante" error={fe.visitorName}><Input name="visitorName" maxLength={120} defaultValue={editing?.visitorName ?? ""} /></Field>
              <Field label="Data e hora *" error={fe.scheduledAt}><Input name="scheduledAt" type="datetime-local" required defaultValue={editing ? toLocalInput(editing.scheduledAt) : ""} aria-invalid={!!fe.scheduledAt} /></Field>
              <Field label="Situação" error={fe.status}>
                <Select name="status" defaultValue={editing?.status ?? "scheduled"}>
                  {VISIT_STATUSES.map((s) => <option key={s} value={s}>{VISIT_STATUS_LABEL[s]}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Observações" error={fe.notes}><Textarea name="notes" maxLength={1000} defaultValue={editing?.notes ?? ""} /></Field>
            <Feedback message={message} />
          </form>
        )}
      </AdminDialog>
    </div>
  );
}
