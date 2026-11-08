import { redirect } from "next/navigation";
import { catalogHref, type SP } from "@/lib/site/params";

// O catálogo vive na home (one page). Mantém links antigos/compartilhados funcionando.
export default async function ImoveisRedirect({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Number(Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina) || 1;
  redirect(catalogHref(sp, page));
}
