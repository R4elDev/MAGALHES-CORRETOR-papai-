import { getFeatureCatalog } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";

export const metadata = { title: "Novo imóvel — Admin Magalhães" };

export default async function NovoImovel() {
  const features = await getFeatureCatalog().catch(() => []);
  return (
    <>
      <PageHeader title="Novo imóvel" subtitle="Salve primeiro; depois você adiciona as fotos." />
      <PropertyForm features={features} />
    </>
  );
}
