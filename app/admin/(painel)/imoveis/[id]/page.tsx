import { notFound } from "next/navigation";
import { z } from "zod";
import { getAdminProperty } from "@/lib/admin/queries";
import { PageHeader, ErrorState } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";
import { ImageManager } from "@/components/admin/image-manager";

export const metadata = { title: "Editar imóvel — Admin Magalhães" };

export default async function EditarImovel({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const { id } = await params;
  const { novo } = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  let data;
  try {
    data = await getAdminProperty(id);
  } catch {
    return <ErrorState message="Não consegui carregar este imóvel. Tente novamente." />;
  }
  if (!data.property) notFound();
  const p = data.property;
  const initial = {
    id: p.id, code: p.code, title: p.title, description: p.description, type: p.type, purpose: p.purpose, price: p.price,
    condoFee: p.condo_fee, iptu: p.iptu, areaUseful: p.area_useful, areaTotal: p.area_total,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, suites: p.suites, parking: p.parking,
    city: p.city, state: p.state, neighborhood: p.neighborhood, address: p.address, hideAddress: p.hide_address,
    latitude: p.latitude, longitude: p.longitude, status: p.status, featured: p.featured,
    featureIds: (p.feature_ids ?? []) as string[],
  };
  return (
    <>
      <PageHeader title={p.title} subtitle={novo ? "Imóvel criado. Agora adicione as fotos e publique." : `Código ${p.code}`} />
      <div className="space-y-4">
        <ImageManager propertyId={p.id} images={data.images.map((i) => ({ id: i.id, url: i.url ?? "", is_cover: !!i.is_cover }))} />
        <PropertyForm initial={initial} features={data.allFeatures.map((f) => ({ id: f.id, name: f.name }))} />
      </div>
    </>
  );
}
