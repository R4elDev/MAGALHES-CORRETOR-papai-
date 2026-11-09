# Personagem nas faixas

Ferramenta: imagegen integrada ao Codex, edição com transparência.

Referência preservada: `imagens/Imagens de corpo Inteiro/Imagem do ChatGPT 8 de nov. de 2026, 19_44_32-5.png`.

Saída: `public/magalhaes/corpo/pose-casa-transparente-v1.png`.

## Uso na home preservada de 2a07184

- Como funciona: faixa azul à direita do título e dos passos; no mobile, abaixo em fluxo.
- Sobre: faixa laranja no espaço do retrato existente; texto e grid preservados.
- Contato: rosto de aprovação sem óculos à direita do texto existente, sem faixa ou fundo de cor.
- Hero, busca, catálogo, textos e ordem das seções não foram alterados.

O corpo usa o PNG alpha de 1122 × 1402, sem uma segunda compressão de origem. `next/image` entrega AVIF/WebP com `quality={90}` e `sizes` de 288/320 px, com resolução para DPR 2/3. O rosto de aprovação original (312 × 427) é exibido em um slot de 112 × 96 px, com `object-fit: contain`; nenhuma arte é cortada em círculo. Não são usados data URIs nem imagens remotas.

`CharacterBand` observa um slot estável com `IntersectionObserver`, sem `unobserve` na primeira entrada. O limiar de 15% permite animar a saída enquanto a arte ainda está parcialmente na viewport. Cada entrada/saída nos dois sentidos atualiza opacity e transform em 240 ms. Apenas a decoração é animada; o slot continua ocupando espaço. SSR, ausência de JS/IntersectionObserver e reduced-motion mantêm a arte visível. Mudanças de reduced-motion durante a sessão também são respeitadas. A decoração não recebe foco nem eventos de ponteiro; inputs, links, FAQ e textos ficam fora da árvore animada.

QA solicitado ao Farol: CI cloud (testes, tipos, build), capturas 320/390/1440, overflow, casa/mãos/rosto inteiros e nítidos, reentrada após rolar para baixo e para cima, reduced-motion, navegação por teclado e conteúdo visível sem JS. Somente preview, sem promoção para produção.

QA inicial de 2f8ef29: CI verde, SSR com três decorações visíveis, reentrada nos dois sentidos confirmada. `currentSrc` confirmou q=90, imagem da casa w=384 em 320 CSS px com DPR1; seleção retina via srcset preservada. Correção posterior: entrada/saída usa opacity + scale(0.97), sem deslocamento horizontal que causava overflow em 320px. O toggle de reduced-motion foi revisado por código; a ferramenta de QA do Farol não permite emular a preferência, então não foi validado em runtime.

## Prompt final

Use case: background-extraction. Edit the provided image only to remove the white background and ground shadow, output a true transparent PNG cutout. Preserve the EXACT existing illustrated realtor character identity, pose, friendly facial expression, curly hair, salt pepper beard, black blazer, white shirt, jeans and white sneakers and the small model house held on his hand. Keep the entire body, all fingers, the complete house roof and feet within the frame. Do not redesign or relight, no new objects, no text, no colored backdrop, no white halo; clean fine hair edges and actual alpha transparency. This asset will be placed on navy and orange website section backgrounds.
