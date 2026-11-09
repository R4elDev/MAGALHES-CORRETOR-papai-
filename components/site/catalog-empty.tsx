import Image from "next/image";
import Link from "next/link";

export function CatalogEmpty({ error, filtered, whatsappHref }: { error?: boolean; filtered?: boolean; whatsappHref: string | null }) {
  const title = error
    ? "Não consegui carregar os imóveis agora"
    : filtered
      ? "Nenhum imóvel com esses filtros"
      : "Estamos preparando o catálogo";
  const text = error
    ? "Tente novamente em instantes ou fale direto com o Magalhães."
    : filtered
      ? "Tente ampliar a faixa de preço ou a região. Ou converse com o Magalhães, que pode indicar outras opções."
      : "Em breve os imóveis selecionados pelo Magalhães aparecem aqui. Enquanto isso, você pode falar direto com ele.";
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface px-6 py-12 text-center">
      <Image src="/magalhaes/rosto/03_casa_nos_olhos.png" alt="" width={144} height={144} quality={90} sizes="144px" className="size-36 object-contain" />
      <h3 className="mt-4 font-display text-xl font-extrabold text-navy">{title}</h3>
      <p className="mt-2 text-sm text-muted">{text}</p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-full bg-whatsapp px-6 font-semibold text-white">
            Conversar com o Magalhães
          </a>
        ) : (
          <Link href="/#contato" className="flex h-12 items-center justify-center rounded-full bg-orange px-6 font-semibold text-white">
            Fale com o Magalhães
          </Link>
        )}
        <Link href="/#busca" className="flex h-12 items-center justify-center rounded-full border border-navy px-6 font-semibold text-navy">
          Encontrar meu imóvel
        </Link>
      </div>
    </div>
  );
}
