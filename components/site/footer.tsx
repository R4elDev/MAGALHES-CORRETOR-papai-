import Link from "next/link";
import type { SiteSettings } from "@/types/db";

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  const social = [
    ["Instagram", settings?.instagram],
    ["Facebook", settings?.facebook],
    ["YouTube", settings?.youtube],
    ["TikTok", settings?.tiktok],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-extrabold">{settings?.business_name ?? "Magalhães Corretor"}</p>
          {settings?.creci && <p className="mt-1 text-sm text-white/70">CRECI {settings.creci}</p>}
          {settings?.email && (
            <a href={`mailto:${settings.email}`} className="mt-3 block text-sm text-white/80 hover:text-white">
              {settings.email}
            </a>
          )}
        </div>
        <nav aria-label="Rodapé" className="grid gap-2 text-sm text-white/80">
          <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
          <Link href="/encontre-seu-imovel" className="hover:text-white">Encontre seu imóvel</Link>
          <Link href="/sobre" className="hover:text-white">Sobre o Magalhães</Link>
          <Link href="/contato" className="hover:text-white">Contato</Link>
          <Link href="/privacidade" className="hover:text-white">Política de privacidade</Link>
        </nav>
        {social.length > 0 && (
          <ul className="grid gap-2 text-sm text-white/80">
            {social.map(([label, url]) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {settings?.business_name ?? "Magalhães Corretor"}. Valores e disponibilidade sujeitos a confirmação.
      </div>
    </footer>
  );
}
