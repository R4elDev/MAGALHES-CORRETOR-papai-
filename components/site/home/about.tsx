import Image from "next/image";
import type { SiteSettings } from "@/types/db";
import { Reveal } from "./reveal";

/** Seção branca — arte à direita (aperto de mão). O fundo da pose é o mesmo da seção, sem caixa visível. */
export function About({ settings }: { settings: SiteSettings | null }) {
  const name = settings?.business_name ?? "Magalhães";
  return (
    <section id="sobre" className="bg-[#fefefe]">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2 md:items-center">
        <div className="px-4 py-14 md:py-20 md:pr-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Sobre</p>
            <h2 className="mt-1 text-3xl font-extrabold text-navy md:text-4xl">{name}</h2>
            {settings?.creci && <p className="mt-1 text-sm text-muted">CRECI {settings.creci}</p>}
            <p className="mt-5 max-w-md whitespace-pre-line text-pretty text-lg leading-relaxed">
              {settings?.bio ?? "Corretor de imóveis. Aqui você encontra os imóveis que ele seleciona e pode falar direto com ele, sem intermediários."}
            </p>
          </Reveal>
        </div>
        <Reveal from="right">
          <div className="relative h-[22rem] sm:h-[26rem] md:h-[34rem]">
            <div className="absolute inset-x-0 bottom-0 top-4">
              <Image src="/magalhaes/corpo/pose-07.webp" alt="Magalhães estendendo a mão para cumprimentar" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-contain object-bottom" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
