// Config de IA 100% por env, SEM modelo/chave default. Puro (sem server-only) para ser testável.
// O wrapper server-only está em lib/ai/env.ts. Nunca usar NEXT_PUBLIC_ aqui.

export type ProviderConfig = { provider: string; baseUrl: string; apiKey: string; model: string };
export type EmbeddingConfig = ProviderConfig & { dims: number | null };

export type AiConfig = {
  chat: ProviderConfig | null;
  embedding: EmbeddingConfig | null;
  /** nomes das variáveis que faltam (nunca valores) */
  missing: { chat: string[]; embedding: string[] };
};

type Env = Record<string, string | undefined>;
const val = (v: string | undefined) => (v && v.trim() ? v.trim() : "");

export function parseAiConfig(env: Env): AiConfig {
  const chatReq = {
    AI_PROVIDER: val(env.AI_PROVIDER),
    AI_BASE_URL: val(env.AI_BASE_URL),
    AI_API_KEY: val(env.AI_API_KEY),
    AI_MODEL: val(env.AI_MODEL),
  };
  const missingChat = Object.entries(chatReq).filter(([, v]) => !v).map(([k]) => k);

  // Base do embedding: própria, ou a do chat SÓ quando o provedor é o mesmo.
  const embProvider = val(env.EMBEDDING_PROVIDER);
  const embBase =
    val(env.EMBEDDING_BASE_URL) || (embProvider && embProvider === chatReq.AI_PROVIDER ? chatReq.AI_BASE_URL : "");
  const embReq = {
    EMBEDDING_PROVIDER: embProvider,
    EMBEDDING_MODEL: val(env.EMBEDDING_MODEL),
    EMBEDDING_API_KEY: val(env.EMBEDDING_API_KEY),
    EMBEDDING_BASE_URL: embBase,
  };
  const missingEmb = Object.entries(embReq).filter(([, v]) => !v).map(([k]) => k);

  const dimsRaw = Number(val(env.EMBEDDING_DIMS));
  const dims = Number.isInteger(dimsRaw) && dimsRaw > 0 ? dimsRaw : null;

  return {
    chat: missingChat.length
      ? null
      : { provider: chatReq.AI_PROVIDER, baseUrl: chatReq.AI_BASE_URL, apiKey: chatReq.AI_API_KEY, model: chatReq.AI_MODEL },
    embedding: missingEmb.length
      ? null
      : { provider: embProvider, baseUrl: embBase, apiKey: embReq.EMBEDDING_API_KEY, model: embReq.EMBEDDING_MODEL, dims },
    missing: { chat: missingChat, embedding: missingEmb },
  };
}

export type Capabilities = { chat: boolean; semantic: boolean };
export const capabilities = (c: AiConfig): Capabilities => ({ chat: !!c.chat, semantic: !!c.embedding });
