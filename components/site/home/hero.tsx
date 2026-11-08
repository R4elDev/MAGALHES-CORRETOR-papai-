import Image from "next/image";
import Link from "next/link";

export function Hero({ title, subtitle, whatsappHref }: { title: string | null; subtitle: string | null; whatsappHref: string | null }) {
  const headline = title ?? "Seu novo lar começa com uma boa conversa.";
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-navy text-white">
      {/* Banner ilustrativo (não é um imóvel anunciado). Desktop: fundo da seção, copy sobre a área azul à esquerda.
          Mobile: faixa própria abaixo do texto, recortada à direita para manter o rosto visível. */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-10 md:flex md:min-h-[34rem] md:items-center md:pb-24 md:pt-16 lg:min-h-[38rem]">
        <div className="md:w-[48%]">
          <p className="rise mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
            <span className="h-px w-8 bg-orange" aria-hidden />
            Imóveis selecionados pelo Magalhães
          </p>
          <h1 className="rise text-[clamp(2.4rem,9vw,4.2rem)] font-extrabold leading-[1.04] tracking-tight">{headline}</h1>
          <p className="rise rise-2 mt-5 max-w-lg text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
            {subtitle ??
              "Casas e apartamentos selecionados pelo Magalhães. Explore o catálogo ou conte o que procura."}
          </p>
          <div className="rise rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/#imoveis" className="btn-press flex h-12 items-center justify-center rounded-full bg-orange px-7 font-semibold text-white">
              Explorar imóveis
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press flex h-12 items-center justify-center rounded-full border border-white/40 px-7 font-semibold text-white hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            ) : (
              <Link href="/#busca" className="btn-press flex h-12 items-center justify-center rounded-full border border-white/40 px-7 font-semibold text-white hover:bg-white/10">
                Encontrar meu imóvel ideal
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-[21rem] sm:h-[26rem] md:absolute md:inset-0 md:z-0 md:h-auto">
        <Image
          src="/magalhaes/banner-hero-v2.webp"
          alt="Magalhães apresentando uma casa contemporânea ao entardecer (imagem ilustrativa)"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_18%] md:object-[center_18%]"
        />
        {/* funde o topo da arte com o azul do texto no mobile */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-navy to-transparent md:hidden" aria-hidden />
      </div>

      {/* espaço para a busca sobrepor o fim do herói */}
      <div className="relative z-10 h-10 md:h-12" aria-hidden />
    </section>
  );
}
