"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/encontre-seu-imovel", label: "Encontre seu imóvel" },
  { href: "/sobre", label: "Sobre o Magalhães" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader({ name, whatsappHref }: { name: string; whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/magalhaes/rosto/01_sorrindo_oculos.png" alt="" width={36} height={36} className="size-9 rounded-full bg-surface object-cover" />
          <span className="font-display text-base font-extrabold leading-none text-navy">
            {name}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-navy lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-orange">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center rounded-full bg-whatsapp px-4 text-sm font-semibold text-white transition-transform active:scale-[0.97] sm:inline-flex"
            >
              WhatsApp
            </a>
          )}
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full text-navy lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Menu" className="border-t border-border bg-white px-4 pb-4 lg:hidden">
          <ul className="flex flex-col py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-3 text-base font-medium text-navy">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-full bg-whatsapp font-semibold text-white">
              Falar no WhatsApp
            </a>
          ) : (
            <Link href="/contato" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-full bg-orange font-semibold text-white">
              Fale com o Magalhães
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
