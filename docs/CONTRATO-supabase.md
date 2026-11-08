# CONTRATO Supabase / DAL / Auth — Magalhães Corretor (v0, rascunho)

Dono: Supabase-especialista (supabase/**, lib/supabase/**, lib/db/**, lib/dal/**, lib/auth, lib/schemas/**, types/db).
Consumidor: PrismaImob (app/admin/**, components/admin/**, lib/admin/** — actions + UI).
Nexo (RAG): dono do pipeline/worker de jobs, conector e modelo de embeddings.
Farol: integrador, dono de package.json / globals.

Status: PROPOSTA — ajustável por 1 rodada. Nada aplicado no banco ainda. Sem segredos neste arquivo.

## Decisões
- **Acesso a dados: supabase-js (@supabase/ssr). Sem Prisma.** Tipos gerados em `@/types/db` a partir do schema.
- RLS é a barreira real; DAL é conveniência server-only (`import "server-only"`).
- Migrations só ADITIVAS (sem DROP/TRUNCATE), em `supabase/migrations/`.
- Chaves: só em `.env.local` / Vercel deste projeto. Cliente de browser usa só anon/publishable.

## Auth — `@/lib/auth` (server-only)
```ts
type AdminSession = { id: string; email: string; role: 'admin' | 'editor' }
requireAdmin(): Promise<AdminSession>        // redirect('/admin/login') se não for admin
getAdminSession(): Promise<AdminSession | null>
signInAdmin(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>
signOutAdmin(): Promise<void>
```
Admin = usuário em `auth.users` + linha em `admin_users`. Bootstrap do 1º admin é feito pelo dono da conta (sem credenciais inventadas).

## DAL — `@/lib/dal/*` (server-only; quem implementa: Supabase-especialista)
Mutations do DAL **já enfileiram o outbox** (decisão: PrismaImob só chama o DAL). Enfileiramento é via trigger no banco (transacional), não via código — não há `enqueue*` para chamar à mão.
- `properties`: `list(filters, page)`, `getById`, `create`, `update`, `setStatus(id, status)`, `remove`
- `propertyImages`: `list`, `add`, `remove`, `setCover`, `reorder(ids[])`
- `features`: `list`, `attach/detach(propertyId, ids[])`
- `leads`: `list({status,page})`, `getById`, `updateStatus`, `addActivity(leadId, {type,note})`, `history`
- `leadProperties`, `visits` (CRUD + status), `siteSettings` (get/update — SEM chaves de IA)
- `dashboardStats(): DashboardStats` (dados reais)

## Enums (propostos)
- `property_status`: `draft | published | reserved | sold | rented | archived`
- `lead_status`: `new | first_contact | negotiating | visit_scheduled | done | lost`
- `lead_contact_kind`: `click | confirmed | manual` (click = clique no WhatsApp; confirmed = contato efetivo; manual = cadastrado pelo admin)
- `visit_status`: `scheduled | done | cancelled | no_show`

## Storage
- Bucket `property-images`: leitura pública só de assets de imóveis `published`; escrita só admin.
- `uploadPropertyImage(propertyId, File|Buffer, meta) -> {path,url,width,height}`; `deletePropertyImage(path)`; `uploadSiteAsset(kind: 'logo'|'avatar', file)`.
- Rascunho nunca fica público (policy de leitura checa status do imóvel).

## Privacidade / acesso público
- Público lê **apenas** via view/RPC `public_properties` (published/disponível) — **sem endereço exato** e sem campos CRM/PPI.
- Leads: público só via endpoint server (zod + rate limit + consentimento); **sem SELECT público**.
- CRM/PPI, visitas, atividades, auditoria: admin only.

## Nexo / pgvector
- Extensão `vector`; `property_embeddings.embedding vector(N)` — **N configurável** (default 1536, definido na migration por um único parâmetro; trocar = nova migration aditiva).
- Outbox `index_jobs` (property_id, reason: created|updated|published|unpublished|deleted, status, attempts, locked_at). Enfileirado por trigger na mesma transação do imóvel.
- RPCs (service_role only): `claim_index_jobs(batch int)`, `complete_index_job(id)`, `fail_index_job(id, err)`.
- RPC pública de busca: `search_properties(query_embedding, filters jsonb, limit)` — só published, sem endereço.
- Invalidação: despublicar/arquivar/excluir remove/ignora embedding.

## Tipos — `@/types/db`
`Property, PropertyImage, Feature, Lead, LeadStatus, Visit, SiteSettings, DashboardStats`. Zod base em `@/lib/schemas/*` (property, lead, visit, settings) — PrismaImob pode estender.

## Pontos em aberto
- Confirmar projeto/ref no painel da outra conta (nome exato "Magalhaes corretor papai").
- Dimensão final do embedding (Nexo).

## Ajustes acordados com Nexo (v0.2)
- Outbox `index_jobs`: colunas id, property_id, op (`upsert|invalidate`), doc_hash, status (`pending|processing|done|failed|dead`), attempts, run_after, locked_at, locked_by, last_error, created_at. Substitui o `reason` da v0. Dedupe: 1 pending por property.
- `property_embeddings(property_id, doc_hash, model, dims, embedding vector, updated_at)`; dimensão numa única constante da migration; sem índice HNSW até haver modelo; sem dado fake.
- RPCs service_role: `claim_index_jobs(p_limit,p_worker,p_lease_seconds)` (SKIP LOCKED + lease), `complete_index_job`, `fail_index_job` (backoff, dead após N), `upsert_property_embedding`, `search_properties_hybrid`, `get_properties_for_response`.
- Disponível = `status='published' AND deleted_at IS NULL`. price `numeric(14,2)` BRL.
- **Endereço exato:** RLS é por linha, não esconde coluna. Anon NÃO tem SELECT em `properties`; leitura pública via view `public_properties` (sem endereço/CRM/PPI). As RPCs de busca/resposta também não devolvem endereço.
- Renda (lead_preferences) só admin/service; nunca em URL/log.

## v0.3 (2026-11-08) — o que existe em arquivo (nada aplicado no banco)
Projeto: Magalhaes Corretor ( papai ), ref rnmoztsnjmkpykucrmnk. Migrations aguardam revisao do root.

Paths: `lib/supabase/{env,server,anon,service,browser,proxy}.ts` · `lib/auth.ts` · `lib/storage.ts` · `lib/db/errors.ts` · `lib/dal/{properties,propertyImages,features,leads,visits,siteSettings,stats,public}.ts` · `types/db.ts`.

- Admin (sessao do admin + RLS): `@/lib/dal/*`; `list` retorna `{items,total,page,pageSize,hasMore}`. Exclusao de imovel e logica (deleted_at).
- Publico (anon, so views `public_properties`, `public_property_images`, `public_property_features`, `public_site_settings`): `@/lib/dal/public` -> `listPublishedProperties(filters,page,sort)`, `getFeatured(limit)`, `getPublishedBySlug(slug)`, `getSiteSettings()`, `recordPropertyView(id)`. Tipos `PropertyCard`, `PropertyDetail` (camelCase) em `@/types/db`.
- Fotos: bucket `property-images` PRIVADO; URLs assinadas (6h) geradas a cada leitura (`signPhotoUrls` em `@/lib/storage`). Nao persistir `url`. Logo/avatar: bucket publico `site-assets`.
- Endereco/coordenada exata: `property_private`. A view publica so mostra endereco se `address_public`; senao lat/lng arredondados (~1 km).
- Nexo: `createServiceClient()` em `@/lib/supabase/service`. `get_properties_for_response` devolve code, status, lat, lng, cover_path, image_paths (paths; assinar com `signPhotoUrls`). `search_properties_hybrid` aceita city, neighborhood, type, purpose, min_price, max_price, min_bedrooms, min_bathrooms, min_parking; ordem deterministica.
- `site_settings`: colunas planas (business_name, whatsapp, ..., featured_limit, logo_url, avatar_url); alias `whatsapp_number` na leitura publica.
- Farol: ligar `proxy.ts` -> `lib/supabase/proxy.ts` (matcher `/admin/:path*`). Env: ver `.env.example`.
