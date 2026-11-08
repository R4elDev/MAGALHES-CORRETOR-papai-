"use client";
import { useRouter } from "next/navigation";
import { saveSettings, uploadBrandAsset } from "@/lib/admin/actions/settings";
import { Button, Card, Field, Input, Textarea } from "./ui";
import { Feedback, useAction } from "./use-action";

type Initial = Record<"businessName" | "whatsapp" | "email" | "creci" | "bio" | "instagram" | "facebook" | "youtube" | "tiktok" | "defaultMessage" | "heroTitle" | "heroSubtitle", string> & { featuredLimit: number };

function AssetUpload({ kind, label, url }: { kind: "logo" | "avatar"; label: string; url: string | null }) {
  const router = useRouter();
  const { pending, message, run } = useAction();
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : "vazio"}
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-[#092A5E]">
          {pending ? "Enviando…" : "Trocar imagem"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData(); fd.set("kind", kind); fd.set("file", file);
              run(() => uploadBrandAsset(fd), () => router.refresh());
            }} />
        </label>
      </div>
      <Feedback message={message} />
    </div>
  );
}

export function SettingsForm({ initial, logoUrl, avatarUrl }: { initial: Initial; logoUrl: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const { pending, message, fieldErrors: fe, run } = useAction();
  const f = (name: keyof Initial, label: string, p: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <Field label={label} error={fe[name]} hint={hint}><Input name={name} defaultValue={String(initial[name] ?? "")} aria-invalid={!!fe[name]} {...p} /></Field>
  );
  return (
    <div className="space-y-4">
      <Card title="Marca">
        <div className="grid gap-5 sm:grid-cols-2">
          <AssetUpload kind="avatar" label="Foto / avatar do corretor" url={avatarUrl} />
          <AssetUpload kind="logo" label="Logo" url={logoUrl} />
        </div>
      </Card>
      <form className="space-y-4" noValidate onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSettings(Object.fromEntries(new FormData(e.currentTarget).entries())), () => router.refresh());
      }}>
        <Card title="Contato">
          <div className="grid gap-3 sm:grid-cols-2">
            {f("businessName", "Nome comercial *", { required: true })}
            {f("whatsapp", "WhatsApp *", { inputMode: "tel", required: true }, "DDI + DDD + número, só dígitos. Ex.: 5511999999999")}
            {f("email", "E-mail", { type: "email" })}
            {f("creci", "CRECI")}
          </div>
        </Card>
        <Card title="Apresentação e conteúdo do site">
          <div className="space-y-3">
            <Field label="Sobre o Magalhães" error={fe.bio}><Textarea name="bio" defaultValue={initial.bio} rows={5} maxLength={2000} /></Field>
            {f("heroTitle", "Título da página inicial")}
            {f("heroSubtitle", "Subtítulo da página inicial")}
            <Field label="Mensagem padrão de WhatsApp" error={fe.defaultMessage}><Textarea name="defaultMessage" defaultValue={initial.defaultMessage} rows={3} maxLength={500} /></Field>
            {f("featuredLimit", "Quantidade de imóveis em destaque na home", { type: "number", min: 1, max: 12 })}
          </div>
        </Card>
        <Card title="Redes sociais">
          <div className="grid gap-3 sm:grid-cols-2">
            {f("instagram", "Instagram (URL)", { type: "url" })}
            {f("facebook", "Facebook (URL)", { type: "url" })}
            {f("youtube", "YouTube (URL)", { type: "url" })}
            {f("tiktok", "TikTok (URL)", { type: "url" })}
          </div>
        </Card>
        <p className="text-xs text-slate-500">Chaves e provedores de IA ficam apenas no ambiente seguro do servidor e não são configuráveis aqui.</p>
        <Feedback message={message} />
        <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar configurações"}</Button></div>
      </form>
    </div>
  );
}
