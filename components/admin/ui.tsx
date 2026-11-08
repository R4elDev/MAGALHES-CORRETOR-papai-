import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Primitivos locais do admin (sem depender do shadcn do Farol). Paleta SaaS: azul-marinho/laranja/branco.
export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
const variants = {
  primary: "bg-[#FF7500] text-white hover:bg-[#e66a00]",
  navy: "bg-[#092A5E] text-white hover:bg-[#0c3678]",
  outline: "border border-slate-300 bg-white text-[#092A5E] hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  ghost: "text-[#092A5E] hover:bg-slate-100",
} as const;

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button type="button" {...p} className={cx(btnBase, variants[variant], className)} />;
}
export const linkButton = (variant: keyof typeof variants = "primary") => cx(btnBase, variants[variant]);

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}>
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

const fieldCls =
  "block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#1769AA] focus:outline-2 focus:outline-[#1769AA]/30 aria-[invalid=true]:border-red-500 sm:text-sm";

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
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldCls, p.className)} />;
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
export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, text, action, image }: { title: string; text: string; action?: ReactNode; image?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      {image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={image} alt="" className="h-24 w-24 object-contain" />}
      <h3 className="text-base font-bold text-[#092A5E]">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{text}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {message}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-[#092A5E] sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
