# Identidade e imagens

## Logo

O PNG aprovado continua em `brand/La-Dependance-Logo-Transparente.png`, 1774 x 887 px, RGBA. Há cópia idêntica em `site/assets/logo.png`. A transparência e as cópias são verificadas pelo script de QA.

Os arquivos `La-Dependance-Logo.svg` e `La-Dependance-Logo-Ivoire.svg` têm caminhos vetoriais verdadeiros. O traçado foi extraído do canal alpha do PNG aprovado, preservando a forma; não há bitmap incorporado nem fonte externa na logo. O nome está em contornos, por isso não é texto editável. Os monogramas usam um viewport do mesmo desenho, sem criar outra marca.

Para recriar os SVGs tecnicamente: `python3 tools/vectorize_logo.py`. Isso não altera o PNG aprovado.

Paleta: ameixa #3D2435, marfim #F5EFE7, rosa mineral #D4B4BB e malva #9E6874. Malva e rosa são acentos; usar ameixa/marfim para leitura de textos pequenos. Preservar as cores naturais nas fotos reais.

Tipografia: Anton para o peso alto e condensado do conceito; Manrope para textos e navegação; Caveat 500 para o acento manuscrito. As fontes e licenças OFL acompanham a entrega, sem dependência de CDN.

## Origem por cena

| Cena | Asset | Origem |
| --- | --- | --- |
| Hero | Fundo e retrato com D | Campanha gerada para a direção escolhida |
| Lugar | Interior | Foto real fornecida, exportada em WebP |
| Serviços | Fundo rosa, títulos e monograma | Composição HTML/CSS e SVG |
| Portfólio | Nail art fúcsia | Foto real fornecida, exportada em WebP |
| Equipe | Momento de trabalho | Foto real fornecida, exportada em WebP |
| Reserva | Mão e telefone | Fotografia de campanha; tela ilustrativa simples |

As oito capturas fornecidas ficam intactas em `images/originals/`. As exportações WebP do site comprimem o arquivo para navegação; não retocam resultados, decoração ou pessoas. Os hashes de origem e derivados ficam em `docs/asset-manifest.json`.

A foto da equipe é vertical. O site usa a foto nítida e uma extensão desfocada do mesmo arquivo ao fundo para manter a presença das duas pessoas. Isso não é uma foto panorâmica documental nem uma nova arquitetura do salão.

O retrato do hero é uma modelo de campanha; não foi identificado como Mélissa ou integrante da equipe. A tela do telefone não representa disponibilidade ao vivo e não anuncia aplicativo próprio. Os links de reserva da página são HTML e vão ao endereço Planity real.

## Não substituir

Não colocar retrato VOUS ou mão LE GESTE no hero, não inserir as seções dos modelos anteriores e não retornar às cores laranja da referência GLOW. Não criar linhas de cosméticos da marca, premiações, telefones, comparações antes/depois ou depoimentos fictícios.

## Arquivos master e prompts

Os três PNGs gerados estão completos em `images/master/`. Os prompts do modelo 3, da marca/cartão e dos novos assets estão em `docs/prompts-imagens.json`. A geração usou ImageGen integrado; nenhuma API é necessária para abrir o site.
