# Contrato de trabalho — admin em pop-ups

Base: cbeda95. Branch compartilhada: `feat/admin-workspace`. Não trocar a branch nem commitar arquivos de outro responsável. `output/` não pertence à tarefa. Sem mudanças no site público, banco, migrations ou segredos.

## Fluxo pedido

Dashboard como base estável. Imóveis, Interessados e Agenda abrem em painéis modais; novo/editar imóvel abre wizard sobre o painel ou dashboard. Configurações permanece página. Links antigos redirecionam para `/admin?painel=imoveis|interessados|agenda` e novo/editar com `imovel=novo|UUID`. Voltar e avançar nas etapas mantém todos os valores; fechar e reabrir mantém rascunho na memória da sessão, sem localStorage de dados privados. Descartar é explícito. Somente o modal ativo é interativo.

## API compartilhada (responsável fluxos)

`components/admin/admin-workspace.tsx` exporta:

- `AdminWorkspaceProvider({ children })`: envolve o shell e renderiza os painéis/wizard.
- `AdminOpenButton({ action, propertyId?, className?, children })`: client button seguro para uso em Server Components. Ações: `properties`, `leads`, `visits`, `new-property`, `edit-property`.
- `useAdminWorkspace()`: `{ activePanel, open(action, propertyId?), close(), back(), refresh(panel?), preload(panel) }`. Painéis `properties | leads | visits`.

`components/admin/admin-dialog.tsx` exporta `AdminDialog({ open, title, description?, onClose, onBack?, backLabel?, busy?, children, footer?, size? })`, size `md | lg | xl`. Dialog nativo acessível: Escape/fechar, foco contido e restaurado, rolagem interna, prevenção de perda de valores no fluxo, animação curta e reduced-motion. Responsável fluxo implementa a primitiva; responsável visual pode usar essa API sem editá-la.

## Componentes CRM/agenda (responsável visual)

- `NewLeadForm({ properties, onSaved? })`: abre formulário em AdminDialog. `onSaved` após sucesso.
- `LeadList({ leads, onChanged? })`: detalhe/notas/etapas em AdminDialog; `onChanged` após mutação.
- `VisitManager({ visits, properties, onChanged? })`: cadastrar/editar/remover em AdminDialog; `onChanged` após mutação.
- Preservar shapes atuais dos dados e exportar os tipos já usados. Callbacks opcionais; se presentes atualizam dados do workspace, sem navegação de página.

## Limites

Fluxos: workspace/dialog/wizard, imóveis e suas rotas, imagens, server actions de leitura do workspace e testes de fluxo. Visual: shell/ui/dashboard/configurações/CRM/agenda/loading/admin.css, redirecionamento rotas CRM/agenda, usa APIs acima. Desempenho: lib/auth.ts/lib/admin/queries.ts e ajustes DAL consensuais, testes de autorização/performance; sem editar UI.

Salvar imóvel continua RPC atômica existente; uploads usam actions existentes. Não criar duplicatas ao repetir após upload parcial. Não publicar imóvel implicitamente. Não armazenar segredos/PII em fixtures ou persistência do navegador. Server actions e queries continuam protegidas por requireAdmin e RLS. Não usar cache global de sessão nem service_role no browser.

Preview + CI antes de produção. QA com fixture deve ser identificado como fixture e não comprova login/RLS real. Nenhum imóvel fictício publicado. Dados reais somente leitura sem pedido adicional.
