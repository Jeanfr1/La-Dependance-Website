# Roteiro de movimento - Le Passage

## Pedido

Criar roteiro e instruções para a animação do site. **Não gerar vídeo.** O pacote não contém MP4, MOV, WebM ou sequência de vídeo. A gravação enviada foi apenas referência de linguagem.

## Princípio da referência

O assunto do hero permanece em cena durante a divisão entre fundos e muda sua relação com a tipografia. Para La Dépendance, o elemento que atravessa a passagem é o conjunto retrato/moldura D. O resultado é ligado à marca, sem copiar personagem, cenário, cores ou composição literal da gravação.

## Camadas entregues

1. `hero-studio.webp`: fundo fotográfico claro.
2. `hero-portrait-D.webp`: primeiro plano fotográfico transparente, retrato e D juntos.
3. Título, frase manuscrita e ações em HTML.
4. Interior real em uma máscara que se abre com a forma de um D.
5. Fotografias reais nas seções seguintes.

Os masters PNG ficam em `images/master/`. A moldura e o retrato estão no mesmo recorte; não há rig de dedos, rosto 3D ou modelo volumétrico da pessoa. Não descrever transformações de escala como uma câmera orbitando fisicamente.

## Abertura implementada

0-0,25 s: logo, navegação e conteúdo já disponíveis.

0,25-1,25 s: primeiro plano se assenta com deslocamento de 35 px na horizontal, 16 px na vertical e escala inicial de 1,025. Título entra por um pequeno deslocamento. A frase e o botão completam a composição.

1,60 s: a classe de entrada é removida. Rolar antes desse momento encerra a entrada; a página nunca fica bloqueada esperando o efeito.

## Hero para o lugar real

Área desktop: 166 svh. Palco: 100 svh, com mínimo de leitura. Mobile: 150 svh, também respeitando alturas mínimas.

O progresso é calculado pela altura efetiva da área menos a altura do palco, não por um número fixo de pixels.

| Progresso | Ação |
| --- | --- |
| 0-25% | Hero legível e retrato estável; resposta ao mouse de até 7 px x 5 px no desktop |
| 25-73% | Títulos e apresentação saem gradualmente, liberando a cena |
| 48-100% | Interior real aparece por máscara com lateral arredondada de D; a abertura cresce até ocupar a tela |
| 100% | A fotografia de destino assume a área e a próxima seção apresenta UNE ADRESSE / VOTRE PARENTHÈSE |

O primeiro plano se desloca para a direita em até 32 vw e cresce apenas 4,5%. A curva D continua reconhecível até sair. Não deformar a mão nem transformar o rosto da modelo em uma cliente real.

## Outras divisões

O ponto mais expressivo fica no hero. Nas fotos seguintes, deslocamentos curtos e entrada de título mantêm continuidade sem repetir a mesma máscara em todos os blocos.

O fundo rosa mineral é uma pausa gráfica, não um carrossel. O portfólio mantém fotografia real e tipografia em primeiro plano. A foto da equipe preserva as pessoas. A reserva termina em uma imagem de telefone e no link HTML real para Planity.

## Controle e desempenho

- Respeitar prefers-reduced-motion e economia de dados.
- O controle Mettre en pause remove movimento e área sticky, mostrando a composição estática completa.
- Gravar somente essa preferência local, sem tracking.
- Sem áudio, flashes ou bloqueio de rolagem da página.
- Nenhum player ou vídeo de fundo.
- Atualização de scroll com listener passivo e requestAnimationFrame solicitado em eventos, sem loop contínuo quando a página está parada.
- Fontes e assets locais. WebPs são versões de navegação; os PNGs master não precisam ser carregados pelo site.

## Evolução opcional, dentro da mesma direção

Se houver produção futura de um objeto 3D do D, usar o SVG do monograma como referência e manter retrato como plano independente. A entrega atual é 2.5D e não depende dessa produção adicional. Não gerar filme para suprir a implementação. Preserve o roteiro e o controle do visitante.

Os valores exatos estão em `motion/timeline.json`; a implementação em `site/styles.css` e `site/app.js`.
