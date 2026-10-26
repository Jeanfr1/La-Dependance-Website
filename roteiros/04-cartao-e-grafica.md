# Cartão de visita - edição e produção

## Arquivos

- `La-Dependance-Cartao-85x55mm-3mm.pdf`: duas páginas, frente e verso, logo em caminhos vetoriais e fontes do verso incorporadas.
- `Cartao-Recto-Editavel.svg` e `Cartao-Verso-Editavel.svg`: layouts editáveis.
- `Cartao-Recto-300dpi.png` e `Cartao-Verso-300dpi.png`: provas raster de conferência, renderizadas do PDF.
- `Mockup-Aprovado.png`: apresentação do acabamento e identidade.
- `card-data.json`: campos de texto, links, cores e medidas.

## Medidas

Formato de corte: 85 x 55 mm. Fundo perdido configurado: 3 mm por lado. Página de PDF/SVG: 91 x 61 mm. O PDF possui TrimBox de 85 x 55 mm e BleedBox da página completa. Não há marcas de corte impressas na arte.

O conteúdo importante fica afastado do corte. Não redimensionar o PDF pela opção ajustar à página. Os PNGs de prova mostram a página com fundo perdido, não apenas o corte final.

## Edição

Para modificar nome, endereço ou texto de agendamento, editar `card-data.json` e executar `python3 tools/render_card.py`. Os SVGs podem ser abertos em editor vetorial; instalar as fontes TTF da pasta `fonts-print/` para manter o texto do verso exatamente como previsto. A logo está em contornos, sem dependência de fonte.

A frente é marfim com a marca ameixa. O verso é ameixa com textos e monograma marfim. Os links de agendamento e Instagram são clicáveis no PDF, sem QR inventado. Não foi acrescentado telefone não confirmado.

## Acabamento e cor

O relevo seco sugerido no mockup não é uma matriz técnica. A arte entregue usa tinta plana; se desejar relevo, a gráfica pode usar o monograma vetorial como referência e solicitar uma camada própria conforme seu processo.

Os arquivos estão em RGB. Não há certificação PDF/X nem perfil ICC de uma gráfica específica. Confirmar com o fornecedor o perfil de cor, formato de entrega e fundo perdido que ele exige. A medida de 3 mm foi a configuração deste projeto e não uma afirmação de que todas as gráficas têm a mesma especificação.

O papel espesso e sem revestimento do mockup representa uma intenção visual, não uma encomenda ou especificação de um fornecedor. Solicitar uma prova física se o tom exato do ameixa e o acabamento forem críticos.

## Conferência feita

Frente e verso foram renderizados em PNG e inspecionados: logo, acentos, hierarquia, respiro e margens. O PDF foi conferido quanto a páginas, medidas, TrimBox e texto do verso. A aprovação de cor em papel depende do processo de impressão escolhido.
