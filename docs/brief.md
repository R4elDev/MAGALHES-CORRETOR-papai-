# PROJETO: MAGALHÃES CORRETOR
## Plataforma Imobiliária Inteligente com RAG, Busca Personalizada e Painel Administrativo

### 1. VISÃO GERAL DO PROJETO

Desenvolva uma plataforma web completa, moderna, responsiva e profissional para a marca **Magalhães Corretor**.

Não quero apenas uma landing page estática. Quero um sistema imobiliário funcional, composto por três módulos integrados:

1. **Site público:** apresenta o Magalhães, divulga seus imóveis e permite que visitantes encontrem oportunidades.
2. **Busca inteligente com IA e RAG:** identifica as necessidades do visitante, consulta a base de imóveis cadastrados, recomenda oportunidades compatíveis e auxilia no atendimento.
3. **Painel administrativo:** permite ao Magalhães cadastrar imóveis, acompanhar interessados e gerenciar sua operação comercial.

O principal objetivo é transformar visitantes em possíveis compradores, facilitando a descoberta dos imóveis e direcionando o atendimento comercial para o WhatsApp.

A maioria dos visitantes já conhece o corretor ou chegou até ele por indicação ou redes sociais. Portanto, evite uma página excessivamente comercial, genérica ou cheia de argumentos repetitivos sobre por que contratar o corretor.

A prioridade deve ser:

- Mostrar imóveis de maneira atraente.
- Facilitar a busca de imóveis compatíveis com cada pessoa.
- Apresentar o Magalhães de maneira humana e profissional.
- Oferecer atendimento com IA conectada aos imóveis reais.
- Encaminhar interessados qualificados ao WhatsApp.
- Permitir que o corretor controle tudo pelo painel administrativo.

---

### 2. IDENTIDADE VISUAL E DESIGN SYSTEM

**IMPORTANTE: OS ARQUIVOS VISUAIS JÁ EXISTEM NA PASTA DO PROJETO.**

As imagens, ilustrações e o personagem do Magalhães já foram desenvolvidos e disponibilizados na pasta do projeto.

Antes de desenvolver a interface:

1. Inspecionar a estrutura de arquivos do projeto.
2. Identificar as imagens e os assets visuais existentes.
3. Localizar as versões do personagem do Magalhães, incluindo expressões e poses.
4. Reutilizar esses arquivos diretamente na aplicação.
5. Preservar a aparência, as cores e a identidade visual do personagem.
6. Organizar os assets no frontend sem excluir os arquivos originais.

**Não gerar outro personagem com IA. Não criar versões alternativas nem substituir o personagem existente por imagens genéricas.**

Usar os mockups desktop e mobile já desenvolvidos como referência visual, caso estejam disponíveis na pasta.

**Paleta visual inicial:**

- Azul-marinho: `#092A5E` — cor principal.
- Azul intermediário: `#1769AA` — elementos secundários.
- Laranja: `#FF7500` — botões e elementos de destaque.
- Branco: `#FFFFFF` — fundo principal.
- Cinza claro: `#F5F7FA` — superfícies secundárias.
- Verde WhatsApp: `#25D366` — somente para elementos associados ao WhatsApp.

Fontes sugeridas: Plus Jakarta Sans ou Manrope, com Inter como alternativa para textos e dados.

**Diretrizes de design:**

- Layout premium, limpo, moderno e acolhedor.
- Espaçamento consistente e tipografia bem definida.
- Hierarquia visual que favoreça os imóveis e suas fotografias.
- Cards elegantes com bordas discretas e sombras sutis.
- Microinterações suaves e funcionais.
- Evitar gradientes exagerados, ícones decorativos desnecessários e aparência de template genérico.
- Responsividade completa: desktop, tablet e mobile.
- Mobile-first nas jornadas de descoberta e contato.
- Respeitar preferências de acessibilidade e movimento reduzido.

**Personagem do Magalhães:**

O personagem em estilo Memoji/iOS já está pronto e deve ser utilizado como um elemento de identidade da plataforma.

Ele deve aparecer estrategicamente:

- Na apresentação inicial do site.
- Na seção sobre o Magalhães.
- No botão flutuante do assistente de IA.
- No cabeçalho da conversa com a IA.
- Em chamadas para contato.

Reutilizar suas diferentes expressões e posições existentes, quando apropriado.

Não exagerar na presença do personagem a ponto de competir com as fotografias dos imóveis.

---

