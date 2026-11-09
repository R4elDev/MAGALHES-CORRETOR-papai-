import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Primitivos locais do admin, server-safe (sem hooks). Paleta: azul-marinho #092A5E, azul #1769AA, laranja #FF7500.
export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const btnBase =
  "adm-press inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:cursor-not-allowed disabled:opacity-50";
const variants = {
  primary: "bg-[#FF7500] text-white shadow-[0_1px_2px_rgb(255_117_0/0.35)] hover:bg-[#e66a00]",
  navy: "bg-[#092A5E] text-white hover:bg-[#0c3678]",
  outline: "border border-slate-300 bg-white text-[#092A5E] hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  solidDanger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-[#092A5E] hover:bg-slate-100",
} as const;
export type ButtonVariant = keyof typeof variants;

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cx("adm-spinner inline-block shrink-0", className)} />;
}

export function Button({
  variant = "primary", className, loading, disabled, children, ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button type="button" {...p} disabled={disabled || loading} aria-busy={loading || undefined} className={cx(btnBase, variants[variant], className)}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
export const linkButton = (variant: ButtonVariant = "primary") => cx(btnBase, variants[variant]);

export function chipClass(active: boolean) {
  return cx(
    "adm-press inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium sm:min-h-9 sm:px-3",
    active ? "border-[#092A5E] bg-[#092A5E] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("adm-card rounded-2xl p-4 sm:p-5", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-[#092A5E]">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Seção de formulário: título + descrição à esquerda, campos à direita (empilha no mobile). */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="adm-card grid gap-4 rounded-2xl p-4 sm:p-5 lg:grid-cols-[220px_1fr] lg:gap-8">
      <div>
        <h2 className="text-base font-bold text-[#092A5E]">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const fieldCls =
  "adm-field block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 aria-[invalid=true]:border-red-500 disabled:bg-slate-50 sm:text-sm";

export function Field({ label, error, hint, children }: { label: string; error?: string[]; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error?.length && <span className="block text-xs text-slate-500">{hint}</span>}
      {error?.length ? <span role="alert" className="block text-xs font-medium text-red-600">{error[0]}</span> : null}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldCls, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldCls, "adm-select", p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(fieldCls, "min-h-24 py-2", p.className)} />
);

const tones = {
  navy: "bg-[#092A5E]/10 text-[#092A5E]",
  orange: "bg-[#FF7500]/15 text-[#a34c00]",
  green: "bg-emerald-100 text-emerald-800",
  gray: "bg-slate-100 text-slate-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-[#1769AA]/10 text-[#1769AA]",
} as const;
export type BadgeTone = keyof typeof tones;
export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cx("inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-snug", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, text, action, image }: { title: string; text: string; action?: ReactNode; image?: string }) {
  return (
    <div className="adm-rise flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      {image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={image} alt="" width={96} height={96} className="h-24 w-24 object-contain" />}
      <h3 className="text-base font-bold text-[#092A5E]">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{text}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {message}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("adm-skel", className)} />;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-[#092A5E] sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
