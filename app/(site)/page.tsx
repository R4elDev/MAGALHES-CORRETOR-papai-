import { QuickSearch } from "@/components/search/quick-search";
import { About } from "@/components/site/home/about";
import { Catalog } from "@/components/site/home/catalog";
import { ContactBand, HowBand, VisitBand } from "@/components/site/home/bands";
import { Faq } from "@/components/site/home/contact-faq";
import { Hero } from "@/components/site/home/hero";
import { listAvailableCities } from "@/lib/search/source";
import { loadList, loadSettings } from "@/lib/site/data";
import { phoneOf } from "@/lib/site/format";
import { parseCatalogParams, type SP } from "@/lib/site/params";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { filters, sort, page, filtered } = parseCatalogParams(sp);

  const [{ data: settings }, { data: list, error }, cities] = await Promise.all([
    loadSettings(),
    loadList(filters, page, sort),
    listAvailableCities().catch(() => [] as string[]),
  ]);
  const wa = buildWhatsAppLink(phoneOf(settings), settings?.default_message ?? undefined);

  return (
    <>
      <Hero title={settings?.hero_title ?? null} subtitle={settings?.hero_subtitle ?? null} whatsappHref={wa} />

      <section id="busca" aria-labelledby="busca-titulo" className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 md:-mt-14">
        <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_18px_50px_rgba(9,42,94,0.16)] sm:p-6">
          <h2 id="busca-titulo" className="mb-4 text-lg font-extrabold text-navy sm:text-xl">
            Conta pra gente o que você procura. O Magalhães te ajuda a encontrar.
          </h2>
          <QuickSearch cities={cities} />
        </div>
      </section>

      <Catalog
        sp={sp}
        filters={filters}
        sort={sort}
        page={page}
        filtered={filtered}
        items={list.items}
        total={list.total}
        hasMore={list.hasMore}
        error={error}
        settings={settings}
        whatsappHref={wa}
      />
      <HowBand />
      <VisitBand whatsappHref={wa} />
      <About settings={settings} />
      <ContactBand settings={settings} whatsappHref={wa} />
      <Faq />
    </>
  );
}
