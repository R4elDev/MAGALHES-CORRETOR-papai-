"use server";
import { revalidatePath } from "next/cache";
import * as properties from "@/lib/dal/properties";
import * as features from "@/lib/dal/features";
import { adminAction } from "../guard";
import { ok } from "../result";
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
  const payload = propertyToDal(d);
  let id = d.id;
  if (id) await properties.update(id, payload);
  else {
    const created = await properties.create(payload);
    id = created.id;
  }
  await features.attach(id!, d.featureIds);
  refresh(id);
  return ok({ id: id! }, d.id ? "Imóvel atualizado." : "Imóvel criado.");
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
