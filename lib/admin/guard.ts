import "server-only";
import { requireAdmin, type AdminSession } from "@/lib/auth";
import { ZodError, type ZodType } from "zod";
import { fail, type ActionResult } from "./result";

const isRedirect = (e: unknown) =>
  typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_");

export function zodFieldErrors(err: ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ||= []).push(issue.message);
  }
  return out;
}

/**
 * Envolve TODA server action admin: autoriza (requireAdmin), valida com zod e
 * converte exceções em erro recuperável. Redirects do Next são repropagados.
 */
export function adminAction<S extends ZodType, R>(
  schema: S,
  handler: (input: import("zod").infer<S>, session: AdminSession) => Promise<ActionResult<R>>,
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    try {
      const session = await requireAdmin();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
      return await handler(parsed.data, session);
    } catch (e) {
      if (isRedirect(e)) throw e;
      console.error("[admin-action]", e instanceof Error ? e.message : "erro");
      return fail("Não foi possível concluir. Tente novamente em instantes.");
    }
  };
}
