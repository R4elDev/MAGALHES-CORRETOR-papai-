import Link from "next/link";
import { Reveal } from "./reveal";

const FAQ = [
  { q: "Os imóveis do site são reais?", a: "Sim. O catálogo mostra apenas imóveis cadastrados e publicados pelo Magalhães. Valores e disponibilidade são confirmados no atendimento." },
  { q: "Preciso criar uma conta para buscar?", a: "Não. Você pesquisa e vê os imóveis sem cadastro. Só pedimos contato se você quiser que o Magalhães retorne." },
  { q: "A renda que informo aprova financiamento?", a: "Não. Ela só ajuda a entender o orçamento. Não é análise de crédito nem aprovação de financiamento." },
  { q: "O que acontece quando clico em WhatsApp?", a: "O WhatsApp abre com uma mensagem pronta para você conferir e enviar. Nada é enviado sem a sua ação." },
  { q: "Como meus dados são tratados?", a: "Coletamos o mínimo necessário, com a sua autorização. Veja a política de privacidade para detalhes e para pedir exclusão." },
];

export function Faq() {
  return (
    <section id="duvidas" className="mx-auto max-w-3xl px-4 py-20">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Dúvidas frequentes</p>
        <h2 className="mt-1 text-3xl font-extrabold text-navy">O que as pessoas mais perguntam</h2>
      </Reveal>
      <div className="mt-6 divide-y divide-border border-y border-border">
        {FAQ.map((f, i) => (
          <Reveal key={f.q} delay={i * 50}>
            <details className="group py-4">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-semibold text-navy">
                {f.q}
                <span aria-hidden className="shrink-0 text-xl leading-none text-orange transition-transform duration-150 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-pretty text-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-sm">
        <Link href="/privacidade" className="font-semibold text-blue hover:text-orange">Política de privacidade</Link>
      </p>
    </section>
  );
}
