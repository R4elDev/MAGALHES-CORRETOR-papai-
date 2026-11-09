# Cabeçalho transparente e favicon proporcional

Ferramenta: imagegen integrada ao Codex. As fontes originais foram preservadas.

## Cabeçalho

Referência: `public/magalhaes/rosto/10_joia_aprovacao.png`.
Arte final: `public/magalhaes/rosto/10_joia_aprovacao-transparente-v1.png`.

Prompt final:

Use case: background-extraction. Remove ONLY the solid white background of the supplied exact smiling realtor head with thumbs-up hand. Output true transparent PNG alpha, preserving EXACT same character face, curly hair, salt-and-pepper beard, smile and complete thumbs-up hand, pose and proportions. Include all hair, ears and every finger/hand edge with a tiny transparent margin; no clipping. Do not redesign or change face/expression, do not add body, sunglasses, house eyes, colored background, circle, badge or text. No white rectangle or halo. Clean high quality edges; this is the small header illustration beside Magalhaes Corretor on a website.

## Favicon

Referência: `public/magalhaes/rosto/03_casa_nos_olhos.png`.
Arte final: `public/magalhaes/favicon-casas-v2.png`.
Integração: `app/icon.tsx` gera uma versão PNG de 64×64 com a arte quadrada, preservando proporção. O navegador recebe o ícone pequeno; a arte de origem permanece em alta resolução.

Prompt final:

Create a clean final website favicon, SQUARE 1:1. Use the exact realtor head from the reference, with curly hair, beard, smiling mouth and two small houses with red roofs over his eyes. Keep original recognizable face and proportions. Center the entire head including hair and chin, filling 88% of square height. Behind the head place a SOLID PURE WHITE FLAT ROUNDED SQUARE, filling the square edge to edge, corner radius 16%. At the very tiny exterior corner regions outside the white rounded square use FLAT SOLID NAVY #092A5E. Every other background pixel behind head is opaque pure white. Absolutely no transparency, no gray, no mist, no shadows, no frame, no outline, no bevel, no 3D white tile, no vignette, no gradient, no extra background scene. This is a crisp simple icon like an app favicon: a normal flat white rounded-square background with the illustrated head overlaid, little navy visible only in the four corners to define the rounded shape. No text, no watermark. Maintain 1:1 square canvas, never stretch the head.
