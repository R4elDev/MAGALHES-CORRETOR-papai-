import type { Metadata } from "next";
import { loadSettings } from "@/lib/site/data";

export const metadata: Metadata = { title: "Política de privacidade" };

// RASCUNHO: texto-base da LGPD para revisão jurídica do responsável antes da publicação.
export default async function PrivacidadePage() {
  const { data: s } = await loadSettings();
  const contato = s?.email ?? "o contato informado na página Contato";
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed text-foreground">
      <h1 className="font-display text-3xl font-extrabold text-navy">Política de privacidade</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: a definir na publicação.</p>

      <H>Quem trata seus dados</H>
      <p>{s?.business_name ?? "Magalhães Corretor"} é o controlador dos dados coletados neste site. Dúvidas e pedidos: {contato}.</p>

      <H>O que coletamos e para quê</H>
      <ul className="mt-2 list-disc pl-6">
        <li><b>Busca guiada:</b> região, faixa de renda, orçamento, tipo e quartos, para sugerir imóveis do catálogo. A renda é só uma referência de orçamento, não é análise de crédito nem aprovação de financiamento.</li>
        <li><b>Contato:</b> nome e telefone ou e-mail, se você os informar, para o Magalhães retornar seu interesse. Só registramos com o seu consentimento.</li>
        <li><b>Localização:</b> usada apenas se você autorizar no navegador, e só para ordenar imóveis por proximidade nesta busca.</li>
        <li><b>Conversa com o assistente de IA (quando disponível):</b> o assistente é uma inteligência artificial, não o corretor. Mantemos histórico limitado da sessão.</li>
      </ul>

      <H>WhatsApp</H>
      <p>Os botões abrem o WhatsApp com uma mensagem pré-preenchida para você conferir e enviar. Nada é enviado sem a sua ação.</p>

      <H>Compartilhamento e segurança</H>
      <p>Não vendemos dados. Usamos provedores de infraestrutura (hospedagem e banco de dados) sob conexão criptografada. O acesso aos interessados é restrito ao administrador.</p>

      <H>Retenção e seus direitos</H>
      <p>Mantemos os dados pelo tempo necessário ao atendimento. Você pode pedir acesso, correção, anonimização ou exclusão a qualquer momento pelo contato acima (LGPD, art. 18).</p>
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1 mt-8 font-display text-xl font-extrabold text-navy">{children}</h2>;
}
