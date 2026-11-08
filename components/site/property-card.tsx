import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Car, Ruler } from "lucide-react";
import type { PropertyCard as Card, SiteSettings } from "@/types/db";
import { formatPrice, interestHref, placeLabel, purposeLabel, typeLabel } from "@/lib/site/format";

function Stat({ icon: Icon, value, label }: { icon: typeof Bath; value: number | null; label: string }) {
  if (value === null || value === undefined) return null;
  return (
    <li className="flex items-center gap-1.5" title={label}>
      <Icon className="size-4 text-blue" aria-hidden />
      <span className="sr-only">{label}: </span>
      {value}
    </li>
  );
}

export function PropertyCard({ card, settings, priority = false }: { card: Card; settings: SiteSettings | null; priority?: boolean }) {
  const interest = interestHref(card, settings);
  const tags = [card.isNew && "Novo", card.featured && "Destaque"].filter(Boolean) as string[];
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(9,42,94,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(9,42,94,0.10)]">
      <Link href={`/imoveis/${card.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-surface">
        {card.coverUrl ? (
          <Image
            src={card.coverUrl}
            alt={card.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">Foto em breve</div>
        )}
        {tags.length > 0 && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-white">
                {t}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue">
            {typeLabel(card.type)} {purposeLabel(card.purpose) && `· ${purposeLabel(card.purpose)}`}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-navy">
            <Link href={`/imoveis/${card.slug}`}>{card.title}</Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">{placeLabel(card)}</p>
        </div>
        <p className="font-display text-xl font-extrabold text-navy">{formatPrice(card.price, card.purpose)}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
          <Stat icon={BedDouble} value={card.bedrooms} label="Quartos" />
          <Stat icon={Bath} value={card.bathrooms} label="Banheiros" />
          <Stat icon={Car} value={card.parking} label="Vagas" />
          <Stat icon={Ruler} value={card.area} label="Área em m²" />
        </ul>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/imoveis/${card.slug}`}
            className="flex h-11 items-center justify-center rounded-full border border-navy text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
          >
            Ver detalhes
          </Link>
          <a
            href={interest.href}
            {...(interest.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex h-11 items-center justify-center rounded-full bg-orange text-sm font-semibold text-white transition-transform active:scale-[0.97]"
          >
            Tenho interesse
          </a>
        </div>
      </div>
    </article>
  );
}
