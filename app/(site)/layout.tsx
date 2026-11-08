import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { loadSettings } from "@/lib/site/data";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { phoneOf } from "@/lib/site/format";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = await loadSettings();
  const wa = buildWhatsAppLink(phoneOf(settings), settings?.default_message ?? undefined);
  return (
    <>
      <SiteHeader name={settings?.business_name ?? "Magalhães Corretor"} whatsappHref={wa} />
      <main id="conteudo">{children}</main>
      <SiteFooter settings={settings} />
      {/* ChatWidget (Nexo) será montado aqui somente quando a IA estiver configurada (última etapa). */}
    </>
  );
}