### 3. ESTRUTURA DA PÁGINA PÚBLICA

#### 3.1. Header

Criar um menu fixo ou sticky, discreto e moderno, contendo:

- Logo Magalhães Corretor.
- Início.
- Imóveis.
- Encontre seu imóvel.
- Sobre o Magalhães.
- Contato.
- Botão de WhatsApp.

Na versão mobile, utilizar um menu compacto e manter o contato acessível sem ocupar espaço excessivo.

#### 3.2. Hero Section

A primeira seção precisa gerar identificação e incentivar a exploração dos imóveis.

Título sugerido:

**"Seu próximo imóvel pode estar mais perto do que você imagina."**

Subtítulo:

"Encontre casas, apartamentos e oportunidades selecionadas pelo Magalhães. Explore os imóveis disponíveis ou descubra quais combinam com você."

CTAs principais:

- **Explorar imóveis**
- **Encontrar meu imóvel ideal**

Incluir o personagem existente do Magalhães e elementos visuais imobiliários, preferencialmente utilizando fotografias reais dos imóveis cadastrados.

Evitar textos publicitários exagerados.

#### 3.3. Imóveis em destaque

Esta deve ser uma das principais seções da página.

Exibir inicialmente até seis imóveis publicados, priorizando os que foram marcados como destaque no painel administrativo.

Cada card deve apresentar:

- Fotografia principal do imóvel.
- Título.
- Bairro, cidade e estado.
- Preço.
- Tipo do imóvel.
- Quantidade de quartos.
- Quantidade de banheiros.
- Vagas de garagem.
- Área em m².
- Situação do imóvel, quando relevante.
- Botão "Ver detalhes".
- Botão "Tenho interesse".

Quando disponível, apresentar etiquetas como "Novo", "Oportunidade" e "Destaque".

As informações precisam vir do banco de dados.

O botão "Tenho interesse" deve abrir o WhatsApp do Magalhães com uma mensagem personalizada contendo o imóvel selecionado, seu código e link.

Incluir um botão "Ver todos os imóveis".

#### 3.4. Catálogo de imóveis

Criar uma rota `/imoveis` com listagem completa e filtros.

Permitir pesquisar por:

- Bairro ou cidade.
- Tipo de imóvel.
- Faixa de preço.
- Quantidade de quartos.
- Número de vagas.
- Finalidade: compra ou aluguel, conforme o catálogo disponível.
- Outros atributos relevantes.

Permitir ordenar por preço, data de publicação e proximidade quando houver localização suficiente.

Usar paginação ou carregamento progressivo, mantendo URLs que permitam compartilhar os filtros.

Cada imóvel deve possuir uma página própria, por exemplo `/imoveis/[slug]`, com galeria de fotografias, características, descrição, localização aproximada, diferenciais e chamada para contato.

Não expor o endereço exato de imóveis quando o administrador optar por mantê-lo privado.

#### 3.5. Encontre seu imóvel ideal

Criar a seção mais interativa da plataforma.

Título sugerido:

**"Conta pra gente o que você procura. O Magalhães te ajuda a encontrar."**

Desenvolver uma experiência de busca guiada, semelhante a um pequeno questionário.

Não exibir um formulário enorme de uma só vez. Usar etapas curtas, indicadores de progresso e linguagem natural.

**Etapa 1 — Localização**

Perguntar:

"Onde você gostaria de morar?"

Permitir informar cidade, bairro ou região de interesse.

Oferecer opcionalmente o recurso "Buscar perto de mim", solicitando autorização explícita de geolocalização.

**Etapa 2 — Renda mensal**

Perguntar:

"Qual é aproximadamente a sua renda mensal?"

Permitir informar um valor ou selecionar uma faixa.

Explicar brevemente que essa informação ajuda a entender o orçamento, não constituindo análise de crédito.

**Etapa 3 — Investimento**

Perguntar:

"Quanto você pretende investir no imóvel?"

Permitir selecionar ou preencher o orçamento máximo.

Opcionalmente, perguntar se a pessoa pretende financiar, comprar à vista ou ainda está avaliando.

**Etapa 4 — Preferências**

Perguntar:

"Qual tipo de imóvel você procura?"

Opções como casa, apartamento, terreno e indiferente, conforme os tipos disponíveis.

Também permitir indicar número mínimo de quartos.

**Etapa 5 — Resultados inteligentes**

Ao finalizar, consultar os imóveis efetivamente cadastrados no banco de dados.

