"use client";
import { useRouter } from "next/navigation";
import { changePropertyStatus, deleteProperty, toggleFeatured } from "@/lib/admin/actions/properties";
import { PROPERTY_STATUSES, PROPERTY_STATUS_LABEL, type PropertyStatusValue } from "@/lib/admin/constants";
import { Button } from "./ui";
import { Feedback, useAction } from "./use-action";

export function PropertyRowActions({ id, status, featured }: { id: string; status: PropertyStatusValue; featured: boolean }) {
  const { pending, message, run } = useAction();
  const router = useRouter();
  const done = () => router.refresh();
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Situação" value={status} disabled={pending} className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          onChange={(e) => run(() => changePropertyStatus({ id, status: e.target.value }), done)}>
          {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{PROPERTY_STATUS_LABEL[s]}</option>)}
        </select>
        <Button variant="outline" className="min-h-9 px-3" disabled={pending} onClick={() => run(() => toggleFeatured({ id, featured: !featured }), done)}>
          {featured ? "Remover destaque" : "Destacar"}
        </Button>
        <Button variant="danger" className="min-h-9 px-3" disabled={pending}
          onClick={() => { if (window.confirm("Excluir este imóvel e suas fotos? Esta ação não pode ser desfeita.")) run(() => deleteProperty({ id }), done); }}>
          Excluir
        </Button>
      </div>
      <Feedback message={message} />
    </div>
  );
}
