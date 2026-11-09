"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readWorkspaceProperties, readWorkspaceLeads, readWorkspaceVisits, readWorkspaceProperty } from "@/lib/admin/actions/workspace";
import { parseWorkspaceLocation, workspaceHref, type AdminPanel, type AdminWorkspaceAction, type WorkspaceLocation, type PropertyFilters, type LeadFilters, type VisitFilters } from "@/lib/admin/workspace-types";
import { createPropertyDraft, type PropertyDraft } from "@/lib/admin/property-wizard";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, VISIT_STATUSES, VISIT_STATUS_LABEL } from "@/lib/admin/constants";
import { buildWhatsAppLink, messageForLeadFollowUp } from "@/lib/whatsapp";
import { AdminDialog } from "./admin-dialog";
import { PropertyForm } from "./property-form";
import { WorkspaceProperties } from "./workspace-properties";
import { LeadList } from "./lead-list";
import { NewLeadForm } from "./new-lead-form";
import { VisitManager } from "./visit-manager";
import { Button, Field, Select } from "./ui";

type WorkspaceAPI = {
  activePanel: AdminPanel | null; open: (action: AdminWorkspaceAction, propertyId?: string) => void;
  close: () => void; back: () => void; refresh: (panel?: AdminPanel) => void; preload: (panel: AdminPanel) => void;
};
const depthOf = (state: unknown) => (state && typeof state === "object" && typeof (state as { adminDepth?: unknown }).adminDepth === "number" ? (state as { adminDepth: number }).adminDepth : 0);
const Context = createContext<WorkspaceAPI | null>(null);
export function useAdminWorkspace() { const value = useContext(Context); if (!value) throw new Error("AdminWorkspaceProvider ausente"); return value; }
export function AdminOpenButton({ action, propertyId, className, children }: { action: AdminWorkspaceAction; propertyId?: string; className?: string; children: ReactNode }) {
  const workspace = useAdminWorkspace();
  const panel = action === "new-property" || action === "edit-property" ? "properties" : action;
  return <button type="button" className={className} onClick={() => workspace.open(action, propertyId)} onPointerEnter={() => workspace.preload(panel)} onFocus={() => workspace.preload(panel)}>{children}</button>;
}

function useRead<T, F extends object>(reader: (filters: F) => Promise<T>, defaults: F) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters = useRef(defaults);
  const loadedAt = useRef(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const load = useCallback(async (next?: F) => {
    if (next) filters.current = next;
    const request = ++generation.current;
    pending.current = true; setLoading(true); setError(null);
    try { const value = await reader(filters.current); if (generation.current === request) { setData(value); loadedAt.current = Date.now(); } }
    catch { if (generation.current === request) setError("Não foi possível carregar os dados. Verifique sua conexão e tente novamente."); }
    finally { if (generation.current === request) { pending.current = false; setLoading(false); } }
  }, [reader]);
  const preload = useCallback(() => { if (!pending.current && Date.now() - loadedAt.current > 60000) void load(); }, [load]);
  return { data, loading, error, load, preload };
}

