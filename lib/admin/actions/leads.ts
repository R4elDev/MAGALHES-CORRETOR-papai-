"use server";
import { revalidatePath } from "next/cache";
import * as leads from "@/lib/dal/leads";
import { adminAction } from "../guard";
import { ok } from "../result";
import { leadStatusSchema, leadNoteSchema, leadCreateSchema, leadConfirmSchema } from "../forms";

const refresh = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/interessados");
};

export const changeLeadStatus = adminAction(leadStatusSchema, async ({ id, status, nextContactAt }) => {
  await leads.updateStatus(id, status, { next_contact_at: nextContactAt ?? null });
  refresh();
  return ok(undefined, "Status atualizado.");
});

export const addLeadNote = adminAction(leadNoteSchema, async ({ leadId, note }) => {
  await leads.addActivity(leadId, { type: "note", note });
  refresh();
  return ok(undefined, "Observação registrada.");
});

/** Clique no WhatsApp nunca vira "enviado": só o administrador confirma o contato. */
export const confirmLeadContact = adminAction(leadConfirmSchema, async ({ leadId }) => {
  await leads.addActivity(leadId, { type: "contact_confirmed", note: "Contato confirmado pelo administrador" });
  refresh();
  return ok(undefined, "Contato confirmado.");
});

export const createLead = adminAction(leadCreateSchema, async (d) => {
  const created = await leads.create({
    name: d.name ?? null, phone: d.phone ?? null, region: d.region ?? null,
    budget: d.budget, income: d.income ?? null, preferences: d.preferences ?? null,
    property_id: d.propertyId ?? null, contact_kind: d.kind, source: "admin",
  });
  refresh();
  return ok({ id: created.id }, "Interessado cadastrado.");
});
