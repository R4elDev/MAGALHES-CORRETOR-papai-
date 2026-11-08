"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/lib/admin/actions/leads";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

export function NewLeadForm({ properties }: { properties: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { pending, message, fieldErrors: fe, run } = useAction();
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>+ Cadastrar interessado</Button>;
  return (
    <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget).entries());
        run(() => createLead({ ...f, propertyId: f.propertyId || null, kind: "manual" }), () => { setOpen(false); router.refresh(); });
      }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" error={fe.name}><Input name="name" maxLength={120} /></Field>
        <Field label="Telefone (com DDD)" error={fe.phone} hint="Ex.: 5511999999999"><Input name="phone" inputMode="tel" /></Field>
        <Field label="Região desejada" error={fe.region}><Input name="region" /></Field>
        <Field label="Imóvel de interesse">
          <Select name="propertyId" defaultValue=""><option value="">Nenhum</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select>
        </Field>
        <Field label="Orçamento (R$)" error={fe.budget}><Input name="budget" inputMode="decimal" /></Field>
        <Field label="Renda declarada (R$)" error={fe.income}><Input name="income" inputMode="decimal" /></Field>
      </div>
      <Field label="Preferências" error={fe.preferences}><Textarea name="preferences" maxLength={1000} /></Field>
      <Feedback message={message} />
      <div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button></div>
    </form>
  );
}
