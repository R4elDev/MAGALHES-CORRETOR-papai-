import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/types/db";
import { Reveal } from "./reveal";

/* Fundo das poses originais (RGB 254,254,254): o painel usa a mesma cor, então a arte emenda sem "caixa branca". */
const ART_BG = "#fefefe";

function Art({ src, alt, from }: { src: string; alt: string; from: "left" | "right" }) {
  return (
    <Reveal from={from} className="md:h-full">
      <div className="relative h-[22rem] sm:h-[26rem] md:h-full md:min-h-[30rem]" style={{ background: ART_BG }}>
        <div className="absolute inset-x-0 bottom-0 top-6">
          <Image src={src} alt={alt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-contain object-bottom" />
        </div>
      </div>
    </Reveal>
  );
}

const STEPS = [
  { n: "01", title: "Conte o que procura", text: "Região, quanto pretende investir, tipo de imóvel e quartos. Leva menos de um minuto e não pede cadastro." },
  { n: "02", title: "Veja o que combina", text: "Mostramos só imóveis realmente cadastrados e disponíveis. Quando algo não atende a tudo, avisamos o que ficou de fora." },
  { n: "03", title: "Fale com o Magalhães", text: "Envie suas preferências pelo WhatsApp, com a mensagem já pronta, e converse direto com ele." },
];

/** Faixa NAVY — arte à direita (Magalhães com a casa na mão). */
export function HowBand() {
  return (
    <section id="como-funciona" className="mt-24 bg-navy text-white md:bg-[linear-gradient(to_right,#092a5e_50%,#fefefe_50%)]">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="px-4 py-14 md:py-20 md:pr-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Como funciona</p>
            <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Do que você procura à conversa certa.</h2>
          </Reveal>
          <ol className="mt-8 divide-y divide-white/15 border-y border-white/15">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 70} className="grid grid-cols-[3rem_1fr] gap-x-4 py-5">
                  <span className="font-display text-3xl font-extrabold leading-none text-orange">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="mt-1 text-pretty text-white/75">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
        <Art src="/magalhaes/corpo/pose-05.webp" alt="Magalhães segurando uma casa na mão" from="right" />
      </div>
    </section>
  );
}

/** Faixa LARANJA — arte à esquerda (chaves). Texto em azul-marinho para contraste. */
export function VisitBand({ whatsappHref }: { whatsappHref: string | null }) {
  return (
    <section id="visita" className="bg-orange text-navy-deep md:bg-[linear-gradient(to_right,#fefefe_50%,#ff7500_50%)]">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="px-4 py-14 md:order-2 md:py-20 md:pl-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-deep/75">Visita</p>
            <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Quer ver de perto? Combine uma visita.</h2>
            <p className="mt-4 max-w-md text-pretty text-lg text-navy-deep/85">
              Escolha um imóvel do catálogo e combine dia e horário direto com o Magalhães.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-press flex h-12 items-center justify-center rounded-full bg-navy px-7 font-semibold text-white">
                  Combinar pelo WhatsApp
                </a>
              ) : (
                <Link href="/#contato" className="btn-press flex h-12 items-center justify-center rounded-full bg-navy px-7 font-semibold text-white">
                  Falar com o Magalhães
                </Link>
              )}
              <Link href="/#imoveis" className="btn-press flex h-12 items-center justify-center rounded-full border border-navy-deep/40 px-7 font-semibold text-navy-deep hover:bg-white/20">
                Ver imóveis
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="md:order-1">
          <Art src="/magalhaes/corpo/pose-02.webp" alt="Magalhães com as chaves de um imóvel" from="left" />
        </div>
      </div>
    </section>
  );
}

/** Faixa NAVY — arte à esquerda (telefone). Canais de contato. */
export function ContactBand({ settings, whatsappHref }: { settings: SiteSettings | null; whatsappHref: string | null }) {
  const social = [
    ["Instagram", settings?.instagram],
    ["Facebook", settings?.facebook],
    ["YouTube", settings?.youtube],
    ["TikTok", settings?.tiktok],
  ].filter((x): x is [string, string] => Boolean(x[1]));
  const hasChannel = Boolean(whatsappHref || settings?.email || social.length);

  return (
    <section id="contato" className="bg-navy text-white md:bg-[linear-gradient(to_right,#fefefe_50%,#092a5e_50%)]">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="px-4 py-14 md:order-2 md:py-20 md:pl-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Contato</p>
            <h2 className="mt-1 text-3xl font-extrabold md:text-4xl">Fale com o Magalhães</h2>
            <p className="mt-3 max-w-md text-pretty text-white/80">Prefere conversar? Ele atende pelo WhatsApp e responde o quanto antes.</p>
            <div className="mt-7 grid max-w-md gap-3">
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-press flex h-14 items-center justify-center rounded-full bg-whatsapp text-lg font-semibold text-white">
                  Conversar no WhatsApp
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="btn-press flex min-h-12 items-center justify-center break-all rounded-full border border-white/40 px-4 text-center font-semibold text-white hover:bg-white/10">
                  {settings.email}
                </a>
              )}
              {social.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {social.map(([label, url]) => (
                    <li key={label}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex h-11 items-center rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {!hasChannel && (
                <p className="rounded-2xl bg-white/10 p-5 text-white/85">Os canais de contato serão divulgados em breve. Enquanto isso, explore os imóveis do catálogo e veja as opções disponíveis.</p>
              )}
            </div>
            {settings?.creci && <p className="mt-6 text-sm text-white/60">CRECI {settings.creci}</p>}
          </Reveal>
        </div>
        <div className="md:order-1">
          <Art src="/magalhaes/corpo/pose-04.webp" alt="Magalhães ao telefone" from="left" />
        </div>
      </div>
    </section>
  );
}