Cruzar os critérios do visitante com as características dos imóveis disponíveis.

A busca deve utilizar filtros estruturados e recuperação semântica quando necessário, através da arquitetura de RAG especificada adiante.

Apresentar:

- Imóveis compatíveis.
- Fotografias reais.
- Preços.
- Localizações.
- Características principais.
- Explicação objetiva sobre a compatibilidade.
- Botões "Ver imóvel" e "Conversar sobre este imóvel".

Se houver localização disponível, considerar proximidade geográfica real.

Não inventar imóveis ou informações para completar os resultados.

**Quando não encontrar imóveis compatíveis:**

Não apresentar uma tela vazia, uma mensagem técnica ou simplesmente "Nenhum imóvel encontrado".

Mostrar uma resposta acolhedora e orientada ao atendimento humano, como:

"Não encontrei por aqui um imóvel que combine exatamente com o que você procura neste momento. Mas vale conversar com o Magalhães! Ele pode te ajudar a avaliar outras possibilidades e encontrar uma opção que faça mais sentido para você."

Abaixo, apresentar um botão de destaque:

**"Conversar com o Magalhães no WhatsApp"**

O botão deve levar as preferências do visitante para que o corretor já entenda o que está sendo procurado.

Se houver imóveis parecidos, mostrar essas opções como alternativas, informando claramente quais critérios não foram atendidos.

**Etapa 6 — Encaminhamento**

Oferecer duas ações quando houver resultados:

1. **Ver os imóveis recomendados**
2. **Enviar minhas preferências ao Magalhães**

Na segunda ação, gerar uma mensagem de WhatsApp contendo as preferências preenchidas e, quando existirem, os códigos e links dos imóveis recomendados.

O WhatsApp deve ser aberto com a mensagem pré-preenchida, permitindo que o visitante confira e envie.

Não afirmar que a mensagem já foi entregue antes da confirmação do envio.

---

### 4. MOTOR DE RECOMENDAÇÃO COM RAG

Este é um dos componentes mais importantes do projeto.

**A inteligência artificial deve utilizar RAG — Retrieval-Augmented Generation — para responder perguntas e recomendar imóveis com base no catálogo real cadastrado pelo Magalhães.**

A IA não deve depender apenas do conhecimento do modelo nem inventar oportunidades imobiliárias.

#### 4.1. Fonte de conhecimento

A base principal será composta pelos imóveis cadastrados no painel administrativo.

Cada imóvel contém dados estruturados, tais como:

- Identificador.
- Título.
- Descrição.
- Região.
- Cidade.
- Bairro.
- Preço.
- Tipo.
- Quartos.
- Banheiros.
- Vagas.
- Área.
- Comodidades.
- Disponibilidade.
- Links e fotografias.

Esses dados devem alimentar a busca estruturada e o mecanismo de recuperação semântica.

#### 4.2. Arquitetura híbrida de busca

Não utilizar apenas busca vetorial.

Implementar uma arquitetura híbrida:

**Camada 1 — Filtros estruturados**

Utilizar PostgreSQL para consultar atributos exatos:

- Preço máximo.
- Localização.
- Tipo de imóvel.
- Quantidade mínima de quartos.
- Disponibilidade.
- Finalidade.

**Camada 2 — Recuperação semântica**

Utilizar embeddings e uma base vetorial para identificar imóveis relacionados a pedidos escritos em linguagem natural.

Sugestão: PostgreSQL com extensão `pgvector`, evitando a necessidade inicial de outro banco.

Exemplo de pedido:

"Quero um apartamento tranquilo, com espaço para minha família e perto de comércio."

O sistema deve interpretar as características mencionadas e recuperar imóveis cujas descrições e atributos sejam relevantes.

A busca semântica complementa os filtros estruturados. Ela não pode ignorar restrições obrigatórias, como imóveis vendidos ou limite de preço definido pelo usuário.

**Camada 3 — Reclassificação**

Combinar os resultados estruturados e semânticos utilizando critérios de relevância.

Priorizar:

1. Disponibilidade.
2. Região desejada.
3. Orçamento.
4. Tipo de imóvel.
5. Quantidade de quartos.
6. Preferências adicionais.
7. Similaridade semântica.

A prioridade pode ser ajustada de acordo com a intenção do usuário.

**Camada 4 — Resposta da IA**

Fornecer ao modelo somente os imóveis e dados recuperados que sejam pertinentes à consulta.

A IA poderá então explicar as recomendações em linguagem natural.

