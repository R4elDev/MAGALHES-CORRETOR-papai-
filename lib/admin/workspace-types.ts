import { z } from "zod";
import { PROPERTY_STATUSES, LEAD_STATUSES, VISIT_STATUSES } from "./constants";

export type AdminPanel = "properties" | "leads" | "visits";
export type AdminWorkspaceAction = AdminPanel | "new-property" | "edit-property";
export const panelQuery = { properties: "imoveis", leads: "interessados", visits: "agenda" } as const;
export type WorkspaceLocation = { panel: AdminPanel | null; property: string | null };
export function parseWorkspaceLocation(params: URLSearchParams): WorkspaceLocation {
  const panel = (Object.keys(panelQuery) as AdminPanel[]).find((key) => panelQuery[key] === params.get("painel")) ?? null;
  const id = params.get("imovel");
  return { panel, property: id === "novo" || z.string().uuid().safeParse(id).success ? id : null };
}
export function workspaceHref(location: WorkspaceLocation, current = ""): string {
  const params = new URLSearchParams(current);
  params.delete("painel"); params.delete("imovel");
  if (location.panel) params.set("painel", panelQuery[location.panel]);
  if (location.property) params.set("imovel", location.property);
  return `/admin${params.size ? `?${params}` : ""}`;
}
const page = z.number().int().min(1).max(10000).default(1);
export const workspacePropertyFilters = z.object({ page, q: z.string().trim().max(80).optional(), status: z.enum(PROPERTY_STATUSES).optional() });
export const workspaceLeadFilters = z.object({ page, status: z.enum(LEAD_STATUSES).optional() });
export const workspaceVisitFilters = z.object({ page, status: z.enum(VISIT_STATUSES).optional() });
export type PropertyFilters = z.input<typeof workspacePropertyFilters>;
export type LeadFilters = z.input<typeof workspaceLeadFilters>;
export type VisitFilters = z.input<typeof workspaceVisitFilters>;
