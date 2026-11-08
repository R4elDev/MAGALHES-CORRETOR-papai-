import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * service_role: bypassa RLS. SOMENTE servidor e SOMENTE para as RPCs do worker/busca/leads
 * (claim/complete/fail_index_job, upsert_property_embedding, search_properties_hybrid,
 * get_properties_for_response, create_lead, chat_*). Nunca usar para ler dados do admin.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
