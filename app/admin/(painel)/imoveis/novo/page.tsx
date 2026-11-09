import { redirect } from "next/navigation";
export default function NovoImovel() { redirect("/admin?painel=imoveis&imovel=novo"); }
