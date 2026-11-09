import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { supabaseEnvReady } from "@/lib/supabase/env";

export type AdminSession = { id: string; email: string; role: "admin" | "editor" };

/** Valida o JWT no servidor (getUser) e confirma linha em admin_users. Null se nao for admin. */
export async function getAdminSession(): Promise<AdminSession | null> {
  // falha fechado: sem env ou erro de rede = sem sessao (nunca libera, nunca 500 por aqui)
  if (!supabaseEnvReady()) return null;
  try {
    const supabase = await createSessionClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data: row } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!row) return null;
    return { id: auth.user.id, email: auth.user.email ?? "", role: row.role as AdminSession["role"] };
  } catch {
    return null;
  }
}

/** Use no inicio de toda query/action do admin. Redireciona ao login se nao for admin. */
export async function requireAdmin(): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseEnvReady()) return { ok: false, error: "indisponivel" };
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password }).catch(() => ({ error: new Error("rede") }));
  // mensagem unica: nao revela se o e-mail existe
  if (error) return { ok: false, error: "credenciais" };
  if (!(await getAdminSession())) {
    await supabase.auth.signOut();
    return { ok: false, error: "credenciais" };
  }
  return { ok: true };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
}
