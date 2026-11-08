import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { must } from "@/lib/db/errors";
import type { DashboardStats } from "@/types/db";

/** Agregados reais calculados no banco (RPC admin_dashboard_stats, so admin). */
export async function dashboardStats(): Promise<DashboardStats> {
  const supabase = await createSessionClient();
  const d = must(await supabase.rpc("admin_dashboard_stats"), "indicadores") as DashboardStats;
  return {
    ...d,
    mostViewed: (d.mostViewed ?? []).map((x) => ({ ...x, count: Number(x.count) })),
    mostInterest: (d.mostInterest ?? []).map((x) => ({ ...x, count: Number(x.count) })),
    leadsByWeek: (d.leadsByWeek ?? []).map((x) => ({ ...x, count: Number(x.count) })),
  };
}
