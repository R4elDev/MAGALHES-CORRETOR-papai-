import type { Metadata } from "next";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Entrar — Admin Magalhães", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center bg-[#092A5E] px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* Pose do personagem: path definido pelo Farol (public/magalhaes/rosto/*) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/magalhaes/rosto/01_sorrindo_oculos.png" alt="" width={72} height={72} className="mx-auto mb-3 h-[72px] w-[72px] object-contain" />
        <h1 className="text-center text-xl font-extrabold text-[#092A5E]">Painel do Magalhães</h1>
        <p className="mb-5 text-center text-sm text-slate-600">Acesso restrito ao administrador.</p>
        <LoginForm />
      </div>
    </main>
  );
}