Exemplo:

"Separei duas opções em Barueri que podem fazer sentido para você. A primeira tem dois quartos e está dentro do valor que você informou. A segunda fica em uma região próxima, mas ultrapassa um pouco o orçamento."

A resposta deve ser baseada em dados reais fornecidos pelo backend.

#### 4.3. Atualização do índice RAG

Sempre que o Magalhães:

- Cadastrar um imóvel.
- Alterar sua descrição.
- Atualizar características relevantes.
- Publicar um imóvel.
- Retirar um imóvel de circulação.
- Excluir um imóvel.

O sistema deverá atualizar ou invalidar os documentos e embeddings correspondentes.

A atualização poderá ocorrer por uma fila de processamento ou mecanismo equivalente confiável.

Imóveis não publicados, vendidos ou indisponíveis não devem ser recomendados como disponíveis.

O preço e a disponibilidade devem ser sempre confirmados na base transacional antes de apresentar a recomendação final.

#### 4.4. Regras de confiabilidade

- A IA nunca pode criar um imóvel inexistente.
- Toda sugestão deve estar vinculada a um registro real.
- A IA não pode inventar preços, endereços ou condições comerciais.
- Informações ausentes devem ser tratadas como desconhecidas.
- Resultados devem respeitar disponibilidade.
- Quando possível, informar o código do imóvel recomendado.
- A renda mensal não representa aprovação automática de financiamento.
- A busca semântica deve ser utilizada para melhorar a compreensão das preferências, e não para substituir validações exatas.

---

### 5. ASSISTENTE INTELIGENTE — MAGALHÃES IA

Criar um assistente imobiliário conectado ao sistema de RAG.

**Identidade visual:**

O assistente deve aparecer como um botão flutuante com a imagem do rosto do Magalhães.

**IMPORTANTE: O AVATAR DO MAGALHÃES JÁ ESTÁ NA PASTA DO PROJETO.**

Localizar e utilizar a imagem existente. Não criar ou gerar um novo avatar.

Ao clicar, abrir uma janela de chat moderna e adaptada a desktop e mobile.

Nome sugerido: **Assistente do Magalhães**.

Mensagem inicial:

"Oi! 👋 Sou o assistente virtual do Magalhães. Posso te ajudar a encontrar um imóvel ou tirar dúvidas. O que você procura?"

Sugestões rápidas:

- Quero encontrar uma casa.
- Procuro um apartamento.
- Quero saber sobre financiamento.
- Quero falar com o Magalhães.

#### 5.1. Funcionalidades da IA

O assistente deve ser capaz de:

1. Consultar imóveis cadastrados no sistema.
2. Responder perguntas sobre imóveis específicos.
3. Interpretar pedidos em linguagem natural.
4. Utilizar o RAG para identificar imóveis relevantes.
5. Cruzar as preferências do usuário com os dados dos imóveis.
6. Recomendar opções realmente disponíveis.
7. Explicar por que determinado imóvel pode atender ao perfil.
8. Identificar quando nenhum imóvel atende aos critérios.
9. Responder dúvidas imobiliárias gerais com cautela.
10. Coletar preferências de maneira conversacional.
11. Encaminhar o visitante ao WhatsApp do Magalhães.

Exemplos de perguntas:

"Tenho renda de R$ 4.000 e quero morar em Barueri. O que você tem?"

"Você tem apartamento com dois quartos até R$ 350 mil?"

"Quero uma casa perto de Osasco."

"Tem algum apartamento com varanda e condomínio com piscina?"

"Gostei daquele apartamento. Posso falar com o Magalhães?"

#### 5.2. Comportamento quando não encontrar imóveis

Este comportamento é obrigatório.

Quando a consulta ao RAG não retornar imóveis compatíveis, o assistente deve:

1. Reconhecer que não encontrou opções correspondentes no catálogo atual.
2. Responder naturalmente, sem expor termos técnicos.
3. Evitar respostas frias ou repetitivas.
4. Não inventar imóveis para manter a conversa.
5. Sugerir uma conversa com o Magalhães para avaliar outras possibilidades.
6. Oferecer um botão para abrir o WhatsApp.
7. Encaminhar as preferências já informadas pelo usuário.

**Exemplo de resposta:**

"Olha, com essas características eu não encontrei uma opção certinha entre os imóveis disponíveis aqui. Mas o Magalhães pode te ajudar a explorar outras possibilidades e entender melhor o que se encaixa no seu perfil. Que tal falar com ele?"

