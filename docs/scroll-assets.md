# Personagem nas faixas

Ferramenta: imagegen integrada ao Codex, edição com transparência.

Referência preservada: `imagens/Imagens de corpo Inteiro/Imagem do ChatGPT 8 de nov. de 2026, 19_44_32-5.png`.

Saída: `public/magalhaes/corpo/pose-casa-transparente-v1.png`.

## Uso na home preservada de 2a07184

- Como funciona: rosto casa nos olhos recortado sobre faixa azul à direita. No mobile, rosto e título lado a lado, com os passos abaixo.
- Sobre: faixa laranja no espaço do retrato existente; texto e grid preservados.
- Contato: rosto de aprovação sem óculos à direita do texto existente, sem faixa ou fundo de cor.
- O quadro do catálogo usa novamente o ícone pensativo original, em 96 px, agora com fundo transparente. Hero, busca, textos e ordem das seções foram preservados.

O corpo usa o PNG alpha de 1122 × 1402, sem uma segunda compressão de origem. `next/image` entrega AVIF/WebP com `quality={90}` e `sizes` de 288/320 px, com resolução para DPR 2/3. O rosto de aprovação original (312 × 427) é exibido em um slot de 112 × 96 px, com `object-fit: contain`; nenhuma arte é cortada em círculo. Não são usados data URIs nem imagens remotas.

`CharacterBand` acompanha continuamente a posição do slot estável: `p = clamp((0.9 × alturaViewport − topSlot) / (0.5 × alturaViewport), 0, 1)`. Ao descer, a arte entra gradualmente; ao subir, a mesma faixa de rolagem desfaz o movimento. Depois que o slot passou acima, permanece visível. Um listener passivo de scroll agenda no máximo um `requestAnimationFrame`; somente opacity e transform do wrapper decorativo recebem estilos diretos, sem renderizações React por pixel nem animações de tamanho. `data-progress` no slot expõe o valor para QA. SSR, ausência de JS e reduced-motion mantêm a arte totalmente visível. Mudanças de reduced-motion durante a sessão também são respeitadas. Texto e controles nunca são ocultados.

Exemplo com viewport de 800 px: topSlot 720/620/520/420/320 corresponde a progresso 0/0.25/0.5/0.75/1. Reverter as mesmas posições reverte a animação. O progresso permanece 1 com topSlot negativo.

QA solicitado ao Farol: CI cloud (testes, tipos, build), capturas 320/390/1440, overflow, casa/mãos/rosto inteiros e nítidos, reentrada após rolar para baixo e para cima, reduced-motion, navegação por teclado e conteúdo visível sem JS. Somente preview, sem promoção para produção.

QA inicial de 2f8ef29: CI verde, SSR com três decorações visíveis, reentrada nos dois sentidos confirmada. `currentSrc` confirmou q=90, imagem da casa w=384 em 320 CSS px com DPR1; seleção retina via srcset preservada. Correção posterior: entrada/saída usa opacity + scale(0.97), sem deslocamento horizontal que causava overflow em 320px. O toggle de reduced-motion foi revisado por código; a ferramenta de QA do Farol não permite emular a preferência, então não foi validado em runtime.

## Prompt final

Use case: background-extraction. Edit the provided image only to remove the white background and ground shadow, output a true transparent PNG cutout. Preserve the EXACT existing illustrated realtor character identity, pose, friendly facial expression, curly hair, salt pepper beard, black blazer, white shirt, jeans and white sneakers and the small model house held on his hand. Keep the entire body, all fingers, the complete house roof and feet within the frame. Do not redesign or relight, no new objects, no text, no colored backdrop, no white halo; clean fine hair edges and actual alpha transparency. This asset will be placed on navy and orange website section backgrounds.
