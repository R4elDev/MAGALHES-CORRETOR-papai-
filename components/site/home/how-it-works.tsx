const STEPS = [
  { n: "01", title: "Conte o que procura", text: "Região, quanto pretende investir, tipo de imóvel e quartos. Leva menos de um minuto e não pede cadastro." },
  { n: "02", title: "Veja o que combina", text: "Mostramos só imóveis realmente cadastrados e disponíveis. Quando algo não atende a tudo, avisamos o que ficou de fora." },
  { n: "03", title: "Fale com o Magalhães", text: "Envie suas preferências pelo WhatsApp, com a mensagem já pronta, e converse direto com ele." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-24">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">Como funciona</p>
          <h2 className="mt-1 text-3xl font-extrabold text-navy md:text-4xl">Do que você procura à conversa certa.</h2>
        </div>
        <ol className="divide-y divide-border border-y border-border">
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
