// Camada de abstração (nota sec. 6): API compatível com OpenAI via fetch, sem SDK.
// Troca de provedor/modelo = só env. Nunca importar em código de navegador.
import type { EmbeddingConfig, ProviderConfig } from "./config";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
};

export type ChatTool = { type: "function"; function: { name: string; description: string; parameters: object } };

export class AiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message); // nunca inclui chave nem corpo da requisição
  }
}

type FetchLike = typeof fetch;

async function post(cfg: ProviderConfig, path: string, body: unknown, timeoutMs: number, f: FetchLike) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await f(`${cfg.baseUrl.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new AiError(`Provedor de IA respondeu HTTP ${res.status}`, res.status);
    return res;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError(e instanceof Error && e.name === "AbortError" ? "Tempo esgotado no provedor de IA" : "Falha de rede no provedor de IA");
  } finally {
    clearTimeout(timer);
  }
}

export function createChatProvider(cfg: ProviderConfig, f: FetchLike = fetch) {
  return {
    async complete(args: { messages: ChatMessage[]; tools?: ChatTool[]; temperature?: number; timeoutMs?: number }) {
      const res = await post(
        cfg,
        "/chat/completions",
        { model: cfg.model, messages: args.messages, tools: args.tools, temperature: args.temperature ?? 0.2, stream: false },
        args.timeoutMs ?? 30_000,
        f,
      );
      const json = (await res.json()) as { choices?: { message?: ChatMessage }[] };
      const msg = json.choices?.[0]?.message;
      if (!msg) throw new AiError("Resposta do provedor sem mensagem");
      return msg;
    },
    /** Retorna o Response SSE bruto do provedor (stream: true) para a rota repassar ao navegador. */
    async stream(args: { messages: ChatMessage[]; tools?: ChatTool[]; temperature?: number; timeoutMs?: number }) {
      return post(
        cfg,
        "/chat/completions",
        { model: cfg.model, messages: args.messages, tools: args.tools, temperature: args.temperature ?? 0.2, stream: true },
        args.timeoutMs ?? 60_000,
        f,
      );
    },
  };
}

export type EmbedKind = "query" | "passage";

export function createEmbeddingProvider(cfg: EmbeddingConfig, f: FetchLike = fetch) {
  return {
    async embed(texts: string[], kind: EmbedKind, timeoutMs = 20_000): Promise<number[][]> {
      // Modelos assimétricos (ex.: família NeMo Retriever) exigem input_type; a doc oficial manda
      // "passage" ao indexar e "query" ao consultar. Só enviado para provedor nvidia.
      const body: Record<string, unknown> = { model: cfg.model, input: texts };
      if (cfg.provider === "nvidia") {
        body.input_type = kind;
        body.truncate = "END";
      }
      if (cfg.dims) body.dimensions = cfg.dims;
      const res = await post(cfg, "/embeddings", body, timeoutMs, f);
      const json = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
      const rows = [...(json.data ?? [])].sort((a, b) => a.index - b.index).map((d) => d.embedding);
      if (rows.length !== texts.length) throw new AiError("Embeddings incompletos");
      if (cfg.dims && rows.some((r) => r.length !== cfg.dims)) throw new AiError("Dimensão do embedding difere de EMBEDDING_DIMS");
      return rows;
    },
  };
}

/** pgvector aceita o literal textual "[1,2,3]" via RPC. */
export const toPgVector = (v: number[]) => `[${v.join(",")}]`;
