import { createHash } from "node:crypto";
import type { PropertyCard } from "./types";

/** Texto indexado. Sem endereço exato, sem preço (preço muda; sempre confirmado no banco). */
export function buildPropertyDocument(c: PropertyCard): string {
  const parts = [
    c.title,
    c.type && `Tipo: ${c.type}`,
    c.purpose && `Finalidade: ${c.purpose}`,
    [c.neighborhood, c.city].filter(Boolean).join(", ") && `Local: ${[c.neighborhood, c.city].filter(Boolean).join(", ")}`,
    c.bedrooms != null && `Quartos: ${c.bedrooms}`,
    c.bathrooms != null && `Banheiros: ${c.bathrooms}`,
    c.parking != null && `Vagas: ${c.parking}`,
    c.areaM2 != null && `Área: ${c.areaM2} m²`,
    c.features.length > 0 && `Comodidades: ${[...c.features].sort().join(", ")}`,
    c.description,
  ];
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n");
}

export const docHash = (doc: string) => createHash("sha256").update(doc).digest("hex");
