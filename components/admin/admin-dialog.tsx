"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export type AdminDialogProps = {
  open: boolean; title: string; description?: string; onClose: () => void;
  onBack?: () => void; backLabel?: string; busy?: boolean; children: ReactNode;
  footer?: ReactNode; size?: "md" | "lg" | "xl";
};

export function AdminDialog({ open, title, description, onClose, onBack, backLabel = "Voltar", busy, children, footer, size = "lg" }: AdminDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // Native dialog handles nested focus; the fallback covers a removed trigger.
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} aria-busy={busy || undefined}
      className={`admin-dialog admin-dialog--${size} m-auto w-[calc(100%-1rem)] max-w-5xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50`}
      style={{ width: "calc(100% - 1rem)", maxWidth: size === "md" ? 640 : size === "xl" ? 1152 : 960, maxHeight: "calc(100dvh - 1rem)" }}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="flex max-h-[calc(100dvh-1rem)] min-h-0 flex-col">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          {onBack && <button type="button" onClick={onBack} disabled={busy} className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-slate-600" aria-label={backLabel}>← <span className="hidden sm:inline">{backLabel}</span></button>}
          <div className="min-w-0 flex-1 py-1"><h2 id={titleId} className="text-xl font-bold tracking-tight text-[#092A5E]">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-sm text-slate-500">{description}</p>}</div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fechar janela" className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg border border-slate-200 text-xl text-slate-600">×</button>
        </header>
        <div data-admin-dialog-scroll className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
        {footer && <footer className="shrink-0 border-t border-slate-200 p-4 sm:px-6">{footer}</footer>}
      </div>
    </dialog>
  );
}
