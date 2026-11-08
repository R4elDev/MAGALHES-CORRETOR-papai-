# Magalhães Corretor

Plataforma imobiliária: site público, busca guiada e painel administrativo. Next.js (App Router) + TypeScript + Tailwind + Supabase (Postgres/Auth/Storage, pgvector).

> **Estado:** código-fonte escrito, **build ainda não validado**. Este README descreve o fluxo previsto; os comandos abaixo só valem depois do primeiro `npm install` + `build` bem-sucedidos. A IA (RAG/chat) é a última etapa e está desligada.

## Requisitos
Node >= 22.12 (testado com 26), npm.

## Configuração
1. `cp .env.example .env.local` e preencha com as chaves **do projeto Supabase "Magalhaes Corretor (papai)"**. Nunca use chaves de outros projetos. `SUPABASE_SERVICE_ROLE_KEY` só no servidor.
2. Banco: as migrations em `supabase/migrations/` ainda **não foram aplicadas**. Aplicar somente após revisão e autorização do responsável (ver `docs/config-schema.md`).
3. Primeiro admin: criado pelo dono da conta (passos em `docs/config-schema.md`).

## Comandos
```
npm install
npm run dev        # desenvolvimento
npm run typecheck
npm test
npm run build && npm start
```

## Catálogo
O site exibe somente imóveis publicados no banco. Sem imóveis cadastrados, mostra estado vazio. Não há dados fictícios em produção.

## Documentação
`docs/brief.md` (escopo), `docs/CONTRATO-site.md` (site/UI/WhatsApp), `docs/CONTRATO-supabase.md` (banco/DAL), `docs/config-schema.md` (schema e bootstrap).

## Publicação
Pendente: só após build validado e revisão. Projeto Vercel próprio deste repositório; não reutilizar projetos nem credenciais de outros produtos.
