import { Skeleton } from "@/components/admin/ui";

// Loading compartilhado das páginas do painel: aparece na hora durante a navegação.
export default function PainelLoading() {
  return (
    <div role="status" aria-label="Carregando" className="space-y-4">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
