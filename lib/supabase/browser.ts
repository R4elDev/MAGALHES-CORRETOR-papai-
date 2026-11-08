import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser: so anon. Nao ha SELECT publico em tabelas; usar apenas se realmente preciso (ex.: realtime futuro). */
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