Botão:

**"Falar com o Magalhães"**

A IA pode apresentar imóveis semelhantes, desde que identifique claramente as diferenças em relação ao pedido original.

Não afirmar que existem imóveis fora do catálogo sem confirmação.

#### 5.3. Personalidade do assistente

O assistente deve:

- Identificar-se como inteligência artificial.
- Falar em português brasileiro.
- Utilizar linguagem humana, próxima e profissional.
- Evitar respostas excessivamente longas.
- Ser prestativo sem parecer insistente.
- Não usar mensagens comerciais artificiais.
- Fazer perguntas complementares somente quando úteis.
- Oferecer contato humano no momento adequado.
- Não fingir ser o próprio Magalhães.

#### 5.4. Interface do chat

O chat deve possuir:

- Avatar existente do Magalhães.
- Mensagem de boas-vindas.
- Histórico da sessão.
- Indicador de resposta.
- Streaming de texto, quando suportado.
- Cards de imóveis retornados pela busca.
- Fotografias dos imóveis.
- Preços e localização.
- Botão "Ver imóvel".
- Botão "Tenho interesse".
- Atalho para WhatsApp.

Ao sugerir um imóvel, não responder somente com texto.

Sempre que possível, apresentar um card visual conectado ao imóvel do banco de dados.

O chat deve manter o contexto durante a sessão, com persistência limitada e controlada de acordo com a política de privacidade.

---

### 6. INTEGRAÇÃO DA IA COM NVIDIA

Implementar a integração da IA no backend utilizando um provedor compatível com API de chat.

Priorizar a NVIDIA NIM / NVIDIA API Catalog, caso exista um modelo adequado disponível na conta.

Permitir utilizar um modelo Hermes por outro provedor compatível, caso ele não esteja disponível diretamente na NVIDIA.

**Configuração por variáveis de ambiente:**

```env
AI_PROVIDER=nvidia
AI_BASE_URL=https://integrate.api.nvidia.com/v1
AI_API_KEY=
AI_MODEL=

EMBEDDING_PROVIDER=
EMBEDDING_MODEL=
EMBEDDING_API_KEY=
```

O identificador exato dos modelos deve ser confirmado nos respectivos provedores antes da utilização.

A geração de embeddings e o chat podem utilizar modelos diferentes.

Criar uma camada de abstração para trocar de modelo ou provedor sem reescrever o módulo.

Todas as chamadas à IA devem ocorrer no servidor.

A chave privada nunca deve ser enviada ao navegador.

Implementar:

- Streaming de respostas, quando suportado.
- Controle de timeout.
- Tratamento de erros.
- Limitação de requisições.
- Controle de consumo.
- Histórico limitado por sessão.
- Proteção contra abuso.
- Fallback amigável para atendimento por WhatsApp.
- Registro de erros sem armazenar dados desnecessários.
- Busca híbrida estruturada e semântica.
- Atualização do índice RAG.

**Ferramentas internas do assistente:**

`buscarImoveis(filtros)`

`buscarImoveisSemanticos(consulta, filtros)`

`obterDetalhesImovel(id)`

`recomendarImoveis(preferencias)`

`gerarLinkWhatsApp(contexto)`

O modelo deve solicitar essas operações; o backend deve validar os parâmetros e executar as consultas.

A IA nunca deve executar SQL arbitrário ou acessar diretamente credenciais do banco.

---

### 7. WHATSAPP E CAPTURA DE LEADS

O WhatsApp será o principal canal de conversão.

Criar mensagens dinâmicas diferentes para cada origem.

**Contato originado de um imóvel:**

"Olá, Magalhães! Vi no seu site o imóvel [código] — [título], localizado em [região], anunciado por [preço]. Tenho interesse e gostaria de conversar sobre ele. Link: [URL]."

**Contato originado da busca:**

"Olá, Magalhães! Fiz uma busca no seu site e gostaria de ajuda para encontrar um imóvel.

Região: [região]

Renda aproximada: [renda]

Investimento pretendido: [valor]

Tipo de imóvel: [tipo]

Quartos: [quantidade]

Imóveis que me interessaram: [códigos e links]

Podemos conversar?"

**Contato sem resultados:**

"Olá, Magalhães! Fiz uma busca no seu site, mas não encontrei um imóvel que atendesse exatamente ao que procuro.

Minhas preferências são:

Região: [região]

Orçamento: [valor]

