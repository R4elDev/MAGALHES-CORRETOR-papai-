"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Building2, CalendarDays, ExternalLink, LayoutDashboard, LogOut, Settings, Users, type LucideIcon } from "lucide-react";
import { logoutAction } from "@/lib/admin/actions/auth";
import { AdminWorkspaceProvider, useAdminWorkspace } from "./admin-workspace";
import { cx } from "./ui";

type PanelAction = "properties" | "leads" | "visits";
type Item =
  | { key: string; label: string; short?: string; icon: LucideIcon; kind: "home" }
  | { key: string; label: string; short?: string; icon: LucideIcon; kind: "panel"; action: PanelAction }
  | { key: string; label: string; short?: string; icon: LucideIcon; kind: "page"; href: string };

const NAV: Item[] = [
  { key: "home", label: "Painel", icon: LayoutDashboard, kind: "home" },
  { key: "properties", label: "Imóveis", icon: Building2, kind: "panel", action: "properties" },
  { key: "leads", label: "Interessados", short: "Leads", icon: Users, kind: "panel", action: "leads" },
  { key: "visits", label: "Agenda", icon: CalendarDays, kind: "panel", action: "visits" },
  { key: "settings", label: "Ajustes", icon: Settings, kind: "page", href: "/admin/configuracoes" },
];

function LogoutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cx("adm-press inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-white/85 hover:text-white disabled:opacity-60", className)}>
      <LogOut size={16} aria-hidden /> {pending ? "Saindo…" : "Sair"}
    </button>
  );
}

function ShellContent({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const { activePanel, open, close, preload } = useAdminWorkspace();
  // Navegação otimista: o item clicado fica ativo na hora e a barra de progresso aparece até a rota mudar.
  const [nav, setNav] = useState<{ href: string; from: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigating = nav !== null && nav.from === path;
  const current = navigating ? nav.href : path;

  const startNav = (href: string) => {
    if (href === path) return;
    setNav({ href, from: path });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNav(null), 12000);
  };

  const isActive = (it: Item) => {
    if (it.kind === "panel") return activePanel === it.action;
    if (activePanel && !navigating) return false;
    if (it.kind === "home") return current === "/admin";
    return current.startsWith(it.href);
  };

  const press = (it: Item) => {
    if (it.kind === "panel") open(it.action);
    else close();
    if (it.kind !== "panel") startNav(it.kind === "home" ? "/admin" : it.href);
  };

  const renderItem = (it: Item, mode: "side" | "tab") => {
    const active = isActive(it);
    const Icon = it.icon;
    const cls =
      mode === "side"
        ? cx("adm-press adm-nav-item flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white", active && "bg-white/15 text-white")
        : cx("adm-press adm-tab relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500", active && "text-[#FF7500]");
    const inner = (
      <>
        <Icon size={mode === "side" ? 18 : 21} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
        <span>{mode === "tab" ? (it.short ?? it.label) : it.label}</span>
      </>
    );
    if (it.kind === "panel") {
      return (
        <button key={it.key} type="button" aria-label={it.label} aria-current={active ? "page" : undefined} className={cls}
          onClick={() => press(it)} onPointerEnter={() => preload(it.action)} onFocus={() => preload(it.action)}>
          {inner}
        </button>
      );
    }
    const href = it.kind === "home" ? "/admin" : it.href;
    return (
      <Link key={it.key} href={href} aria-label={it.label} aria-current={active ? "page" : undefined} className={cls} onClick={() => press(it)}>
        {inner}
      </Link>
    );
  };

  return (
    <div className="min-h-dvh bg-[#F5F7FA] text-slate-900 lg:grid lg:grid-cols-[248px_1fr]">
      <div className="adm-progress" data-active={navigating} aria-hidden />
      <a href="#adm-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#092A5E]">
        Pular para o conteúdo
      </a>

      <aside className="hidden flex-col bg-gradient-to-b from-[#092A5E] to-[#071f47] p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Link href="/admin" onClick={() => press(NAV[0])} className="adm-press mb-6 flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF7500] shadow-[0_4px_12px_-4px_rgb(255_117_0/0.7)]">M</span> Magalhães
        </Link>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">{NAV.map((n) => renderItem(n, "side"))}</nav>
        <div className="space-y-1 border-t border-white/15 pt-3 text-xs">
          <p className="truncate px-2 text-white/60">{email}</p>
          <Link href="/" target="_blank" className="adm-press flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-white/85 hover:text-white">
            <ExternalLink size={16} aria-hidden /> Ver site
          </Link>
          <form action={logoutAction}><LogoutButton /></form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-[var(--adm-nav-h)] lg:pb-0">
        <header className="flex items-center justify-between bg-[#092A5E] px-4 py-2 text-white lg:hidden">
          <Link href="/admin" onClick={() => press(NAV[0])} className="adm-press flex min-h-11 items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FF7500]">M</span>Admin
          </Link>
          <form action={logoutAction}><LogoutButton /></form>
        </header>
        <main id="adm-main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:py-8">
          <div key={path} className="adm-page">{children}</div>
        </main>
      </div>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((n) => renderItem(n, "tab"))}
      </nav>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <AdminWorkspaceProvider>
      <ShellContent email={email}>{children}</ShellContent>
    </AdminWorkspaceProvider>
  );
}
