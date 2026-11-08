import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { must } from "@/lib/db/errors";
import type { SiteSettings } from "@/types/db";

const COLS =
  "business_name, logo_url, avatar_url, whatsapp, whatsapp_number, email, bio, creci, instagram, facebook, youtube, tiktok, default_message, hero_title, hero_subtitle, featured_limit";

const EMPTY: SiteSettings = {
  business_name: null, logo_url: null, avatar_url: null, whatsapp: null, whatsapp_number: null, email: null,
  bio: null, creci: null, instagram: null, facebook: null, youtube: null, tiktok: null,
  default_message: null, hero_title: null, hero_subtitle: null, featured_limit: 6,
};

/**
 * Leitura PUBLICA (view public_site_settings, via anon): serve site, Nexo e admin.
 * Nao ha segredo aqui; chaves de IA nunca vivem nesta tabela.
 */
export async function get(): Promise<SiteSettings> {
  const res = await createAnonClient().from("public_site_settings").select(COLS).maybeSingle();
  return (must(res, "ler configuracoes") as SiteSettings | null) ?? EMPTY;
}

/** Admin. Campos aceitos = colunas editaveis (sem whatsapp_number: alias so de leitura). */
export async function update(patch: Partial<Omit<SiteSettings, "whatsapp_number">>): Promise<void> {
  const supabase = await createSessionClient();
  must(await supabase.from("site_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1), "salvar configuracoes");
}
