import { redirect } from "next/navigation";

// Compatibilidade: o conteúdo agora abre como painel modal sobre o dashboard.
export default function Page(): never {
  redirect("/admin?painel=interessados");
}
