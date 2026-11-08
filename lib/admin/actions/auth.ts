"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signInAdmin, signOutAdmin } from "@/lib/auth";
import { fail, type ActionResult } from "../result";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

export async function loginAction(raw: unknown): Promise<ActionResult> {
  const p = loginSchema.safeParse(raw);
  if (!p.success) return fail("Confira e-mail e senha.");
  const r = await signInAdmin(p.data.email, p.data.password);
  if (!r.ok) return fail("E-mail ou senha incorretos, ou sem permissão de administrador.");
  redirect("/admin");
}

export async function logoutAction() {
  await signOutAdmin();
  redirect("/admin/login");
}
