"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus } from "lucide-react";
import { saveSettings, uploadBrandAsset } from "@/lib/admin/actions/settings";
import { Button, Field, FormSection, Input, Textarea, cx } from "./ui";
import { Feedback, useAction } from "./use-action";

type Initial = Record<"businessName" | "whatsapp" | "email" | "creci" | "bio" | "instagram" | "facebook" | "youtube" | "tiktok" | "defaultMessage" | "heroTitle" | "heroSubtitle", string> & { featuredLimit: number };
type Values = Record<keyof Initial, string>;

function AssetUpload({ kind, label, url, onPreview }: { kind: "logo" | "avatar"; label: string; url: string | null; onPreview: (k: "logo" | "avatar", src: string | null) => void }) {
  const router = useRouter();
  const { pending, message, run } = useAction();
  const [local, setLocal] = useState<string | null>(null);
  const localRef = useRef<string | null>(null);
  useEffect(() => () => { if (localRef.current) URL.revokeObjectURL(localRef.current); }, []);
  const shown = local ?? url;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="flex items-center gap-3">
        <div className={cx("grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400", kind === "avatar" ? "h-20 w-16" : "h-16 w-16")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shown ? <img src={shown} alt="" className={cx("h-full w-full", kind === "avatar" ? "object-contain" : "object-cover")} /> : <ImagePlus size={20} aria-hidden />}
        </div>
        <label className={cx("adm-press inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#092A5E] hover:bg-slate-50 focus-within:outline-2 focus-within:outline-[#1769AA]", pending && "pointer-events-none opacity-60")}>
          {pending ? "Enviando…" : shown ? "Trocar imagem" : "Enviar imagem"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (localRef.current) URL.revokeObjectURL(localRef.current);
              const src = URL.createObjectURL(file);
              localRef.current = src; setLocal(src); onPreview(kind, src);
              const fd = new FormData(); fd.set("kind", kind); fd.set("file", file);
              run(() => uploadBrandAsset(fd), () => router.refresh());
            }} />
        </label>
      </div>
      <Feedback message={message} />
    </div>
  );
}

function BrandPreview({ v, avatar, logo }: { v: Values; avatar: string | null; logo: string | null }) {
  const digits = v.whatsapp.replace(/\D/g, "");
  const phone = digits.length >= 12 ? `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, -4)}-${digits.slice(-4)}` : v.whatsapp;
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#092A5E] to-[#1769AA] p-4 text-white shadow-[0_16px_32px_-20px_rgb(9_42_94/0.7)]" aria-label="Pré-visualização da marca">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/60">Pré-visualização</p>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <span className="text-lg font-extrabold">{(v.businessName || "M").slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{v.businessName || "Nome comercial"}</p>
          <p className="truncate text-xs text-white/75">{[v.creci && `CRECI ${v.creci}`, phone].filter(Boolean).join(" · ") || "Contato do corretor"}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {avatar && <img src={avatar} alt="" className="h-16 w-12 shrink-0 object-contain" />}
      </div>
      <div className="mt-4 border-t border-white/15 pt-3">
        <p className="text-base font-extrabold leading-snug">{v.heroTitle || "Título da página inicial"}</p>
        <p className="mt-0.5 text-sm text-white/80">{v.heroSubtitle || "Subtítulo da página inicial"}</p>
      </div>
    </div>
  );
}

