"use server";
import { revalidatePath } from "next/cache";
import * as visits from "@/lib/dal/visits";
import { adminAction } from "../guard";
import { ok } from "../result";
import { visitSchema, idSchema } from "../forms";

const refresh = () => {
  revalidatePath("/admin/agenda");
  revalidatePath("/admin");
};

export const saveVisit = adminAction(visitSchema, async (d) => {
  const payload = {
    property_id: d.propertyId, lead_id: d.leadId ?? null, visitor_name: d.visitorName ?? null,
    scheduled_at: new Date(d.scheduledAt).toISOString(), notes: d.notes ?? null, status: d.status,
  };
  if (d.id) await visits.update(d.id, payload);
  else await visits.create(payload);
  refresh();
  return ok(undefined, d.id ? "Visita atualizada." : "Visita registrada.");
});

export const deleteVisit = adminAction(idSchema, async ({ id }) => {
  await visits.remove(id);
  refresh();
  return ok(undefined, "Visita removida.");
});
