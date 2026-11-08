// Limite simples em memória (janela deslizante) por chave. Suficiente p/ MVP de 1 instância;
// com várias instâncias, trocar por store compartilhado. Chave = hash do IP, nunca o IP cru em log.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

export const _resetRateLimit = () => hits.clear();