function ReadFeedback({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  return <>{loading && <div role="status" className="space-y-3 py-4"><p className="text-sm text-slate-500">Carregando…</p><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /></div>}{error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="mb-3 text-sm text-red-700">{error}</p><Button variant="outline" onClick={retry}>Tentar novamente</Button></div>}</>;
}

type PropertyRead = Awaited<ReturnType<typeof readWorkspaceProperty>>;
type WizardEntry = { draft: PropertyDraft; data: PropertyRead };

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [location, setLocation] = useState<WorkspaceLocation>({ panel: null, property: null });
  const locationRef = useRef(location); locationRef.current = location;
  const depthRef = useRef(0);
  const [wizardBusy, setWizardBusy] = useState(false);
  const busyRef = useRef(false); busyRef.current = wizardBusy;
  const [drafts, setDrafts] = useState<Record<string, WizardEntry>>({});
  const draftsRef = useRef(drafts); draftsRef.current = drafts;
  const commitDrafts = useCallback((update: (current: Record<string, WizardEntry>) => Record<string, WizardEntry>) => { const next = update(draftsRef.current); draftsRef.current = next; setDrafts(next); }, []);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  const wizardRequest = useRef(0);
  const properties = useRead(readWorkspaceProperties, {} as PropertyFilters);
  const leads = useRead(readWorkspaceLeads, {} as LeadFilters);
  const visits = useRead(readWorkspaceVisits, {} as VisitFilters);
  const [leadFilter, setLeadFilter] = useState("");
  const [visitFilter, setVisitFilter] = useState("");
  const readers = useRef({ properties, leads, visits }); readers.current = { properties, leads, visits };

  const writeLocation = useCallback((next: WorkspaceLocation, replace = false) => {
    setLocation(next);
    if (window.location.pathname !== "/admin") {
      const href = workspaceHref(next);
      if (replace) router.replace(href); else router.push(href);
      return;
    }
    // adminDepth counts entries pushed by the workspace, so back/close never need a guess.
    const base = (window.history.state ?? {}) as Record<string, unknown>;
    if (replace) window.history.replaceState({ ...base, adminWorkspace: true }, "", workspaceHref(next, window.location.search));
    else { depthRef.current = depthOf(base) + 1; window.history.pushState({ ...base, adminWorkspace: true, adminDepth: depthRef.current }, "", workspaceHref(next, window.location.search)); }
  }, [router]);
  useEffect(() => {
    depthRef.current = depthOf(window.history.state);
    setLocation(parseWorkspaceLocation(new URLSearchParams(window.location.search)));
    const sync = (event: PopStateEvent) => {
      const next = parseWorkspaceLocation(new URLSearchParams(window.location.search));
      const current = locationRef.current;
      const newDepth = depthOf(event.state);
      if (busyRef.current && (next.panel !== current.panel || next.property !== current.property)) {
        // Saving/uploading: undo the browser navigation instead of unmounting the form mid-flight.
        window.history.go(depthRef.current - newDepth);
        return;
      }
      depthRef.current = newDepth;
      setLocation(next);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (busyRef.current) return;
    setLocation(pathname === "/admin" ? parseWorkspaceLocation(new URLSearchParams(search)) : { panel: null, property: null });
  }, [pathname, search]);
  useEffect(() => { if (location.panel) readers.current[location.panel].preload(); }, [location.panel]);

  const loadWizard = useCallback(async (key: string, force = false) => {
    const request = ++wizardRequest.current;
    setWizardError(null);
    if (draftsRef.current[key] && !force) { setWizardLoading(false); return; }
    setWizardLoading(true);
    try {
      const data = await readWorkspaceProperty(draftsRef.current[key]?.draft.savedId ?? (key === "novo" ? undefined : key));
      if (wizardRequest.current === request) commitDrafts((current) => ({ ...current, [key]: { draft: current[key]?.draft ?? createPropertyDraft(data.property), data } }));
    } catch { if (wizardRequest.current === request) setWizardError("Não foi possível carregar este imóvel. Tente novamente."); }
    finally { if (wizardRequest.current === request) setWizardLoading(false); }
  }, [commitDrafts]);
  useEffect(() => { if (location.property) void loadWizard(location.property, !!draftsRef.current[location.property]?.draft.savedId); }, [location.property, loadWizard]);
  // Leaves the top-most layer: pops our own history entry when there is one, otherwise rewrites the URL in place.
  const leave = useCallback((panelAfter?: AdminPanel | null) => {
    const current = locationRef.current;
    const depth = depthOf(window.history.state);
    const wizardOnly = current.property !== null;
    const target: WorkspaceLocation = wizardOnly ? { panel: panelAfter === undefined ? current.panel : panelAfter, property: null } : { panel: null, property: null };
    if (depth > 0 && window.location.pathname === "/admin" && target.panel === current.panel) {
      window.history.go(wizardOnly ? -1 : -depth);
      return;
    }
    writeLocation(target, true);
  }, [writeLocation]);
  const back = useCallback(() => { if (!wizardBusy) leave(); }, [wizardBusy, leave]);
  const close = useCallback(() => {
    if (wizardBusy) return;
    const current = locationRef.current;
    if (!current.panel && !current.property) return;
    if (current.property && draftsRef.current[current.property]?.draft.savedId) void readers.current.properties.load();
    leave();
  }, [wizardBusy, leave]);
  const open = useCallback((action: AdminWorkspaceAction, propertyId?: string) => {
    if (wizardBusy) return;
    if (action === "edit-property" && (!propertyId || !parseWorkspaceLocation(new URLSearchParams({ imovel: propertyId })).property)) return;
    const current = locationRef.current;
    const next: WorkspaceLocation = action === "new-property" || action === "edit-property"
      ? { panel: current.panel, property: action === "new-property" ? "novo" : propertyId! }
      : { panel: action, property: null };
    if (next.panel === current.panel && next.property === current.property) return;
    writeLocation(next);
  }, [wizardBusy, writeLocation]);
  const refresh = useCallback((panel?: AdminPanel) => {
    const target = panel ?? locationRef.current.panel;
    if (target) void readers.current[target].load();
    router.refresh();
  }, [router]);
  const preload = useCallback((panel: AdminPanel) => readers.current[panel].preload(), []);
  const key = location.property;
  const entry = key ? drafts[key] : undefined;
  const updateDraft = (draft: PropertyDraft) => {
    if (!key) return;
    commitDrafts((current) => current[key] ? { ...current, [key]: { ...current[key], draft } } : current);
  };
  const dropDraft = (draftKey: string) => commitDrafts((current) => { const rest = { ...current }; delete rest[draftKey]; return rest; });
  const refreshImages = () => {
    if (!key) return;
    const savedId = draftsRef.current[key]?.draft.savedId;
    if (savedId) void readWorkspaceProperty(savedId).then((data) => commitDrafts((current) => current[key] ? { ...current, [key]: { ...current[key], data } } : current)).catch(() => setWizardError("As fotos foram salvas, mas a prévia não atualizou. Feche e reabra para conferir."));
  };
  const panelTitle = { properties: "Imóveis", leads: "Interessados", visits: "Agenda de visitas" };
  const leadRows = leads.data?.items.map((lead) => ({
    id: lead.id, name: lead.name, phone: lead.phone, status: lead.status, source: lead.source, contactKind: lead.contact_kind,
    createdAt: lead.created_at, propertyTitle: lead.property_title, region: lead.region, budget: lead.budget, income: lead.income,
    preferences: lead.preferences, nextContactAt: lead.next_contact_at,
    whatsappHref: lead.phone ? buildWhatsAppLink(lead.phone, messageForLeadFollowUp({ name: lead.name ?? undefined, propertyTitle: lead.property_title ?? undefined })) : null,
  })) ?? [];
  return <Context.Provider value={{ activePanel: location.panel, open, close, back, refresh, preload }}>
    {children}
    <AdminDialog open={location.panel !== null} title={location.panel ? panelTitle[location.panel] : "Administração"} description="Gerencie tudo aqui, sem sair do seu painel." onClose={close} size="xl">
      <div hidden={location.panel !== "properties"}><ReadFeedback loading={properties.loading} error={properties.error} retry={() => void properties.load()} /><WorkspaceProperties data={properties.data} loading={properties.loading} onLoad={(filters) => void properties.load(filters)} onOpen={(id) => open(id ? "edit-property" : "new-property", id)} onChanged={() => refresh("properties")} /></div>
      {location.panel === "leads" && <div className="space-y-4"><ReadFeedback loading={leads.loading} error={leads.error} retry={() => void leads.load()} />{leads.data && <><NewLeadForm properties={leads.data.options} onSaved={() => refresh("leads")} /><Field label="Etapa do atendimento"><Select value={leadFilter} onChange={(event) => { setLeadFilter(event.target.value); void leads.load({ status: (event.target.value || undefined) as LeadFilters["status"], page: 1 }); }}><option value="">Todas as etapas</option>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABEL[status]}</option>)}</Select></Field><LeadList leads={leadRows} onChanged={() => refresh("leads")} />{!leadRows.length && <p className="py-6 text-center text-sm text-slate-500">Nenhum interessado nesta etapa. Os novos contatos aparecem aqui.</p>}<Pagination data={leads.data} loading={leads.loading} onPage={(page) => void leads.load({ page, status: (leadFilter || undefined) as LeadFilters["status"] })} /></>}</div>}
      {location.panel === "visits" && <div className="space-y-4"><ReadFeedback loading={visits.loading} error={visits.error} retry={() => void visits.load()} />{visits.data && <><Field label="Situação das visitas"><Select value={visitFilter} onChange={(event) => { setVisitFilter(event.target.value); void visits.load({ status: (event.target.value || undefined) as VisitFilters["status"], page: 1 }); }}><option value="">Todas as situações</option>{VISIT_STATUSES.map((status) => <option key={status} value={status}>{VISIT_STATUS_LABEL[status]}</option>)}</Select></Field><VisitManager visits={visits.data.items.map((visit) => ({ id: visit.id, propertyId: visit.property_id, propertyTitle: visit.property_title, visitorName: visit.visitor_name, scheduledAt: visit.scheduled_at, notes: visit.notes, status: visit.status }))} properties={visits.data.options} onChanged={() => refresh("visits")} />{!visits.data.items.length && <p className="text-center text-sm text-slate-500">Nenhuma visita nesta situação.</p>}<Pagination data={visits.data} loading={visits.loading} onPage={(page) => void visits.load({ page, status: (visitFilter || undefined) as VisitFilters["status"] })} /></>}</div>}
    </AdminDialog>
    <AdminDialog open={key !== null} title={entry?.draft.existing ? "Editar imóvel" : "Cadastrar imóvel"} description="Preencha no seu ritmo. Você pode voltar às etapas e revisar tudo antes de salvar." onClose={close} onBack={back} backLabel="Voltar ao painel" busy={wizardBusy} size="lg">
      <ReadFeedback loading={wizardLoading} error={wizardError} retry={() => { if (key) void loadWizard(key, true); }} />
      {entry && <PropertyForm key={key} draft={entry.draft} features={entry.data.allFeatures} images={entry.data.images.map((image) => ({ id: image.id, url: image.url ?? "", is_cover: image.is_cover }))} onDraftChange={updateDraft} onBusyChange={setWizardBusy} onImagesChanged={refreshImages} onSaved={() => {
        if (key) dropDraft(key);
        leave("properties"); refresh("properties");
      }} onDiscard={() => {
        const hadSaved = !!(key && draftsRef.current[key]?.draft.savedId);
        if (key) dropDraft(key);
        leave(); if (hadSaved) void readers.current.properties.load();
      }} />}
    </AdminDialog>
  </Context.Provider>;
}
function Pagination({ data, loading, onPage }: { data: { page: number; hasMore: boolean }; loading: boolean; onPage: (page: number) => void }) {
  if (data.page === 1 && !data.hasMore) return null;
  return <nav aria-label="Paginação" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={loading || data.page === 1} onClick={() => onPage(data.page - 1)}>← Anterior</Button><span className="text-sm text-slate-500">Página {data.page}</span><Button variant="outline" disabled={loading || !data.hasMore} onClick={() => onPage(data.page + 1)}>Próxima →</Button></nav>;
}
