export const brl = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
export const dateBR = (v: string | Date | null | undefined) =>
  v ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(v)) : "—";
export const dateTimeBR = (v: string | Date | null | undefined) =>
  v ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)) : "—";

/** "R$ 350.000,50" | "350000" | "350.000" -> number | null */
export function parseMoney(input: unknown): number | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const s = String(input).replace(/[^\d,.-]/g, "");
  if (!s) return null;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /\.\d{3}$/.test(s) ? s.replace(/\./g, "") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
export const onlyDigits = (s: string) => s.replace(/\D/g, "");