Tipo: [tipo]

Quartos: [quantidade]

Gostaria de conversar para avaliar outras possibilidades."

**Contato originado do chat:**

Gerar um resumo curto das preferências e dos imóveis mencionados, sem transferir todo o histórico privado da conversa desnecessariamente.

Utilizar o formato oficial de link do WhatsApp com texto codificado corretamente.

O número do corretor deve ser configurável no painel administrativo.

Não depender de uma API paga de WhatsApp para o MVP. O envio inicial pode ocorrer pelo link de conversa.

---

### 8. PAINEL ADMINISTRATIVO

Desenvolver um sistema privado para o Magalhães administrar sua operação.

Rota sugerida: `/admin`.

A interface administrativa deve utilizar a identidade azul e laranja, mas com uma apresentação mais sóbria e funcional, semelhante a um software SaaS profissional.

Criar autenticação segura, controle de sessão e proteção de todas as rotas administrativas.

#### 8.1. Dashboard

Página inicial contendo indicadores como:

- Total de imóveis cadastrados.
- Imóveis disponíveis.
- Imóveis reservados ou vendidos.
- Novos interessados.
- Leads em atendimento.
- Imóveis mais visualizados.
- Imóveis que receberam mais demonstrações de interesse.
- Leads gerados por período.

Utilizar apenas dados reais registrados pelo sistema.

#### 8.2. Gestão de imóveis

Permitir cadastrar, visualizar, editar, publicar, despublicar e arquivar imóveis.

**Informações do cadastro:**

- Código interno.
- Título.
- Descrição.
- Tipo do imóvel.
- Finalidade.
- Preço.
- Condomínio e IPTU, quando aplicáveis.
- Área útil e total.
- Quartos.
- Banheiros.
- Suítes.
- Vagas.
- Cidade.
- Bairro.
- Endereço, com opção de ocultação pública.
- Coordenadas geográficas.
- Características e comodidades.
- Situação comercial.
- Destaque na página inicial.

**Gestão de fotos:**

- Upload de múltiplas fotografias.
- Visualização prévia.
- Definição da imagem de capa.
- Reordenação das imagens.
- Exclusão de fotografias.
- Validação de formato e tamanho.
- Otimização automática para web.

Separar o armazenamento de imagens do banco relacional.

Criar estados como rascunho, publicado, reservado, vendido, alugado e arquivado.

**Integração automática com o RAG:**

O cadastro e a edição dos imóveis devem estar conectados ao mecanismo de recuperação da IA.

Quando um imóvel for publicado ou alterado, seus dados relevantes devem ser processados para atualização dos embeddings.

Quando um imóvel ficar indisponível, deixar de recomendá-lo automaticamente.

O Magalhães não deve precisar configurar ou atualizar manualmente o RAG.

#### 8.3. Gestão de interessados — CRM

Criar uma área chamada "Interessados".

Cada registro poderá conter:

- Nome, se informado.
- Telefone, se informado.
- Origem do contato.
- Data do interesse.
- Imóvel de interesse.
- Região desejada.
- Renda ou faixa declarada.
- Orçamento.
- Preferências.
- Status comercial.
- Observações internas.
- Data do próximo contato.

**Etapas sugeridas do funil:**

Novo interesse → Primeiro contato → Em negociação → Visita agendada → Concluído.

Permitir também marcar o contato como perdido ou encerrado.

Criar ações rápidas para abrir o WhatsApp com uma mensagem relacionada ao lead.

Permitir registrar observações e histórico de mudanças de status.

Não presumir que uma conversa iniciada pelo link do WhatsApp foi efetivamente enviada ou respondida. Diferenciar cliques, contatos confirmados e registros inseridos pelo administrador.

#### 8.4. Agenda e visitas

Criar módulo simples para:

- Registrar visitas.
- Vincular visitantes a imóveis.
- Definir data e horário.
- Adicionar observações.
- Acompanhar visitas pendentes e realizadas.

Não é necessário implementar integração com calendários externos na primeira versão.

#### 8.5. Configurações

Permitir ao administrador modificar:

- Nome comercial.
- Foto e avatar do corretor.
- Número de WhatsApp.
- E-mail.
- Informações de apresentação.
- CRECI, quando aplicável.
- Links de redes sociais.
- Logo.
- Imagens institucionais.
- Conteúdos principais do site.
- Configurações de destaque.
- Mensagens comerciais padrão.

