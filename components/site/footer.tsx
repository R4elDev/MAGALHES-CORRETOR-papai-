import Link from "next/link";
import type { SiteSettings } from "@/types/db";

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  const name = settings?.business_name ?? "Magalhães Corretor";
  const social = [
    ["Instagram", settings?.instagram],
    ["Facebook", settings?.facebook],
    ["YouTube", settings?.youtube],
    ["TikTok", settings?.tiktok],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="font-display text-lg font-extrabold">{name}</p>
          {settings?.creci && <p className="mt-1 text-sm text-white/70">CRECI {settings.creci}</p>}
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          <Link href="/#imoveis" className="hover:text-white">Imóveis</Link>
          <Link href="/#busca" className="hover:text-white">Encontre seu imóvel</Link>
          <Link href="/#sobre" className="hover:text-white">Sobre</Link>
          <Link href="/#contato" className="hover:text-white">Contato</Link>
          <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
          {social.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {name}. Valores e disponibilidade sujeitos a confirmação.
      </div>
    </footer>
  );
}
