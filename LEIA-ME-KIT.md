# La Dépendance - kit completo do modelo 3

**À PART. / Le Passage** é a direção escolhida: monograma D no hero, retrato de campanha, espaço real, uma seção rosa mineral, portfólio real, equipe e reserva no Planity. Este pacote mantém essa direção e contém os materiais de marca, site e cartão.

O site público e o cartão estão em francês. README, guias e roteiros estão em português. **Não foi criado nem incluído vídeo de animação.** O movimento está em código e em instruções editáveis.

## Abrir

1. Extraia o ZIP inteiro.
2. Abra `site/index.html` para navegar no site editável. Não é necessário instalar dependências, abrir conta, usar API ou executar build.
3. Abra `docs/GUIA-VISUAL.html` para ver a seleção, a paleta, as versões da logo e o cartão.
4. O PDF de duas páginas do cartão está em `business-card/`; as versões SVG editáveis e PNGs de conferência ficam ao lado.

Mantenha as pastas e nomes ao extrair. Abrir apenas o HTML separado das imagens não funciona.

## Arquivos do kit

| Pasta | Conteúdo |
| --- | --- |
| `site/` | Site HTML/CSS/JS completo, fontes e imagens web locais |
| `brand/` | PNG transparente aprovado, SVGs vetoriais da logo e monograma, paleta e traçados |
| `business-card/` | Frente e verso editáveis em SVG, PDF, PNGs 300 dpi, dados de texto e mockup |
| `images/originals/` | As oito capturas reais fornecidas, com bytes intactos |
| `images/master/` | Três PNGs de campanha completos, gerados para esta direção |
| `references/` | Modelo 3 aprovado e referências fornecidas pelo cliente |
| `fonts-print/` | Fontes TTF e licenças para edição dos arquivos de marca/cartão |
| `motion/` | Timeline e instruções de animação; nenhum vídeo |
| `roteiros/` | Implementação, movimento, imagens e preparação do cartão |
| `docs/` | Guia visual, conteúdo, fontes, aprovação, origem e resultados de verificação |
| `tools/` | Verificação do pacote, conversão técnica da logo e reprodução do cartão |

## Marca e cartão

Paleta: ameixa `#3D2435`, marfim `#F5EFE7`, rosa mineral `#D4B4BB`, malva `#9E6874`. A logo PNG mantém a transparência real. As versões SVG têm contornos vetoriais, sem imagem raster incorporada; foram convertidas tecnicamente a partir do desenho aprovado, não substituídas por outra fonte ou marca.

O cartão preserva o modelo de frente marfim e verso ameixa. Formato final 85 x 55 mm; PDF e SVGs têm 3 mm de fundo perdido, total 91 x 61 mm. O PDF contém TrimBox e fontes do verso incorporadas. O relevo mostrado no mockup é uma sugestão de acabamento; não foi gerada matriz de relevo. As cores do arquivo são RGB, sem certificação PDF/X ou perfil ICC específico da gráfica. Veja o roteiro 04 antes de enviar à produção.

## Site entregue

São seis cenas, na ordem escolhida:

1. Hero À PART. com fundo fotográfico, D/retrato em primeiro plano e textos HTML.
2. Espaço real, au sein de La Maison B.
3. À CHACUNE SON ÉCLAT, única cena principal com fundo sólido, rosa mineral.
4. Manicure fúcsia real, com DESSINER / SOULIGNER / RÉVÉLER.
5. Fotografia real da equipe e Le sens du détail. Le plaisir du lien.
6. Fotografia ilustrativa de telefone com VOTRE MOMENT e reserva.

Os links de reserva apontam para o endereço Planity confirmado. Há diálogos com categorias de serviços e galeria com quatro realizações. Teclado, Escape, retorno de foco e movimento reduzido estão previstos no código. Endereço e Instagram têm links reais. Não há telefone inventado, checkout, envio de mensagens, backend ou disponibilidade simulada.

O site não depende de bibliotecas remotas. A única preferência gravada localmente é ligar/desligar movimento; não há analytics ou cookies de rastreamento. O acesso ao Planity e Instagram abre esses serviços externos por ação do visitante.

## Imagens e movimento

As fotos reais têm cópias originais intactas em `images/originals/`. O site usa exportações WebP de alta qualidade, enquadradas com CSS/SVG, sem alterar o nail art, a pele, as pessoas ou a arquitetura. A composição da foto vertical da equipe foi adaptada para conservar as pessoas reais, com uma extensão desfocada do próprio arquivo ao fundo.

Hero, fundo de estúdio e cena de reserva são imagens de campanha geradas; o retrato não é atribuído a uma funcionária. O telefone contém uma tela ilustrativa simples, não uma interface ao vivo do Planity. Os prompts e a origem de cada asset estão documentados.

A abertura e a passagem entre hero e espaço são composição 2.5D: retrato e moldura D formam um primeiro plano fotográfico, enquanto uma máscara revela o interior. Não é uma pessoa 3D nem uma câmera filmando dentro do salão. O roteiro detalha as camadas e a evolução sugerida. O pedido de não gerar vídeo foi mantido.

## Editar

- Estrutura, títulos e links: `site/index.html`.
- Categorias e galeria: `site/content.js`.
- Paleta, fontes, tamanhos e enquadramentos: `site/styles.css`.
- Movimento e diálogos: `site/app.js`.
- Dados do cartão: `business-card/card-data.json`; layouts em SVG.

## Verificação e limite da execução

Os resultados de estrutura, links, JavaScript, arquivos, transparência, SVGs, PDF e hashes ficam em `docs/qa-results.json`. O cartão foi renderizado e inspecionado visualmente.

**A revisão interativa do site em navegador permanece não verificada.** O serviço de prévia deste ambiente retornou indisponibilidade. Não foi gerado um screenshot fictício da implementação, nem medida performance. O checklist de revisão está no roteiro 01.

Para conferir a integridade localmente, use Python 3 com Pillow, PyMuPDF e Node.js: `python3 tools/check_kit.py`. Esses programas não são necessários para abrir o site. Para reproduzir os materiais de marca/cartão, veja `tools/requirements.txt` e os scripts correspondentes.

## Publicar

O pacote é local e não foi publicado. Para hospedagem estática, envie apenas o conteúdo de `site/`. Não há comando de build. Confira o roteiro de revisão e os enquadramentos no dispositivo/hospedagem de destino antes de publicar.
