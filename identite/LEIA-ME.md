# Identidade 2026-10-28: proprietária, logo e cartela

Ajustes pedidos em 28/10/2026 (pacote `Desktop/La-Dependance-Ajustes-Proprietaria-Identidade`):
trocar a mulher no D pela proprietária, usar a logo fornecida e aplicar a cartela oficial
oliva **#535544** / bege **#D6CCC0**. Estrutura, textos, links e animações do modelo 3 não mudaram.

| Arquivo | O que é |
| --- | --- |
| `hero-portrait-D.png` | Plano do hero, 1135 × 1386 RGBA, **mesma composição do plano aprovado** (`images/master/hero-portrait-D.png`): mesmo D, mão, camisa e recorte. |
| `reservation-scene.png` | Cena do telefone do kit; só a marca na tela e a cor do botão mudaram. |
| `logo/` | Logo fornecida (oliva para fundos claros, bege para escuros), SVG e PNG do pacote. |
| `migracao-cores.json` | Correspondência das cores antigas para as novas. |

## Como o retrato foi feito

1. Base: o plano aprovado sobre fundo neutro. Máscara só na cabeça e no cabelo.
2. Higgsfield, Nano Banana 2.1 em modo inpaint (2k), com a foto da proprietária como
   referência de identidade. Três variantes; escolhida a mais fiel ao rosto
   (job `a9220644-127c-48ba-a7fb-255b5518d924`). O D, a mão e a camisa ficaram iguais
   (deslocamento medido de 0,5 px).
3. Recorte: alfa do plano aprovado nas bordas do D, alfa do removedor de fundo do
   Higgsfield no interior (cabelo, pescoço, vão entre os dedos), cor de borda descontaminada.
4. D de ameixa para oliva: `scripts/recolor-d.py` (detecção por cor na zona do D medida no
   plano aprovado; a luminosidade da foto é mantida, então luz e sombra continuam).

A tela do telefone é refeita por `scripts/phone-logo.py`: a área da marca antiga é repintada
com o gradiente da própria tela, a logo nova entra no ângulo da tela (10,9°) e o botão passa
para oliva. Mão, moldura, luz e enquadramento são os pixels originais.

A foto original da proprietária não está no repositório (repo público); ela fica no pacote
de ajustes no Desktop.
