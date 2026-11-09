import { notFound, redirect } from "next/navigation";
import { z } from "zod";
export default async function EditarImovel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  redirect(`/admin?painel=imoveis&imovel=${encodeURIComponent(id)}`);
}
