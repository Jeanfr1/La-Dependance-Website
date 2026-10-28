# Identidade 2026-10-28: proprietária, logo e cartela

Ajustes pedidos em 28/10/2026 (pacote `Desktop/La-Dependance-Ajustes-Proprietaria-Identidade`):
trocar a mulher no D pela proprietária, usar a logo fornecida e aplicar a cartela oficial
oliva **#535544** / bege **#D6CCC0**. Estrutura, textos, links e animações do modelo 3 não mudaram.

| Arquivo | O que é |
| --- | --- |
| `hero-portrait-D.png` | Plano do hero do pacote (`01-hero/hero-portrait-D.png`, 1134 × 1387 RGBA, bytes idênticos): a proprietária no D oliva. |
| `reservation-scene.png` | Cena do telefone do kit; só a marca na tela e a cor do botão mudaram. |
| `logo/` | Logo fornecida (oliva para fundos claros, bege para escuros), SVG e PNG do pacote. |
| `migracao-cores.json` | Correspondência das cores antigas para as novas. |

## Retrato no D

O site usa o plano do pacote sem alteração de pixels, na mesma escala do plano aprovado
(0,411 px do board por px da imagem) e com a mesma caixa animada. Ele foi deslocado 32 px do
board para a direita (`src/data/board.js`, `plates.portrait.x` = 328,8) porque a haste do D,
mais larga que a do plano anterior, cobria o ponto final de « À PART. ». Escala, rotação,
recorte do arco e todas as animações são as do modelo aprovado.

Em 28/10/2026 foi testada uma versão refeita no Higgsfield sobre o plano antigo (inpaint da
cabeça); a cliente preferiu este plano do pacote, mais nítido e realista.

A tela do telefone é refeita por `scripts/phone-logo.py`: a área da marca antiga é repintada
com o gradiente da própria tela, a logo nova entra no ângulo da tela (10,9°) e o botão passa
para oliva. Mão, moldura, luz e enquadramento são os pixels originais.

A foto original da proprietária não está no repositório (repo público); ela fica no pacote
de ajustes no Desktop.
