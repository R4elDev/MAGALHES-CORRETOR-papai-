"use client";
import { useState, useTransition } from "react";
import type { ActionResult, FieldErrors } from "@/lib/admin/result";

/** Hook para chamar server actions mostrando mensagem/erros de campo recuperáveis. */
export function useAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function run<T>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) {
    setMessage(null);
    setFieldErrors({});
    start(async () => {
      try {
        const r = await fn();
        if (r.ok) {
          if (r.message) setMessage({ kind: "ok", text: r.message });
          onOk?.(r.data);
        } else {
          setMessage({ kind: "error", text: r.error });
          setFieldErrors(r.fieldErrors ?? {});
        }
      } catch {
        setMessage({ kind: "error", text: "Falha de conexão. Verifique a internet e tente novamente." });
      }
    });
  }
  return { pending, message, fieldErrors, run };
}

export function Feedback({ message }: { message: { kind: "ok" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <p
      role={message.kind === "error" ? "alert" : "status"}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${message.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
    >
      {message.text}
    </p>
  );
}