export function SettingsForm({ initial, logoUrl, avatarUrl }: { initial: Initial; logoUrl: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const { pending, message, fieldErrors: fe, run } = useAction();
  const toValues = (i: Initial): Values => Object.fromEntries(Object.entries(i).map(([k, x]) => [k, String(x ?? "")])) as Values;
  const [values, setValues] = useState<Values>(() => toValues(initial));
  const [saved, setSaved] = useState<Values>(values);
  const [justSaved, setJustSaved] = useState(false);
  const [prev, setPrev] = useState<{ logo: string | null; avatar: string | null }>({ logo: null, avatar: null });
  const dirty = (Object.keys(values) as Array<keyof Values>).some((k) => values[k] !== saved[k]);
  const set = (k: keyof Values, val: string) => { setValues((o) => ({ ...o, [k]: val })); setJustSaved(false); };

  const f = (name: keyof Values, label: string, p: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <Field label={label} error={fe[name]} hint={hint}>
      <Input name={name} value={values[name]} onChange={(e) => set(name, e.target.value)} aria-invalid={!!fe[name]} {...p} />
    </Field>
  );

  return (
    <form className="space-y-4" noValidate onSubmit={(e) => {
      e.preventDefault();
      const snapshot = values;
      run(() => saveSettings({ ...snapshot }), () => { setSaved(snapshot); setJustSaved(true); router.refresh(); });
    }}>
      <BrandPreview v={values} logo={prev.logo ?? logoUrl} avatar={prev.avatar ?? avatarUrl} />

      <FormSection title="Marca" description="Imagens usadas no site e nos materiais.">
        <div className="grid gap-5 sm:grid-cols-2">
          <AssetUpload kind="avatar" label="Foto / avatar do corretor" url={avatarUrl} onPreview={(k, src) => setPrev((o) => ({ ...o, [k]: src }))} />
          <AssetUpload kind="logo" label="Logo" url={logoUrl} onPreview={(k, src) => setPrev((o) => ({ ...o, [k]: src }))} />
        </div>
      </FormSection>

      <FormSection title="Contato" description="Como os clientes falam com você.">
        <div className="grid gap-3 sm:grid-cols-2">
          {f("businessName", "Nome comercial *", { required: true })}
          {f("whatsapp", "WhatsApp *", { inputMode: "tel", required: true }, "DDI + DDD + número, só dígitos. Ex.: 5511999999999")}
          {f("email", "E-mail", { type: "email" })}
          {f("creci", "CRECI")}
        </div>
      </FormSection>

      <FormSection title="Site" description="Textos da página inicial e da mensagem de WhatsApp.">
        <div className="space-y-3">
          <Field label="Sobre o Magalhães" error={fe.bio}><Textarea name="bio" value={values.bio} onChange={(e) => set("bio", e.target.value)} rows={5} maxLength={2000} /></Field>
          {f("heroTitle", "Título da página inicial")}
          {f("heroSubtitle", "Subtítulo da página inicial")}
          <Field label="Mensagem padrão de WhatsApp" error={fe.defaultMessage}><Textarea name="defaultMessage" value={values.defaultMessage} onChange={(e) => set("defaultMessage", e.target.value)} rows={3} maxLength={500} /></Field>
          {f("featuredLimit", "Imóveis em destaque na home", { type: "number", min: 1, max: 12, inputMode: "numeric" }, "De 1 a 12.")}
        </div>
      </FormSection>

      <FormSection title="Redes sociais" description="Links exibidos no rodapé do site.">
        <div className="grid gap-3 sm:grid-cols-2">
          {f("instagram", "Instagram (URL)", { type: "url" })}
          {f("facebook", "Facebook (URL)", { type: "url" })}
          {f("youtube", "YouTube (URL)", { type: "url" })}
          {f("tiktok", "TikTok (URL)", { type: "url" })}
        </div>
      </FormSection>

      <div className="adm-savebar -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm" aria-live="polite">
            {message ? <Feedback message={message} /> : justSaved && !dirty ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700"><Check size={16} aria-hidden /> Alterações salvas</span>
            ) : dirty ? <span className="text-slate-600">Você tem alterações não salvas.</span> : <span className="text-slate-500">Tudo salvo.</span>}
          </div>
          <div className="flex gap-2">
            {dirty && <Button variant="ghost" disabled={pending} onClick={() => { setValues(saved); setJustSaved(false); }}>Desfazer</Button>}
            <Button type="submit" loading={pending} disabled={!dirty}>{pending ? "Salvando…" : "Salvar configurações"}</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
