import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { must } from "@/lib/db/errors";
import type { Paged, Visit, VisitStatus } from "@/types/db";

const PAGE_SIZE = 20;
const SELECT = "id, property_id, lead_id, visitor_name, scheduled_at, status, notes, created_at, updated_at, properties(title, code), leads(name)";

type VisitInput = {
  property_id: string; lead_id: string | null; visitor_name: string | null;
  scheduled_at: string; notes: string | null; status: VisitStatus;
};

function map(r: Record<string, any>): Visit {
  const p = Array.isArray(r.properties) ? r.properties[0] : r.properties;
  const l = Array.isArray(r.leads) ? r.leads[0] : r.leads;
  return {
    id: r.id, property_id: r.property_id, lead_id: r.lead_id, visitor_name: r.visitor_name,
    scheduled_at: r.scheduled_at, status: r.status, notes: r.notes,
    property_title: p?.title ?? null, property_code: p?.code ?? null, lead_name: l?.name ?? null,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

export async function list(opts: { status?: string; page?: number } = {}, pageSize = PAGE_SIZE): Promise<Paged<Visit>> {
  const supabase = await createSessionClient();
  const page = Math.max(opts.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  let q = supabase.from("visits").select(SELECT, { count: "exact" }).order("scheduled_at", { ascending: true }).range(from, from + pageSize - 1);
  if (opts.status) q = q.eq("status", opts.status);
  const res = await q;
  const rows = must(res, "listar visitas") as unknown as Record<string, any>[];
  const total = res.count ?? rows.length;
  return { items: rows.map(map), total, page, pageSize, hasMore: from + rows.length < total };
}

export async function create(v: VisitInput): Promise<{ id: string }> {
  const supabase = await createSessionClient();
  return must(await supabase.from("visits").insert(v).select("id").single(), "criar visita") as { id: string };
}

export async function update(id: string, v: Partial<VisitInput>): Promise<void> {
  const supabase = await createSessionClient();
  must(await supabase.from("visits").update(v).eq("id", id), "atualizar visita");
}

export async function remove(id: string): Promise<void> {
  const supabase = await createSessionClient();
  must(await supabase.from("visits").delete().eq("id", id), "excluir visita");
}
