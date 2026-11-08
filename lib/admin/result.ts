// Resultado padrão das server actions: nunca lança para o cliente, erros são recuperáveis.
export type FieldErrors = Record<string, string[]>;
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export const ok = <T = undefined>(data?: T, message?: string): ActionResult<T> =>
  ({ ok: true, data: data as T, message });
export const fail = (error: string, fieldErrors?: FieldErrors): ActionResult<never> =>
  ({ ok: false, error, fieldErrors });
