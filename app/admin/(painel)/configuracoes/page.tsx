import { getAdminSettings } from "@/lib/admin/queries";
import { ErrorState, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Configurações — Admin Magalhães" };

export default async function Configuracoes() {
  let s;
  try {
    s = await getAdminSettings();
  } catch {
    return (<><PageHeader title="Configurações" /><ErrorState message="Não consegui carregar as configurações." /></>);
  }
  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados exibidos no site e usados nos links de WhatsApp." />
      <SettingsForm
        logoUrl={s?.logo_url ?? null}
        avatarUrl={s?.avatar_url ?? null}
        initial={{
          businessName: s?.business_name ?? "", whatsapp: s?.whatsapp ?? "", email: s?.email ?? "", creci: s?.creci ?? "", bio: s?.bio ?? "",
          instagram: s?.instagram ?? "", facebook: s?.facebook ?? "", youtube: s?.youtube ?? "", tiktok: s?.tiktok ?? "",
          defaultMessage: s?.default_message ?? "", heroTitle: s?.hero_title ?? "", heroSubtitle: s?.hero_subtitle ?? "",
          featuredLimit: s?.featured_limit ?? 6,
        }}
      />
    </>
  );
}
