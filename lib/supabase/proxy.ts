import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Renova a sessao em cada request e protege /admin (exceto /admin/login).
 * Uso (Farol, em proxy.ts na raiz): `export { proxy } from "./lib/supabase/proxy"` com
 * `export const config = { matcher: ["/admin/:path*"] }`.
 * Isto e so a 1a barreira (UX); a autorizacao real e requireAdmin() + RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  if (!data.user && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
