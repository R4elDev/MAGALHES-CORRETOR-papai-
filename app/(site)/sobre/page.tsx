import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadSettings } from "@/lib/site/data";

export const metadata: Metadata = { title: "Sobre o Magalhães" };

export default async function SobrePage() {
  const { data: s } = await loadSettings();
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[320px_1fr]">
      <div className="relative mx-auto aspect-[3/4] w-64 md:w-full">
        <Image src="/magalhaes/corpo/pose-01.png" alt="Magalhães, corretor" fill sizes="320px" className="object-contain" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-extrabold text-navy">Sobre o {s?.business_name ?? "Magalhães"}</h1>
        {s?.creci && <p className="mt-1 text-sm text-muted">CRECI {s.creci}</p>}
        <p className="mt-4 whitespace-pre-line text-pretty text-lg leading-relaxed text-foreground">
          {s?.bio ?? "Corretor de imóveis. Aqui você encontra os imóveis que ele seleciona e pode falar direto com ele."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/imoveis" className="flex h-12 items-center justify-center rounded-full bg-orange px-7 font-semibold text-white">Ver imóveis</Link>
          <Link href="/contato" className="flex h-12 items-center justify-center rounded-full border border-navy px-7 font-semibold text-navy">Falar com o Magalhães</Link>
        </div>
      </div>
    </div>
  );
}