As credenciais e chaves de IA devem permanecer no ambiente seguro do servidor, fora dos campos públicos de configuração.

---

### 9. ARQUITETURA TÉCNICA

Utilizar uma stack moderna, estável e fácil de manter.

**Stack sugerida:**

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- React Hook Form.
- Zod.
- PostgreSQL.
- Prisma ORM.
- PostgreSQL com pgvector para recuperação semântica.
- Modelo de embeddings configurável.
- Supabase Storage ou serviço equivalente para imagens.
- Autenticação segura com controle de permissões.
- NVIDIA API ou provedor de IA compatível.

Não utilizar n8n como dependência da aplicação.

Organizar o código em módulos claros, separando apresentação, regras de negócio, acesso a dados, autenticação, busca, indexação RAG e serviços de IA.

**Entidades principais do banco:**

- `admin_users`
- `properties`
- `property_images`
- `property_features`
- `property_embeddings`
- `leads`
- `lead_preferences`
- `lead_properties`
- `lead_activities`
- `visits`
- `chat_sessions`
- `chat_messages`
- `site_settings`
- `audit_logs`

Criar relacionamentos, constraints, índices e migrations adequados.

Os registros de imóvel devem possuir identificadores estáveis e timestamps.

Projetar a estrutura para permitir expansão futura, sem implementar funcionalidades desnecessárias para o MVP.

---

### 10. SEGURANÇA E PRIVACIDADE

A plataforma lidará com dados pessoais, incluindo renda e preferências de moradia.

Implementar proteção compatível com a LGPD.

Requisitos:

- Política de privacidade acessível.
- Informação clara sobre as finalidades da coleta.
- Coleta mínima necessária.
- Base legal adequada para cada tratamento.
- Consentimento específico quando necessário.
- Controle de retenção e exclusão de dados.
- Restrições de acesso aos leads.
- Criptografia em trânsito.
- Validação de dados no servidor.
- Proteção contra injeção e ataques comuns.
- Controle de sessão administrativa.
- Rate limiting e proteção contra spam.
- Não exposição de dados pessoais em URLs públicas ou logs.
- Geolocalização somente com permissão explícita.
- Transparência sobre o uso da IA.

O visitante deve poder pesquisar imóveis sem criar uma conta.

---

### 11. RESPONSIVIDADE E EXPERIÊNCIA MOBILE

A experiência mobile é uma prioridade absoluta.

A maioria das ações deve poder ser realizada facilmente com uma mão.

**No mobile:**

- Header compacto.
- Imóveis com fotografias grandes.
- Cards empilhados e legíveis.
- Filtros em painel móvel.
- Formulário por etapas.
- Botões de contato grandes.
- Chat de IA em interface adaptada à tela.
- Botão flutuante de assistente sem obstruir os CTAs.
- Navegação intuitiva.
- Imagens otimizadas e carregamento rápido.

Utilizar as imagens existentes do personagem em posições adequadas a cada largura.

Evitar reproduzir a página desktop apenas reduzindo seus elementos.

---

### 12. O QUE NÃO QUERO

- Landing page genérica de imobiliária.
- Textos longos sobre "por que escolher o corretor".
- Seção de avaliações ou depoimentos de clientes.
- Imóveis fictícios apresentados como reais.
- Valores ou características inventados pela IA.
- Imagens novas geradas para substituir o personagem existente.
- Layout carregado de ilustrações.
- Botões sem funcionalidade.
- Painel administrativo feito apenas para demonstração.
- Dados estáticos substituindo consultas ao banco.
- RAG desatualizado ou desconectado do cadastro de imóveis.
- IA recomendando imóveis vendidos ou indisponíveis.
- Respostas de chat que inventem opções inexistentes.
- Informações sensíveis expostas no frontend.
- Dependência de serviços pagos não essenciais para o MVP.
- Simulações de financiamento apresentadas como aprovação real.
- Componentes visualmente bonitos, mas sem funcionalidade.

---

### 13. ESTRATÉGIA DE IMPLEMENTAÇÃO

Desenvolver o projeto em etapas, garantindo que cada módulo esteja integrado antes de avançar.

**Fase 1 — Fundação**

Configurar o projeto, design system, banco de dados, migrations, autenticação e estrutura modular.

Inspecionar os assets existentes e reutilizar o personagem e os materiais visuais da pasta do projeto.

**Fase 2 — Administração**

Implementar cadastro de imóveis, upload de fotografias, publicação e configurações do corretor.

**Fase 3 — Site público**

