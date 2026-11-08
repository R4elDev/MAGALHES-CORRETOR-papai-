// ÚNICO ponto que conhece os nomes de colunas do DAL (@/types/db). Ajustar aqui se o contrato mudar.
import type { PropertyFormData } from "./forms";

export function propertyToDal(d: PropertyFormData) {
  return {
    code: d.code, title: d.title, description: d.description ?? null,
    type: d.type, purpose: d.purpose, price: d.price,
    condo_fee: d.condoFee, iptu: d.iptu,
    area_useful: d.areaUseful, area_total: d.areaTotal,
    bedrooms: d.bedrooms, bathrooms: d.bathrooms, suites: d.suites, parking: d.parking,
    city: d.city, state: d.state, neighborhood: d.neighborhood,
    address: d.address ?? null, hide_address: d.hideAddress,
    latitude: d.latitude, longitude: d.longitude,
    status: d.status, featured: d.featured,
  };
}
