import "server-only";
import { parseAiConfig, type AiConfig } from "./config";

let cached: AiConfig | null = null;

/** Lê a config de IA do ambiente do servidor (nunca exposta ao navegador). */
export function getAiConfig(): AiConfig {
  return (cached ??= parseAiConfig(process.env));
}
