import Image from "next/image";
import Link from "next/link";
import { CatalogEmpty } from "@/components/site/catalog-empty";
import { PropertyCard } from "@/components/site/property-card";
import { loadFeatured, loadSettings } from "@/lib/site/data";
import { phoneOf } from "@/lib/site/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function HomePage() {
  const [{ data: settings }, { data: featured, error }] = await Promise.all([loadSettings(), loadFeatured(6)]);
  const wa = buildWhatsAppLink(phoneOf(settings), settings?.default_message ?? undefined);

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-12 md:grid-cols-[1.2fr_1fr] md:pt-20">
          <div className="pb-10 md:pb-20">
            <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.1] md:text-5xl">
              {settings?.hero_title ?? "Seu próximo imóvel pode estar mais perto do que você imagina."}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base text-white/80 md:text-lg">
              {settings?.hero_subtitle ??
                "Encontre casas, apartamentos e oportunidades selecionadas pelo Magalhães. Explore os imóveis disponíveis ou descubra quais combinam com você."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/imoveis" className="flex h-12 items-center justify-center rounded-full bg-orange px-7 font-semibold text-white transition-transform active:scale-[0.97]">
                Explorar imóveis
              </Link>
              <Link href="/encontre-seu-imovel" className="flex h-12 items-center justify-center rounded-full border border-white/40 px-7 font-semibold text-white transition-colors hover:bg-white/10">
                Encontrar meu imóvel ideal
              </Link>
            </div>
          </div>
          <div className="relative mx-auto h-72 w-64 self-end md:h-[26rem] md:w-80">
            <Image src="/magalhaes/corpo/pose-01.png" alt="Magalhães, corretor" fill priority sizes="(min-width: 768px) 320px, 256px" className="object-contain object-bottom" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold text-navy md:text-3xl">Imóveis em destaque</h2>
          <Link href="/imoveis" className="text-sm font-semibold text-blue hover:text-orange">Ver todos os imóveis →</Link>
        </div>
        <div className="mt-6">
          {featured.length === 0 ? (
            <CatalogEmpty error={error} whatsappHref={wa} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c, i) => (
                <PropertyCard key={c.id} card={c} settings={settings} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="grid items-center gap-6 rounded-3xl bg-surface p-6 md:grid-cols-[auto_1fr_auto] md:p-10">
          <Image src="/magalhaes/rosto/03_casa_nos_olhos.png" alt="" width={96} height={96} className="size-20 object-contain md:size-24" />
          <div>
            <h2 className="font-display text-xl font-extrabold text-navy md:text-2xl">Conta pra gente o que você procura. O Magalhães te ajuda a encontrar.</h2>
            <p className="mt-1 text-sm text-muted">Responda algumas perguntas rápidas e veja os imóveis do catálogo que combinam com você.</p>
          </div>
          <Link href="/encontre-seu-imovel" className="flex h-12 items-center justify-center rounded-full bg-navy px-7 font-semibold text-white">
            Começar
          </Link>
        </div>
      </section>
    </>
  );
}
