"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ photos, title }: { photos: { url: string }[]; title: string }) {
  const [i, setI] = useState(0);
  if (photos.length === 0) {
    return <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-surface text-sm text-muted">Fotos em breve</div>;
  }
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
        <Image src={photos[i].url} alt={`${title} — foto ${i + 1} de ${photos.length}`} fill priority sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas">
          {photos.map((p, idx) => (
            <li key={p.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ver foto ${idx + 1}`}
                aria-current={idx === i}
                className={`relative block h-16 w-24 overflow-hidden rounded-lg border-2 ${idx === i ? "border-orange" : "border-transparent"}`}
              >
                <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
