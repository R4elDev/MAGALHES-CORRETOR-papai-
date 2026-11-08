"use client";
import { useRouter } from "next/navigation";
import { deleteVisit, saveVisit } from "@/lib/admin/actions/visits";
import { VISIT_STATUSES, VISIT_STATUS_LABEL } from "@/lib/admin/constants";
import { dateTimeBR } from "@/lib/admin/format";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

type Visit = { id: string; propertyId: string; propertyTitle: string | null; visitorName: string | null; scheduledAt: string; notes: string | null; status: keyof typeof VISIT_STATUS_LABEL };

function Row({ v }: { v: Visit }) {
  const router = useRouter();
  const { pending, message, run } = useAction();
  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[#092A5E]">{dateTimeBR(v.scheduledAt)}</p>
        <Badge tone={v.status === "done" ? "green" : v.status === "scheduled" ? "orange" : "gray"}>{VISIT_STATUS_LABEL[v.status]}</Badge>
      </div>
      <p className="text-sm">{v.propertyTitle ?? "Imóvel"}{v.visitorName ? ` · ${v.visitorName}` : ""}</p>
      {v.notes && <p className="text-sm text-slate-600">{v.notes}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <select aria-label="Situação da visita" value={v.status} disabled={pending} className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          onChange={(e) => run(() => saveVisit({ id: v.id, propertyId: v.propertyId, visitorName: v.visitorName, notes: v.notes, scheduledAt: v.scheduledAt, status: e.target.value }), () => router.refresh())}>
          {VISIT_STATUSES.map((s) => <option key={s} value={s}>{VISIT_STATUS_LABEL[s]}</option>)}
        </select>
        <Button variant="danger" className="min-h-9 px-3" disabled={pending}
          onClick={() => { if (window.confirm("Remover esta visita?")) run(() => deleteVisit({ id: v.id }), () => router.refresh()); }}>Remover</Button>
      </div>
      <Feedback message={message} />
    </li>
  );
}

export function VisitManager({ visits, properties }: { visits: Visit[]; properties: { id: string; label: string }[] }) {
  const router = useRouter();
  const { pending, message, fieldErrors: fe, run } = useAction();
  const pendingList = visits.filter((v) => v.status === "scheduled");
  const rest = visits.filter((v) => v.status !== "scheduled");
  return (
    <div className="space-y-4">
      <Card title="Registrar visita">
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = Object.fromEntries(new FormData(form).entries());
          run(() => saveVisit({ ...f, status: "scheduled" }), () => { form.reset(); router.refresh(); });
        }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Imóvel *" error={fe.propertyId}>
              <Select name="propertyId" required defaultValue=""><option value="" disabled>Escolha…</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select>
            </Field>
            <Field label="Visitante" error={fe.visitorName}><Input name="visitorName" maxLength={120} /></Field>
            <Field label="Data e hora *" error={fe.scheduledAt}><Input name="scheduledAt" type="datetime-local" required /></Field>
          </div>
          <Field label="Observações" error={fe.notes}><Textarea name="notes" maxLength={1000} /></Field>
          <Feedback message={message} />
          <Button type="submit" disabled={pending || properties.length === 0}>{pending ? "Salvando…" : "Registrar visita"}</Button>
          {properties.length === 0 && <p className="text-sm text-slate-500">Cadastre um imóvel antes de agendar visitas.</p>}
        </form>
      </Card>
      {pendingList.length > 0 && <Card title={`Pendentes (${pendingList.length})`}><ul className="space-y-2">{pendingList.map((v) => <Row key={v.id} v={v} />)}</ul></Card>}
      {rest.length > 0 && <Card title="Histórico"><ul className="space-y-2">{rest.map((v) => <Row key={v.id} v={v} />)}</ul></Card>}
    </div>
  );
}
