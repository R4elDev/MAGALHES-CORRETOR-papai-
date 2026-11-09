"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDialog } from "./admin-dialog";
import { changePropertyStatus, deleteProperty, toggleFeatured } from "@/lib/admin/actions/properties";
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, type PropertyStatusValue } from "@/lib/admin/constants";
import { Button } from "./ui";
import { Feedback, useAction } from "./use-action";

export function PropertyRowActions({ id, status, featured, onChanged }: { id: string; status: PropertyStatusValue; featured: boolean; onChanged?: () => void }) {
  const { pending, message, run } = useAction();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done = () => onChanged ? onChanged() : router.refresh();
  return <div className="mt-3 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Situação do imóvel" value={status} disabled={pending} className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm" onChange={(event) => run(() => changePropertyStatus({ id, status: event.target.value }), done)}>
        {PROPERTY_STATUSES.map((value) => <option key={value} value={value}>{PROPERTY_STATUS_LABEL[value]}</option>)}
      </select>
      <Button variant="outline" disabled={pending} onClick={() => run(() => toggleFeatured({ id, featured: !featured }), done)}>{featured ? "Remover destaque" : "Destacar"}</Button>
      <Button variant="danger" disabled={pending} onClick={() => setConfirmDelete(true)}>Excluir</Button>
    </div>
    <Feedback message={message} />
    <AdminDialog open={confirmDelete} title="Excluir imóvel?" description="Esta ação não pode ser desfeita. O imóvel e suas fotos serão removidos do catálogo." onClose={() => setConfirmDelete(false)} busy={pending} size="md">
      <div className="flex flex-wrap gap-2"><Button variant="danger" disabled={pending} onClick={() => run(() => deleteProperty({ id }), () => { setConfirmDelete(false); done(); })}>Excluir imóvel</Button><Button variant="outline" disabled={pending} onClick={() => setConfirmDelete(false)}>Cancelar</Button></div><Feedback message={message} />
    </AdminDialog>
  </div>;
}
