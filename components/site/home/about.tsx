import { CharacterBand } from "./character-band";
import type { SiteSettings } from "@/types/db";

export function About({ settings }: { settings: SiteSettings | null }) {
  const name = settings?.business_name ?? "Magalhães";
  return (
    <section id="sobre" className="mt-24 bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-[minmax(0,320px)_1fr] md:gap-14 md:py-20">
        <CharacterBand color="orange" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Sobre</p>
          <h2 className="mt-1 text-3xl font-extrabold text-navy md:text-4xl">{name}</h2>
          {settings?.creci && <p className="mt-1 text-sm text-muted">CRECI {settings.creci}</p>}
          <p className="mt-5 max-w-xl whitespace-pre-line text-pretty text-lg leading-relaxed">
            {settings?.bio ?? "Corretor de imóveis. Aqui você encontra os imóveis que ele seleciona e pode falar direto com ele, sem intermediários."}
          </p>
        </div>
      </div>
    </section>
  );
}
