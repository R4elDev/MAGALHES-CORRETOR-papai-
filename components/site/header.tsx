"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/#imoveis", label: "Imóveis" },
  { href: "/#busca", label: "Encontre seu imóvel" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({ name, whatsappHref }: { name: string; whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  // Escape fecha o menu mobile e devolve o foco ao botão que o abriu (não é modal; sem focus trap).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={close}>
          <Image src="/magalhaes/rosto/10_joia_aprovacao.png" alt="" width={36} height={36} className="size-9 shrink-0 rounded-full bg-surface object-cover" />
          <span className="font-display text-sm font-extrabold leading-[1.1] text-navy sm:text-base">{name}</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium text-navy lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors duration-150 hover:text-orange">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press inline-flex h-11 items-center rounded-full bg-whatsapp px-4 text-sm font-semibold text-white max-[359px]:hidden"
            >
              WhatsApp
            </a>
          ) : (
            <Link href="/#contato" className="btn-press inline-flex h-11 items-center rounded-full bg-orange px-4 text-sm font-semibold text-white max-[359px]:hidden">
              Contato
            </Link>
          )}
          <button
            ref={btnRef}
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-full text-navy lg:hidden"
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
                <Link href={n.href} onClick={close} className="block py-3 text-base font-medium text-navy">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
