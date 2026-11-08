"use client";
import { useState } from "react";
import { loginAction } from "@/lib/admin/actions/auth";
import { Button, Field, Input } from "./ui";
import { Feedback, useAction } from "./use-action";

export function LoginForm() {
  const { pending, message, run } = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => loginAction({ email, password }));
      }}
    >
      <Field label="E-mail">
        <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Senha">
        <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Feedback message={message} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
}
