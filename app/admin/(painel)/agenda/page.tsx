import { listAdminVisits, propertyOptions } from "@/lib/admin/queries";
import { EmptyState, ErrorState, PageHeader } from "@/components/admin/ui";
import { VisitManager } from "@/components/admin/visit-manager";

export const metadata = { title: "Agenda — Admin Magalhães" };

export default async function Agenda() {
  let visits, props;
  try {
    [visits, props] = await Promise.all([listAdminVisits({}), propertyOptions()]);
  } catch {
    return (<><PageHeader title="Agenda de visitas" /><ErrorState message="Não consegui carregar a agenda. Atualize a página." /></>);
  }
  const rows = visits.items.map((v) => ({
    id: v.id, propertyId: v.property_id, propertyTitle: v.property_title ?? null, visitorName: v.visitor_name ?? null,
    scheduledAt: v.scheduled_at, notes: v.notes ?? null, status: v.status,
  }));
  return (
    <>
      <PageHeader title="Agenda de visitas" subtitle="Registre e acompanhe visitas pendentes e realizadas." />
      <VisitManager visits={rows} properties={props} />
      {rows.length === 0 && (
        <div className="mt-4"><EmptyState image="/magalhaes/rosto/05_piscadinha.png" title="Nenhuma visita registrada" text="Use o formulário acima para registrar a primeira visita." /></div>
      )}
    </>
  );
}
