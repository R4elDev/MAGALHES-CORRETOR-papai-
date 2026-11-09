"use server";

import { requireAdmin } from "@/lib/auth";
import * as properties from "@/lib/dal/properties";
import * as images from "@/lib/dal/propertyImages";
import * as features from "@/lib/dal/features";
import * as leads from "@/lib/dal/leads";
import * as visits from "@/lib/dal/visits";
import { idSchema } from "../forms";
import { workspacePropertyFilters, workspaceLeadFilters, workspaceVisitFilters, type PropertyFilters, type LeadFilters, type VisitFilters } from "../workspace-types";

// Reads use the authenticated session and the same RLS as the existing admin DAL.
// No process-wide cache: results live only inside this workspace's React provider.
export async function readWorkspaceProperties(input: PropertyFilters = {}) {
  await requireAdmin();
  const filters = workspacePropertyFilters.parse(input);
  return properties.list(filters, filters.page);
}
export async function readWorkspaceLeads(input: LeadFilters = {}) {
  await requireAdmin();
  const filters = workspaceLeadFilters.parse(input);
  const [result, options] = await Promise.all([leads.list(filters), properties.listOptions()]);
  return { ...result, options: options.map((property) => ({ id: property.id, label: `${property.code} — ${property.title}` })) };
}
export async function readWorkspaceVisits(input: VisitFilters = {}) {
  await requireAdmin();
  const filters = workspaceVisitFilters.parse(input);
  const [result, options] = await Promise.all([visits.list(filters), properties.listOptions()]);
  return { ...result, options: options.map((property) => ({ id: property.id, label: `${property.code} — ${property.title}` })) };
}
export async function readWorkspaceProperty(id?: string) {
  await requireAdmin();
  if (!id) return { property: null, images: [], allFeatures: await features.list() };
  idSchema.parse({ id });
  const [property, photos, allFeatures] = await Promise.all([properties.getById(id), images.list(id), features.list()]);
  if (!property) throw new Error("Imóvel não encontrado.");
  return { property, images: photos, allFeatures };
}
