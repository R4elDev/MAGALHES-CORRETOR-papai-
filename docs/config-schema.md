# Config do schema e bootstrap do admin (Magalhães Corretor)

Projeto Supabase: **Magalhaes Corretor ( papai )** · ref `rnmoztsnjmkpykucrmnk` · org Rede Neural · sa-east-1 · Free.
Auditoria 2026-11-08 (só leitura, painel): schema `public` vazio; nenhum conflito. Nada aplicado ainda.

## Migrations (supabase/migrations, ordem)
1. `…01_core.sql` — extensões, enums, imóveis, features, imagens, settings
2. `…02_crm.sql` — leads, preferências, atividades, visitas, chat, auditoria
3. `…03_rag_outbox.sql` — embeddings, outbox `index_jobs`, triggers, RPCs service_role
4. `…04_rls_storage.sql` — RLS, grants, views públicas, buckets/policies

Todas aditivas (sem DROP/TRUNCATE). Aplicar só com autorização do usuário.

## Modelo de acesso
- anon: nenhuma tabela. Lê `public_properties` e `public_site_settings` (sem endereço/CRM/PPI).
- authenticated: só passa se `is_admin()` (linha em `admin_users`).
- service_role (servidor): RPCs do Nexo e `create_lead`. Embeddings, `index_jobs`, `chat_*` sem policy.
- Fotos: bucket `property-images` privado; servidor gera URL assinada só de imóveis published. `site-assets` público (logo/avatar).
- Endereço exato/proprietário: tabela `property_private`, admin only.

## Bootstrap do primeiro admin (feito pelo dono da conta)
1. Painel → Authentication → Users → criar o usuário (e-mail + senha definidos pelo dono).
2. SQL Editor, trocando o e-mail:
   `insert into public.admin_users (user_id, email) select id, email from auth.users where email = 'EMAIL_DO_ADMIN';`
3. Desativar signup público em Authentication → Providers → Email (para ninguém se auto-cadastrar).

## Pendências
- Dimensão do embedding + índice HNSW: aguardam `EMBEDDING_MODEL` (Nexo/usuário).
- Chaves: o dono copia anon e service_role do painel para `.env.local` e para o env da Vercel deste projeto.
