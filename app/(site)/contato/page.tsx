import type { Metadata } from "next";
import Image from "next/image";
import { loadSettings } from "@/lib/site/data";
import { phoneOf } from "@/lib/site/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contato" };

export default async function ContatoPage() {
  const { data: s } = await loadSettings();
  const wa = buildWhatsAppLink(phoneOf(s), s?.default_message ?? "Olá, Magalhães! Vim pelo seu site e gostaria de conversar.");
  const social = [["Instagram", s?.instagram], ["Facebook", s?.facebook], ["YouTube", s?.youtube], ["TikTok", s?.tiktok]].filter((x): x is [string, string] => Boolean(x[1]));
  const hasAny = Boolean(wa || s?.email || social.length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-4">
        <Image src="/magalhaes/rosto/09_atendendo_cliente.png" alt="" width={88} height={88} className="size-20 object-contain" />
        <h1 className="font-display text-3xl font-extrabold text-navy">Fale com o Magalhães</h1>
      </div>
      <div className="mt-8 grid gap-3">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex h-14 items-center justify-center rounded-full bg-whatsapp text-lg font-semibold text-white">
            Conversar no WhatsApp
          </a>
        )}
        {s?.email && (
          <a href={`mailto:${s.email}`} className="flex h-14 items-center justify-center rounded-full border border-navy font-semibold text-navy">
            {s.email}
          </a>
        )}
        {social.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-full bg-surface font-semibold text-navy">
            {label}
          </a>
        ))}
        {!hasAny && (
          <p className="rounded-2xl bg-surface p-6 text-center text-muted">
            Os canais de contato serão divulgados em breve. Enquanto isso, use a busca guiada para registrar o que você procura.
          </p>
        )}
      </div>
      {s?.creci && <p className="mt-6 text-sm text-muted">CRECI {s.creci}</p>}
    </div>
  );
}
