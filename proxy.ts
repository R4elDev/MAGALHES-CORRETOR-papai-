export { proxy } from "./lib/supabase/proxy";

// Next exige `config` estático neste arquivo (não pode ser reexportado).
export const config = { matcher: ["/admin/:path*"] };
