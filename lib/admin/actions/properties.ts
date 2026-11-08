"use server";
import { revalidatePath } from "next/cache";
import * as properties from "@/lib/dal/properties";
import { adminAction } from "../guard";
import { ok, fail } from "../result";
import { propertyFormSchema, idSchema, statusChangeSchema, featuredSchema } from "../forms";
import { propertyToDal } from "../mappers";

// Mutations do DAL já enfileiram o outbox do RAG via trigger (contrato Lastro/Nexo): nada manual aqui.
const refresh = (id?: string) => {
  revalidatePath("/admin");
  revalidatePath("/admin/imoveis");
  if (id) revalidatePath(`/admin/imoveis/${id}`);
  revalidatePath("/imoveis");
  revalidatePath("/");
};

export const saveProperty = adminAction(propertyFormSchema, async (d) => {
  // UMA mutação atômica (RPC admin_save_property): properties + dados privados + comodidades, tudo ou nada.
  try {
    const saved = await properties.save({ ...propertyToDal(d), id: d.id, featureIds: d.featureIds });
    refresh(saved.id);
    return ok({ id: saved.id }, d.id ? "Imóvel atualizado." : "Imóvel criado.");
  } catch (e) {
    if ((e as { code?: string })?.code === "23505")
      return fail("Código interno já utilizado.", { code: ["Código interno já utilizado"] });
    throw e; // adminAction converte em erro recuperável genérico
  }
});

export const changePropertyStatus = adminAction(statusChangeSchema, async ({ id, status }) => {
  await properties.setStatus(id, status);
  refresh(id);
  return ok({ id, status }, status === "published" ? "Imóvel publicado." : "Situação atualizada.");
});

export const toggleFeatured = adminAction(featuredSchema, async ({ id, featured }) => {
  await properties.update(id, { featured });
  refresh(id);
  return ok({ id, featured });
});

export const deleteProperty = adminAction(idSchema, async ({ id }) => {
  await properties.remove(id);
  refresh();
  return ok(undefined, "Imóvel excluído. Ele deixa de ser recomendado pela IA automaticamente.");
});
