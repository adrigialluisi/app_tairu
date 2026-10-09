# Ajuste 76 — Memórias saem da viagem em andamento; viagem passada + recordação em stories

Pedido da Adriana (06/out/2026): Memórias não fazem sentido dentro da viagem que ainda está sendo montada. Elas passam a viver numa **viagem passada** (um dos exemplos da Início). Ao abrir uma viagem passada, o roteiro é só de **visualização** (lista e mapa, sem ações). E a **recordação** segue o estilo Spotify Wrapped: segue o roteiro no mapa, cidade por cidade, e mostra as fotos de cada uma.

Decisões dela nesta rodada:
- Da viagem em andamento sai **só Memórias/Retrospectiva**: a linha "Memórias da viagem" da Início, a rota `/memorias` e o link "Fotos do dia" no cartão do dia do Roteiro. **Fica** o "Adicionar foto" por parada (ajustes-75) — foto tirada durante a viagem.
- Só o exemplo **Lisboa + Porto** fica clicável (2 cidades mostram melhor a sequência mapa → fotos → próxima cidade). O do Rio continua só ilustrando o carrossel.
- Fotos da recordação: a pessoa escolhe por cidade; onde não escolher, entram **fotos reais dos lugares visitados** (Wikipedia), com o nome do lugar e o crédito.

## 1. Dados — `src/data/examplePastTrips.ts`
- `EXAMPLE_PAST_TRIPS` saiu do `Home.tsx` pra cá. A viagem é ilustrativa (selo "Exemplo" sempre), mas os 21 lugares são pontos turísticos reais, com coordenada pública de landmark (precisão de quarteirão) e `wikiTitle` conferido na API da Wikipedia em 06/out/2026 (Elevador de Santa Justa e Farol de Felgueiras foram trocados por Arco da Rua Augusta e Castelo do Queijo porque a página não tinha foto ou trazia um mapa; Ponte Luís I usa o título do es.wikipedia, "Puente Don Luis I").
- Viagem: 10 a 18/mai/2026, Lisboa (10–13, com Sintra no dia 4) e Porto (14–17).

## 2. Viagem passada — `/viagem-passada/:id` (`src/screens/PastTrip.tsx`)
- Card com foto da cidade + selo Exemplo, destinos, datas e convidados.
- Números: dias, cidades, lugares, km (* em linha reta entre os lugares, na ordem do roteiro — `src/utils/pastTrip.ts`, haversine; nunca apresentado como distância percorrida exata).
- Card "Recordação da viagem" com o único botão principal: **Gerar recordação**.
- "Roteiro feito" com o alternador Lista/Mapa (`Tabs iconOnly`, o mesmo do Roteiro):
  - Lista: por cidade → por dia (cartão) → paradas com a mesma timeline (`TimelineStop`, que ganhou `actions` opcional — sem ações aqui).
  - Mapa: `RouteMap` com a prop nova `showRoute` (linha tracejada ligando as paradas na ordem), filtro Viagem toda / Lisboa / Porto; o número do pino é o dia da viagem.
- Card de exemplo do Rio (sem `cities`) não é clicável; acesso direto a uma rota sem roteiro volta pra Início.

## 3. Gerar recordação — `/viagem-passada/:id/recordacao` (`src/screens/PastTripRecap.tsx`)
- Passo 1: um cartão por cidade com "Escolher fotos" (input de arquivo, várias de uma vez, até 8 por cidade), miniaturas com botão de tirar. Fotos só em memória (object URL, revogada ao tirar e ao sair da tela).
- Botão no rodapé: "Ver recordação" (ou "Ver recordação sem minhas fotos" quando nenhuma foi escolhida).

## 4. A história — `src/components/recap/StoryPlayer.tsx` + `StoryMap.tsx`
Sequência (sugestão em cima do pedido dela):
1. **Capa** (bordô): nome da viagem, destinos, datas, convidados.
2. **Números** (stone-900): dias, cidades, lugares, km — contagem que sobe.
3. **O caminho**: mapa com as cidades e a linha entre elas sendo desenhada ("≈ 274 km entre as cidades").
4. Para cada cidade: **mapa voando até a cidade** → pinos dos lugares e a rota desenhada na ordem visitada, com "Cidade 1 de 2 · Dias 1–4", nº de lugares/dias/km e os nomes; em seguida **"Lisboa em fotos"** (grade de até 4; mais que 4 fotos vira 2 slides).
5. **O dia mais cheio** (dia com mais lugares, com a lista).
6. **Fecho**: mapa da viagem toda + totais + Compartilhar (`navigator.share` ou copia o resumo), Ver de novo, Fechar.

Comportamento de stories: barras de progresso no topo, avança sozinho (4–7 s por slide; o fecho fica parado), toque à direita avança / à esquerda volta, segurar pausa, botão de pausa sempre visível (WCAG 2.2.2), teclado ← → Espaço Esc, `role="dialog"`. Com `prefers-reduced-motion`: sem voo do mapa, sem contagem e sem animação de entrada.

O mapa é UM Leaflet montado o tempo todo por trás dos slides (contexto de empilhamento próprio pra não cobrir o texto), que só muda de foco — por isso o "voo" de uma cidade pra outra é contínuo. Tiles do OSM precisam de internet (mesma exceção do ajustes-10); sem tile, o texto continua legível sobre o fundo.

Exceção deliberada da escala tipográfica, só na história: títulos de 32/40px e números de 48px (o formato retrospectiva depende de tipo grande). Contraste: branco sobre bordô 6.08:1, sobre --accent-dark 9.67:1, sobre stone-900 17.49:1; painel de texto sobre o mapa com fundo stone-900 a 96%.

## 5. O que ficou sem uso
`src/screens/Memories.tsx` e `src/components/memories/RetrospectivePanel.tsx`/`RetroCardView.tsx` (e `utils/retrospective.ts`) não têm mais rota nem importação — ficaram no disco como referência; podem ser apagados quando a Adriana confirmar. `PhotoViewer` continua em uso (fotos por parada no Roteiro).
