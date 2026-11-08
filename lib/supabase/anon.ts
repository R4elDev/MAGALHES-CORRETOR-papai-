import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente anonimo SEM cookies: leitura publica (views public_*). Nao torna a pagina dinamica.
 * O anon so enxerga o que as views/policies liberam (published, sem endereco privado).
 */
export function createAnonClient() {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
