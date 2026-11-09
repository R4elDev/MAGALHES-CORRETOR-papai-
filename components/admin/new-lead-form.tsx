"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createLead } from "@/lib/admin/actions/leads";
import { AdminDialog } from "./admin-dialog";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

export type LeadPropertyOption = { id: string; label: string };

export function NewLeadForm({ properties, onSaved }: { properties: LeadPropertyOption[]; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0); // remonta o formulário a cada abertura (campos limpos)
  const router = useRouter();
  const formId = useId();
  const { pending, message, fieldErrors: fe, run } = useAction();
  return (
    <>
      <Button variant="outline" onClick={() => { setNonce((n) => n + 1); setOpen(true); }}>
        <UserPlus size={16} aria-hidden /> Cadastrar interessado
      </Button>
      <AdminDialog
        open={open}
        title="Cadastrar interessado"
        description="Contato registrado manualmente por você, sem nenhuma mensagem enviada ao cliente."
        onClose={() => setOpen(false)}
        busy={pending}
        size="lg"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form={formId} loading={pending}>{pending ? "Salvando…" : "Salvar interessado"}</Button>
          </div>
        }
      >
        <form key={nonce} id={formId} className="space-y-3" noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget).entries());
            run(() => createLead({ ...f, propertyId: f.propertyId || null, kind: "manual" }), () => {
              setOpen(false);
              if (onSaved) onSaved(); else router.refresh();
            });
          }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" error={fe.name}><Input name="name" maxLength={120} autoComplete="off" aria-invalid={!!fe.name} /></Field>
            <Field label="Telefone (com DDD)" error={fe.phone} hint="Ex.: 5511999999999"><Input name="phone" inputMode="tel" autoComplete="off" aria-invalid={!!fe.phone} /></Field>
            <Field label="Região desejada" error={fe.region}><Input name="region" /></Field>
            <Field label="Imóvel de interesse">
              <Select name="propertyId" defaultValue=""><option value="">Nenhum</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</Select>
            </Field>
            <Field label="Orçamento (R$)" error={fe.budget}><Input name="budget" inputMode="decimal" /></Field>
            <Field label="Renda declarada (R$)" error={fe.income}><Input name="income" inputMode="decimal" /></Field>
          </div>
          <Field label="Preferências" error={fe.preferences}><Textarea name="preferences" maxLength={1000} /></Field>
          <Feedback message={message} />
        </form>
      </AdminDialog>
    </>
  );
}
