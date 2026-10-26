# Implementação - À PART. / modelo 3

## Fonte da escolha

`references/Modele3-A-Part-Approuve.png` é o estudo escolhido pelo cliente. O arquivo é um estudo visual gerado, não um screenshot do site. Não substituir o hero por VOUS ou LE GESTE, nem misturar suas seções.

| Ordem | ID HTML | Composição |
| --- | --- | --- |
| 1 | `accueil` | Fundo de estúdio, palavra À PART., retrato dentro da moldura D |
| 2 | `lieu` | Fotografia real do espaço, UNE ADRESSE / VOTRE PARENTHÈSE |
| 3 | `prestations` | Único fundo sólido, rosa mineral, À CHACUNE SON ÉCLAT |
| 4 | `creations` | Nail art fúcsia real em fundo amplo |
| 5 | `equipe` | Momento real de trabalho, com ambas as pessoas da foto |
| 6 | `rendez-vous` | Fotografia de telefone, VOTRE MOMENT, endereço e reserva |

## Instalação

O projeto é buildless, com HTML/CSS/JS. Não há React, NPM, integração de pagamentos ou conta necessária para navegar. `site/` é autocontido e é o único diretório a publicar. Todo o restante pertence ao kit de marca e implementação.

O cabeçalho tem logo, navegação e ação de reserva. No celular a navegação abre em um disclosure. As ações centrais sempre conduzem ao Planity correto, mesmo sem animação. Sem JavaScript, links de serviços continuam levando ao Planity; recursos extras de galeria ficam ocultos.

## Interações

Os serviços abrem um diálogo com três tabs: Ongles, Regard e Maquillage semi-permanent. Os textos são informativos; tarifas e disponibilidade são consultadas no próprio Planity. A galeria tem quatro arquivos reais, navegação anterior/próxima e setas do teclado. Escape fecha os diálogos e o foco retorna ao controle que os abriu.

Não criar formulário de contato fictício, agendamento próprio, checkout ou mensagens automáticas. A reserva é externa e explícita.

## Enquadramentos e adaptações

O desenho do hero foi decomposto em fotografia de fundo, primeiro plano recortado com D/retrato e textos HTML. Não usar o screenshot aprovado inteiro como uma imagem do site.

O interior continua sendo o local real. O viewport afasta as setas da captura. O portfólio afasta a faixa de texto do topo da captura. A foto da equipe é vertical: no desktop, ela fica em primeiro plano à direita e o mesmo arquivo desfocado dá continuidade ao fundo. Não fabricar um novo ambiente ou redesenhar a posição das pessoas para obter uma foto panorâmica.

No celular, o retrato do hero fica abaixo do título; o agendamento do cabeçalho permanece disponível. A última imagem é enquadrada para manter legível a tela do telefone e os textos reais ficam em HTML fora dela.

## Revisão em navegador a executar

1. Conferir 1440 x 900, 1920 x 1080, 390 x 844 e 360 x 800.
2. Conferir À PART., acento, nome da marca e ausência de corte de informação. Cortes decorativos da moldura são permitidos; rosto e mão precisam continuar reconhecíveis.
3. Verificar contraste sobre interior, portfólio e equipe. Ajustar apenas enquadramentos e scrims se necessário.
4. Verificar que setas, nomes ou ícones das interfaces das capturas não entram no enquadramento público.
5. Testar os três serviços, tabs com setas/Home/End, Escape, clique fora e retorno de foco.
6. Testar a galeria, legendas e quatro imagens, sem tirar conclusões sobre resultados de procedimentos a partir de fotos geradas.
7. Testar os destinos Planity, Maps e Instagram sem marcar um horário ou enviar mensagem.
8. Testar zoom de 200%, navegação por teclado e ausência de overflow horizontal.
9. Ativar movimento reduzido do sistema, economia de dados e o controle de pausa. Conferir que todo o conteúdo continua disponível.
10. Medir carregamento e comportamento na hospedagem final. Não há resultado de performance medido nesta execução.

O serviço de prévia gerenciado retornou indisponibilidade no comando de abertura e no diagnóstico. A revisão em navegador foi registrada como pendente; não foi substituída por outra infraestrutura ou por screenshot inventado.
