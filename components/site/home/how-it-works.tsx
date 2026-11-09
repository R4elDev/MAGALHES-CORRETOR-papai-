import { CharacterBand } from "./character-band";

const STEPS = [
  { n: "01", title: "Conte o que procura", text: "Região, quanto pretende investir, tipo de imóvel e quartos. Leva menos de um minuto e não pede cadastro." },
  { n: "02", title: "Veja o que combina", text: "Mostramos só imóveis realmente cadastrados e disponíveis. Quando algo não atende a tudo, avisamos o que ficou de fora." },
  { n: "03", title: "Fale com o Magalhães", text: "Envie suas preferências pelo WhatsApp, com a mensagem já pronta, e converse direto com ele." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-24">
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-8 md:grid-cols-[minmax(0,1fr)_9rem] md:gap-x-12">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Como funciona</p>
          <h2 className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl md:text-4xl">Do que você procura à conversa certa.</h2>
        </div>
        <CharacterBand color="blue" variant="face-house" className="col-start-2 row-start-1 md:row-span-2" />
        <ol className="col-span-2 divide-y divide-border border-y border-border md:col-span-1">
            {STEPS.map((s) => (
              <li key={s.n} className="grid grid-cols-[3.25rem_1fr] gap-x-4 py-6 sm:grid-cols-[4rem_1fr]">
                <span className="font-display text-3xl font-extrabold leading-none text-orange sm:text-4xl">{s.n}</span>
                <div>
                  <h3 className="text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mt-1 text-pretty text-muted">{s.text}</p>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
