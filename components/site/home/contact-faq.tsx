import { CharacterBand } from "./character-band";
import Link from "next/link";
import type { SiteSettings } from "@/types/db";

const FAQ = [
  { q: "Os imóveis do site são reais?", a: "Sim. O catálogo mostra apenas imóveis cadastrados e publicados pelo Magalhães. Valores e disponibilidade são confirmados no atendimento." },
  { q: "Preciso criar uma conta para buscar?", a: "Não. Você pesquisa e vê os imóveis sem cadastro. Só pedimos contato se você quiser que o Magalhães retorne." },
  { q: "A renda que informo aprova financiamento?", a: "Não. Ela só ajuda a entender o orçamento. Não é análise de crédito nem aprovação de financiamento." },
  { q: "O que acontece quando clico em WhatsApp?", a: "O WhatsApp abre com uma mensagem pronta para você conferir e enviar. Nada é enviado sem a sua ação." },
  { q: "Como meus dados são tratados?", a: "Coletamos o mínimo necessário, com a sua autorização. Veja a política de privacidade para detalhes e para pedir exclusão." },
];

export function ContactFaq({ settings, whatsappHref }: { settings: SiteSettings | null; whatsappHref: string | null }) {
  const social = [
    ["Instagram", settings?.instagram],
    ["Facebook", settings?.facebook],
    ["YouTube", settings?.youtube],
    ["TikTok", settings?.tiktok],
  ].filter((x): x is [string, string] => Boolean(x[1]));
  const hasChannel = Boolean(whatsappHref || settings?.email || social.length);

  return (
    <section id="contato" className="mx-auto max-w-6xl px-4 pt-24">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Contato</p>
          <h2 className="mt-1 text-3xl font-extrabold text-navy md:text-4xl">Fale com o Magalhães</h2>
          <div className="mt-6 flex items-center gap-4">
            <CharacterBand color="blue" variant="face" />
            <p className="text-pretty text-muted">Prefere conversar? Ele atende pelo WhatsApp e responde o quanto antes.</p>
          </div>
          <div className="mt-6 grid gap-3">
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-press flex h-14 items-center justify-center rounded-full bg-whatsapp text-lg font-semibold text-white">
                Conversar no WhatsApp
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="btn-press flex min-h-12 items-center justify-center break-all rounded-full border border-navy px-4 text-center font-semibold text-navy">
                {settings.email}
              </a>
            )}
            {social.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {social.map(([label, url]) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn-press inline-flex h-10 items-center rounded-full bg-surface px-4 text-sm font-semibold text-navy">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {!hasChannel && (
              <p className="rounded-2xl bg-surface p-5 text-muted">Os canais de contato serão divulgados em breve. Enquanto isso, explore os imóveis do catálogo e veja as opções disponíveis.</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Dúvidas frequentes</p>
          <div className="mt-3 divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-navy">
                  {f.q}
                  <span aria-hidden className="shrink-0 text-xl leading-none text-orange transition-transform duration-150 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-pretty text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm">
            <Link href="/privacidade" className="font-semibold text-blue hover:text-orange">Política de privacidade</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
