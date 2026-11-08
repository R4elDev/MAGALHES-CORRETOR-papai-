import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente com a sessao do usuario (cookies). Usado pelo admin: RLS decide via is_admin(). */
export async function createSessionClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component: o refresh de cookie e feito pelo proxy (lib/supabase/proxy.ts).
        }
      },
    },
  });
}
