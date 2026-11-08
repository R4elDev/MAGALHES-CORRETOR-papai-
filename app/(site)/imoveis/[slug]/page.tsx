import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, Car, Ruler } from "lucide-react";
import { Gallery } from "@/components/site/gallery";
import { loadDetail, loadSettings } from "@/lib/site/data";
import { formatPrice, interestHref, placeLabel, purposeLabel, typeLabel } from "@/lib/site/format";
import { recordPropertyView } from "@/lib/dal/public";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await loadDetail(slug);
  if (!data) return { title: "Imóvel não encontrado" };
  return { title: data.title, description: (data.description ?? `${typeLabel(data.type)} em ${placeLabel(data)}`).slice(0, 160) };
}

export default async function PropertyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [{ data: p, error }, { data: settings }] = await Promise.all([loadDetail(slug), loadSettings()]);
  if (!p) {
    if (error) throw new Error("Não foi possível carregar o imóvel");
    notFound();
  }
  recordPropertyView(p.id).catch(() => {}); // métrica; nunca bloqueia a página

  const interest = interestHref(p, settings);
  const facts: [typeof Bath, number | null, string][] = [
    [BedDouble, p.bedrooms, "quartos"],
    [Bath, p.bathrooms, "banheiros"],
    [Car, p.parking, "vagas"],
    [Ruler, p.area, "m²"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Trilha" className="mb-4 text-sm text-muted">
        <Link href="/#imoveis" className="hover:text-orange">Imóveis</Link> / <span>{p.code ?? p.slug}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <Gallery photos={p.photos} title={p.title} />
          <section className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-navy">Sobre o imóvel</h2>
            <p className="mt-2 whitespace-pre-line text-pretty leading-relaxed text-foreground">
              {p.description ?? "O Magalhães pode passar mais detalhes sobre este imóvel."}
            </p>
          </section>
          {p.features.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-extrabold text-navy">Diferenciais</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <li key={f} className="rounded-full bg-surface px-3 py-1.5 text-sm text-navy">{f}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-navy">Localização</h2>
            <p className="mt-2 text-foreground">
              {p.address ? `${p.address} — ` : ""}{placeLabel(p)}
            </p>
            {!p.address && <p className="mt-1 text-sm text-muted">Localização aproximada. O endereço completo é informado no atendimento.</p>}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(9,42,94,0.08)] lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue">
            {typeLabel(p.type)} {purposeLabel(p.purpose) && `· ${purposeLabel(p.purpose)}`}{p.code && ` · ${p.code}`}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight text-navy">{p.title}</h1>
          <p className="mt-1 text-sm text-muted">{placeLabel(p)}</p>
          <p className="mt-4 font-display text-3xl font-extrabold text-navy">{formatPrice(p.price, p.purpose)}</p>
          {(p.condoFee || p.iptu) && (
            <p className="mt-1 text-sm text-muted">
              {p.condoFee ? `Condomínio ${formatPrice(p.condoFee)}` : ""}{p.condoFee && p.iptu ? " · " : ""}{p.iptu ? `IPTU ${formatPrice(p.iptu)}` : ""}
            </p>
          )}
          <ul className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
            {facts.map(([Icon, v, label]) =>
              v === null || v === undefined ? null : (
                <li key={label} className="flex items-center gap-2"><Icon className="size-4 text-blue" aria-hidden />{v} {label}</li>
              ),
            )}
          </ul>
          <a
            href={interest.href}
            {...(interest.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-orange font-semibold text-white transition-transform active:scale-[0.97]"
          >
            {interest.external ? "Tenho interesse — falar no WhatsApp" : "Falar com o Magalhães"}
          </a>
          <p className="mt-3 text-xs text-muted">Valores e disponibilidade sujeitos a confirmação.</p>
        </aside>
      </div>
    </div>
  );
}