Desenvolver a home, listagem, filtros, páginas individuais de imóveis e botões de WhatsApp.

**Fase 4 — Busca personalizada**

Implementar o questionário, filtros estruturados, classificação e apresentação das recomendações.

**Fase 5 — RAG e assistente de IA**

Implementar:

1. Pipeline de indexação dos imóveis.
2. Geração e armazenamento de embeddings.
3. Recuperação semântica.
4. Busca híbrida com filtros estruturados.
5. Reclassificação de resultados.
6. Integração do modelo de linguagem.
7. Ferramentas de consulta aos imóveis.
8. Respostas fundamentadas nos registros.
9. Tratamento de buscas sem resultados.
10. Transferência para atendimento por WhatsApp.

**Fase 6 — CRM**

Implementar os leads, o funil comercial, observações, visitas e indicadores.

**Fase 7 — Qualidade e publicação**

Realizar testes, auditoria de segurança, otimização mobile, SEO, acessibilidade e preparação de deploy.

Criar dados de exemplo somente para desenvolvimento, identificados claramente como demonstração.

Em produção, exibir apenas imóveis realmente cadastrados e publicados pelo administrador.

---

### 14. CRITÉRIOS DE ACEITE

O projeto estará funcional quando for possível:

1. Acessar a página inicial em desktop e mobile.
2. Visualizar o personagem original do Magalhães, reutilizado a partir da pasta do projeto.
3. Explorar imóveis reais cadastrados.
4. Abrir uma página individual de imóvel.
5. Pesquisar imóveis por região e preço.
6. Preencher o questionário de busca.
7. Receber resultados calculados com base no catálogo.
8. Enviar preferências pelo WhatsApp.
9. Abrir o chat com o avatar original do Magalhães.
10. Perguntar à IA sobre imóveis e receber respostas fundamentadas nos dados recuperados pelo RAG.
11. Obter recomendações que respeitem preço, localização e disponibilidade.
12. Receber uma resposta acolhedora e convite para conversar com o corretor quando não existirem resultados.
13. Acessar o painel administrativo com autenticação.
14. Cadastrar um imóvel com várias fotos.
15. Editar, publicar e retirar um imóvel de circulação.
16. Verificar a atualização automática dos dados recuperáveis pelo RAG após alterações no catálogo.
17. Consultar leads e atualizar seus status.
18. Registrar visitas e observações comerciais.
19. Configurar o WhatsApp e os dados de contato.
20. Executar os fluxos principais sem erros de integração.

Implementar testes automatizados para:

- Regras de recomendação.
- Recuperação de imóveis pelo RAG.
- Aplicação de filtros obrigatórios.
- Atualização e invalidação dos embeddings.
- Cenários sem imóveis compatíveis.
- Proteção contra recomendações de imóveis indisponíveis.
- Autenticação e permissões administrativas.
- Geração de mensagens de WhatsApp.

Entregar um README com instruções de instalação, configuração de ambiente, banco, execução, indexação e publicação.

---

### 15. INSTRUÇÃO FINAL PARA O AGENTE DESENVOLVEDOR

Quero uma plataforma imobiliária de verdade, não somente uma interface ilustrativa.

O resultado deve equilibrar três objetivos:

**Experiência do visitante:** encontrar imóveis rapidamente e conseguir conversar com o corretor.

**Produtividade do Magalhães:** cadastrar imóveis, receber interessados e organizar sua operação sem depender de conhecimentos técnicos.

**Inteligência da plataforma:** utilizar RAG para recuperar informações reais dos imóveis cadastrados, recomendar opções coerentes com as preferências do visitante e oferecer respostas úteis e confiáveis.

A IA deve atuar como um assistente imobiliário integrado ao catálogo, nunca como um modelo generativo que inventa resultados.

Se não encontrar um imóvel compatível, deve conduzir a conversa naturalmente para o atendimento humano, explicando que o Magalhães poderá orientar o visitante sobre outras possibilidades.

**Os assets visuais e o personagem do Magalhães já estão na pasta do projeto. Utilize esses materiais.**

Antes de implementar, analise os requisitos, inspecione os arquivos existentes, proponha a arquitetura, defina as etapas de desenvolvimento e identifique dependências essenciais.

Depois, implemente incrementalmente, validando cada fluxo e evitando funcionalidades fictícias.

Preserve a identidade visual dos mockups fornecidos e priorize uma experiência moderna, confiável, simples e comercialmente eficaz.
