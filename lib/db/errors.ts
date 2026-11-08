import "server-only";

/** Erro de acesso a dados. A mensagem e generica; o detalhe do Postgres fica so no log do servidor. */
export class DalError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "DalError";
  }
}

export function must<T>(res: { data: T | null; error: { message: string; code?: string } | null }, what: string): T {
  if (res.error) {
    console.error(`[dal] ${what}:`, res.error.code ?? "", res.error.message);
    throw new DalError(`Falha em ${what}`, res.error.code);
  }
  return res.data as T;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Escapa curingas do ilike e virgulas/parenteses usados na sintaxe .or() do PostgREST. */
export function safeLike(q: string): string {
  return q.replace(/[\\%_,()]/g, " ").trim().slice(0, 80);
}
