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

## Estado real (2026-11-08)
- Migrations 0001-0005 **aplicadas** no projeto `rnmoztsnjmkpykucrmnk` (banco estava vazio; aprovado pelo root/Codex).
- Verificado: 18 tabelas, todas com RLS; 17 policies (public + storage); 4 views públicas; buckets `property-images` (privado) e `site-assets` (público); pgvector instalado.
- Testes `supabase/tests/rls.sql` (41 casos: anon, usuário comum, admin, outbox, RPCs, RPC atômica, storage) rodaram **antes e depois** do apply com 0 falhas, em transação com rollback forçado. Nenhuma fixture persistiu (0 imóveis/contas/jobs/objetos).
- `.env.local` criado (ignorado pelo git) com URL, chave publicável e chave secreta deste projeto. Nada impresso em log/chat. `EMBEDDING_MODEL` vazio de propósito.
- Auth: **0 usuários** existentes. Nenhuma conta foi criada pelo agente.

## Handoff do usuário: criar o primeiro admin (2 minutos)
1. Painel do projeto "Magalhaes Corretor ( papai )" → Authentication → Users → **Add user → Create new user**; informe SEU e-mail e uma senha que só você conhece (marque "Auto Confirm User"). Não envie a senha a ninguém.
2. SQL Editor → rode (troque o e-mail):
   `insert into public.admin_users (user_id, email) select id, email from auth.users where email = 'SEU_EMAIL';`
3. Authentication → Sign In / Providers → Email → desligue **Allow new users to sign up** (ninguém se auto-cadastra).
4. Login em `/admin/login` com esse e-mail e senha.

## Vercel (Farol, depois da revisão)
Definir no projeto Vercel DESTE site: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (somente servidor, nunca `NEXT_PUBLIC_`). Valores: copiar do `.env.local` local sem colar em chat/commit.
