# CONTRATO Site público / UI / integração (dono: [SITE] Farol)

Sem segredos. Atualizado em 2026-11-08. Código-fonte pronto, **ainda não validado por build** (disco cheio impediu `npm install`).

## Estrutura de rotas
- `app/layout.tsx` neutro (html/body/fontes). Público em `app/(site)/**`. `/admin` tem layout próprio (PrismaImob).
- Públicas: `/`, `/imoveis` (filtros na URL: `q, tipo, finalidade, min, max, quartos, vagas, ordem, pagina`), `/imoveis/[slug]`, `/encontre-seu-imovel` (Nexo), `/sobre`, `/contato`, `/privacidade` (rascunho LGPD, revisão jurídica pendente).
- APIs (Nexo): `POST /api/search`, `POST /api/leads`. `proxy.ts` protege `/admin/:path*` via `lib/supabase/proxy.ts` (Lastro).

## Tokens e fontes
- Tailwind v4 `@theme` em `app/globals.css`: `navy #092A5E`, `blue #1769AA`, `orange #FF7500`, `surface #F5F7FA`, `whatsapp #25D366`, `foreground`, `muted`, `border`.
- Fontes `next/font/google`: `--font-inter` (sans), `--font-jakarta` (display).

## Dados do site (fonte única: `@/lib/dal/public`, Lastro)
`listPublishedProperties(filters,page,sort)`, `getFeatured(limit)`, `getPublishedBySlug(slug)`, `getSiteSettings()`, `recordPropertyView(id)`. Tipos camelCase em `@/types/db` (`PropertyCard`, `PropertyDetail`, `SiteSettings`). O site lê via `lib/site/data.ts`, que converte falha de banco em estado vazio honesto.
Nexo usa o próprio view-model `PropertyCard` de `@/lib/search/types` (busca); não misturar com o de `@/types/db`.

## SiteSettings (campos usados pelo site)
`business_name, logo_url, avatar_url, whatsapp_number (alias whatsapp), email, bio, creci, instagram, facebook, youtube, tiktok, default_message, hero_title, hero_subtitle, featured_limit`. O site usa `phoneOf()` (`whatsapp_number ?? whatsapp`). Sem número válido, nenhum link de WhatsApp é gerado (botões caem para `/contato`).

## WhatsApp — exports de `@/lib/whatsapp` (puro, fonte única de textos)
`normalizePhone`, `buildWhatsAppLink(phone,text?) → string|null`, `brl`, `messageForProperty`, `messageForSearch`, `messageNoResults`, `messageFromChat`, `messageForLeadFollowUp`, tipos `PropertyMsgInput`, `SearchPrefs`, `ChatSummary`. Admin usa `buildWhatsAppLink` + `messageForLeadFollowUp`; Nexo usa `buildWhatsAppLink` + mensagens de propriedade/busca/sem resultados.

## Imagens
- `@/lib/images` (server-only): `optimizeImage(buffer) → {buffer,width,height,mime:"image/webp"}`, `IMAGE_MAX_BYTES` (10 MB), `IMAGE_MAX_DIMENSION` (2000), `IMAGE_ACCEPTED_MIME`, `isAcceptedImage(mime,size)`.
- Personagem em `public/magalhaes/rosto/01..10_*.png` e `public/magalhaes/corpo/pose-01.png` (cópias; originais em `imagens/` intactos). Só `pose-01` de corpo foi copiada por falta de espaço.

## Env (nomes; valores só em `.env.local`/Vercel do projeto Magalhães)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (só servidor), `NEXT_PUBLIC_SITE_URL`, `AI_*`/`EMBEDDING_*` (IA: última etapa, nada obrigatório).

## Versões (conferidas com `npm view` em 2026-11-08; nada instalado ainda)
next 16.4.5, react/react-dom 19.3.1, typescript 7.0.2, tailwindcss + @tailwindcss/postcss 4.3.5, @supabase/ssr 0.12.7, @supabase/supabase-js 2.119.0, zod 4.6.7, react-hook-form 7.91.0, @hookform/resolvers 7.0.5, lucide-react 1.70.0, sonner 2.0.8, sharp 0.35.5, openai 7.53.0, vitest 5.1.0, server-only 0.0.1, clsx 2.1.1, tailwind-merge 3.7.0, class-variance-authority 0.7.1, @types/node 26.6.6, @types/react(-dom) 19.3.0.
Riscos a validar no 1º install: compatibilidade TypeScript 7 × Next 16.4.5; `vite` como peer do vitest 5.1.0 (pode exigir dependência explícita).
