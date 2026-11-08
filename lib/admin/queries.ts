import "server-only";
import { requireAdmin } from "@/lib/auth";
import * as properties from "@/lib/dal/properties";
import * as propertyImages from "@/lib/dal/propertyImages";
import * as features from "@/lib/dal/features";
import * as leads from "@/lib/dal/leads";
import * as visits from "@/lib/dal/visits";
import * as siteSettings from "@/lib/dal/siteSettings";
import { dashboardStats } from "@/lib/dal/stats";
import type { LeadStatusValue, PropertyStatusValue } from "./constants";

// Toda query admin autoriza antes de ler. Sem mocks: o que o DAL devolver é o que a tela mostra.

export async function getDashboard() {
  await requireAdmin();
  return dashboardStats();
}

export async function listAdminProperties(opts: { status?: PropertyStatusValue; q?: string; page?: number }) {
  await requireAdmin();
  return properties.list({ status: opts.status, q: opts.q }, opts.page ?? 1);
}

export async function getAdminProperty(id: string) {
  await requireAdmin();
  const [property, images, allFeatures] = await Promise.all([
    properties.getById(id),
    propertyImages.list(id),
    features.list(),
  ]);
  return { property, images, allFeatures };
}

export async function getFeatureCatalog() {
  await requireAdmin();
  return features.list();
}

export async function listAdminLeads(opts: { status?: LeadStatusValue; page?: number }) {
  await requireAdmin();
  return leads.list({ status: opts.status, page: opts.page ?? 1 });
}

export async function getAdminLead(id: string) {
  await requireAdmin();
  const [lead, history] = await Promise.all([leads.getById(id), leads.history(id)]);
  return { lead, history };
}

export async function listAdminVisits(opts: { status?: string; page?: number }) {
  await requireAdmin();
  return visits.list(opts);
}

export async function getAdminSettings() {
  await requireAdmin();
  return siteSettings.get();
}

/** Opções de imóvel para selects (agenda/CRM). */
export async function propertyOptions() {
  await requireAdmin();
  const res = await properties.list({}, 1);
  return res.items.map((p) => ({ id: p.id, label: `${p.code} — ${p.title}` }));
}
