import type { Metadata } from "next";
import { SearchWizard } from "@/components/search/search-wizard";
import { listAvailableCities } from "@/lib/search/source";

export const metadata: Metadata = {
  title: "Encontre seu imóvel",
  description: "Responda algumas perguntas e veja os imóveis disponíveis que combinam com você.",
};
export const dynamic = "force-dynamic"; // cidades vêm do banco real

export default async function Page() {
  const cities = await listAvailableCities().catch(() => [] as string[]);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Encontre seu imóvel</h1>
      <p className="mt-1 text-sm text-muted">Leva menos de um minuto. Só mostramos imóveis realmente disponíveis.</p>
      <SearchWizard cities={cities} />
    </main>
  );
}
