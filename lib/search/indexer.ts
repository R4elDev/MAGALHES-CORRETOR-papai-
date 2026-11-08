// Worker do outbox index_jobs (Lastro). Fila em memória LIMITADA: lote + concorrência fixos,
// sem reentrância. Sem embeddings configurados NÃO reivindica jobs (ficam pending; nada é fingido).
import { buildPropertyDocument, docHash } from "./document";
import { mapRow, type SearchDeps } from "./hybrid";
import { toPgVector } from "../ai/provider";

export type IndexJob = { id: string; property_id: string; op: "upsert" | "invalidate"; doc_hash?: string | null };

export type IndexerDeps = {
  rpc: SearchDeps["rpc"];
  /** null = embeddings não configurados. */
  embed: ((docs: string[]) => Promise<number[][]>) | null;
  model: string | null;
  dims: number | null;
  worker?: string;
};

export type IndexRunResult = {
  skipped?: "embedding_not_configured";
  claimed: number;
  done: number;
  failed: number;
};

export const BATCH = 10;
export const CONCURRENCY = 3;
export const LEASE_SECONDS = 120;

async function handle(job: IndexJob, d: IndexerDeps): Promise<void> {
  if (job.op === "invalidate") {
    // O vetor sai do retrieval já pelo filtro de status (RPC); aqui só fechamos o job.
    // Lastro garante remoção do vetor em complete_index_job(op=invalidate) ou no trigger.
    return;
  }
  const { data, error } = await d.rpc<Record<string, unknown>[]>("get_properties_for_response", { p_ids: [job.property_id] });
  if (error) throw new Error("get_properties_for_response falhou");
  const row = data?.[0];
  if (!row) return; // não está mais published: nada a indexar; job de invalidate cobre o vetor
  const doc = buildPropertyDocument(mapRow(row));
  const hash = docHash(doc);
  if (job.doc_hash && job.doc_hash === hash) return; // conteúdo igual: reaproveita embedding
  const [vec] = await d.embed!([doc]);
  const up = await d.rpc("upsert_property_embedding", {
    p_property_id: job.property_id,
    p_doc_hash: hash,
    p_model: d.model,
    p_dims: vec.length,
    p_embedding: toPgVector(vec),
  });
  if (up.error) throw new Error("upsert_property_embedding falhou");
}

export async function processIndexQueue(d: IndexerDeps): Promise<IndexRunResult> {
  if (!d.embed) return { skipped: "embedding_not_configured", claimed: 0, done: 0, failed: 0 };
  const claim = await d.rpc<IndexJob[]>("claim_index_jobs", {
    p_limit: BATCH,
    p_worker: d.worker ?? "nexo-worker",
    p_lease_seconds: LEASE_SECONDS,
  });
  if (claim.error) throw new Error("claim_index_jobs falhou");
  const jobs = claim.data ?? [];
  let done = 0;
  let failed = 0;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    await Promise.all(
      jobs.slice(i, i + CONCURRENCY).map(async (job) => {
        try {
          await handle(job, d);
          const r = await d.rpc("complete_index_job", { p_id: job.id });
          if (r.error) throw new Error("complete_index_job falhou");
          done++;
        } catch (e) {
          failed++;
          // erro sem dados do imóvel/segredos
          await d.rpc("fail_index_job", { p_id: job.id, p_err: e instanceof Error ? e.message.slice(0, 200) : "erro" });
        }
      }),
    );
  }
  return { claimed: jobs.length, done, failed };
}

/**
 * Chamado por instrumentation.ts (Node). IA/semântica está SUSPENSA por decisão do usuário:
 * no-op seguro e idempotente. Quando a fase de IA for liberada, passa a drenar index_jobs
 * (só com EMBEDDING_* configurado) usando processIndexQueue.
 */
export function startIndexWorker(): void {}
