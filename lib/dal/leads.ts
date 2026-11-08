import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { must } from "@/lib/db/errors";
import type { Lead, LeadActivity, LeadActivityType, LeadContactKind, LeadStatus, Paged } from "@/types/db";

const PAGE_SIZE = 20;
const SELECT =
  "id, name, phone, email, status, contact_kind, source, next_contact_at, created_at, updated_at, " +
  "lead_preferences(city, neighborhood, max_price, income_range, notes), " +
  "lead_properties(property_id, properties(title))";

function map(r: Record<string, any>): Lead {
  const pref = Array.isArray(r.lead_preferences) ? r.lead_preferences[0] : r.lead_preferences;
  const props: { property_id: string; properties: { title: string } | null }[] = r.lead_properties ?? [];
  const region = [pref?.neighborhood, pref?.city].filter(Boolean).join(", ") || null;
  return {
    id: r.id, name: r.name, phone: r.phone, email: r.email, status: r.status, contact_kind: r.contact_kind,
    source: r.source, next_contact_at: r.next_contact_at, created_at: r.created_at, updated_at: r.updated_at,
    region, budget: pref?.max_price == null ? null : Number(pref.max_price),
    income: pref?.income_range ?? null, preferences: pref?.notes ?? null,
    property_ids: props.map((p) => p.property_id),
    property_id: props[0]?.property_id ?? null, property_title: props[0]?.properties?.title ?? null,
  };
}

export async function list(opts: { status?: LeadStatus; page?: number } = {}, pageSize = PAGE_SIZE): Promise<Paged<Lead>> {
  const supabase = await createSessionClient();
  const page = Math.max(opts.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  let q = supabase.from("leads").select(SELECT, { count: "exact" }).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (opts.status) q = q.eq("status", opts.status);
  const res = await q;
  const rows = must(res, "listar leads") as unknown as Record<string, any>[];
  const total = res.count ?? rows.length;
  return { items: rows.map(map), total, page, pageSize, hasMore: from + rows.length < total };
}

export async function getById(id: string): Promise<Lead | null> {
  const supabase = await createSessionClient();
  const r = must(await supabase.from("leads").select(SELECT).eq("id", id).maybeSingle(), "buscar lead") as Record<string, any> | null;
  return r ? map(r) : null;
}

export async function history(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createSessionClient();
  return must(
    await supabase.from("lead_activities").select("id, lead_id, type, note, created_by, created_at").eq("lead_id", leadId).order("created_at", { ascending: false }),
    "historico do lead",
  ) as LeadActivity[];
}

export async function updateStatus(id: string, status: LeadStatus, extra: { next_contact_at?: string | null } = {}): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createSessionClient();
  const prev = must(await supabase.from("leads").select("status").eq("id", id).maybeSingle(), "ler status") as { status: LeadStatus } | null;
  const patch: Record<string, unknown> = { status };
  if ("next_contact_at" in extra) patch.next_contact_at = extra.next_contact_at;
  must(await supabase.from("leads").update(patch).eq("id", id), "atualizar lead");
  if (prev && prev.status !== status) {
    must(await supabase.from("lead_activities").insert({ lead_id: id, type: "status_change", note: `${prev.status} -> ${status}`, created_by: admin.id }), "registrar mudanca");
  }
}

export async function addActivity(leadId: string, a: { type: LeadActivityType; note?: string | null }): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createSessionClient();
  must(await supabase.from("lead_activities").insert({ lead_id: leadId, type: a.type, note: a.note ?? null, created_by: admin.id }), "registrar atividade");
  // so o admin transforma "clique" em "contato confirmado"
  if (a.type === "contact_confirmed") must(await supabase.from("leads").update({ contact_kind: "confirmed" }).eq("id", leadId), "confirmar contato");
}

export async function create(input: {
  name: string | null; phone: string | null; region: string | null; budget: number | null; income: number | null;
  preferences: string | null; property_id: string | null; contact_kind: LeadContactKind; source: string;
}): Promise<{ id: string }> {
  const supabase = await createSessionClient();
  const res = await supabase.from("leads").insert({ name: input.name, phone: input.phone, contact_kind: input.contact_kind, source: input.source }).select("id").single();
  const lead = must(res, "criar lead") as { id: string };
  must(await supabase.from("lead_preferences").insert({
    lead_id: lead.id, city: input.region, max_price: input.budget,
    income_range: input.income == null ? null : String(input.income), notes: input.preferences,
  }), "salvar preferencias");
  if (input.property_id) must(await supabase.from("lead_properties").insert({ lead_id: lead.id, property_id: input.property_id }), "vincular imovel");
  return lead;
}
