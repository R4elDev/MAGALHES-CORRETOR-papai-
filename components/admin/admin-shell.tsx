"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/admin/actions/auth";
import { cx } from "./ui";

const NAV = [
  { href: "/admin", label: "Painel", icon: "▦" },
  { href: "/admin/imoveis", label: "Imóveis", icon: "⌂" },
  { href: "/admin/interessados", label: "Interessados", icon: "☺" },
  { href: "/admin/agenda", label: "Agenda", icon: "▤" },
  { href: "/admin/configuracoes", label: "Ajustes", icon: "⚙" },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  return (
    <div className="min-h-dvh bg-[#F5F7FA] text-slate-900 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col bg-[#092A5E] p-4 text-white lg:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FF7500]">M</span> Magalhães
        </Link>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
              className={cx("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition hover:bg-white/10",
                active(n.href) && "bg-white/15 text-white")}>
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/15 pt-3 text-xs">
          <p className="truncate text-white/70">{email}</p>
          <Link href="/" target="_blank" className="block text-white/80 hover:text-white">Ver site ↗</Link>
          <form action={logoutAction}><button className="min-h-11 text-white/80 hover:text-white">Sair</button></form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="flex items-center justify-between bg-[#092A5E] px-4 py-3 text-white lg:hidden">
          <span className="flex items-center gap-2 font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FF7500]">M</span>Admin</span>
          <form action={logoutAction}><button className="min-h-11 px-2 text-sm text-white/85">Sair</button></form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:py-8">{children}</main>
      </div>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
            className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500",
              active(n.href) && "text-[#FF7500]")}>
            <span aria-hidden className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
