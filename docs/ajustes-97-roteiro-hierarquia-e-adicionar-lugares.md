# Ajuste 97 — Roteiro: hierarquia clara, "Adicionar lugares" separado das sugestões, escolher o dia e busca ao vivo com prévia

Origem: primeiro teste real (27/out/2026, participante com iPhone) e conversa com a Adriana depois dele.
- A tela do Roteiro ficou caótica.
- O participante entendeu "Sugestões" como só o que o app sugere e não percebeu que podia adicionar lugares que ele mesmo escolheu.
- Ele quis adicionar uma programação no dia 18 e não havia caminho direto: tinha que ir em Sugestões, adicionar, deixar o app reorganizar, voltar na data e alterar.
- O alternador Lista/Mapa ficou apagado.

Aplicar **depois do ajuste 96**. Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 97: roteiro com hierarquia clara e adicionar lugares com busca ao vivo`.

---

## 1. Ordem da tela, do mais amplo pro mais específico

De cima pra baixo, na aba Roteiro:

1. **Abas de cidade** (Todas · Buenos Aires · Santiago · San Pedro), fixas no topo, como no 95b.
2. **Alternador Lista | Mapa**: sai do canto direito da faixa de pílulas e vira um **controle segmentado de largura total**, com ícone + texto ("Lista", "Mapa"), altura 44px. Ativo = fundo branco com sombra leve e texto em peso 600; inativo = texto `muted-foreground`. Fixo junto com as abas de cidade.
3. **Pílulas de data**, roláveis, como hoje, sem o alternador ao lado.
4. **Cards dos dias.**

Dentro de cada card de dia, sempre nesta ordem e com títulos de bloco pequenos (caixa alta, 12px, `muted-foreground`):
- cabeçalho: data por extenso + bairro(s) + "Buenos Aires · Dia 5 de 14";
- **AGENDA DO DIA**: só o que tem horário (transporte, check-in/out, ingressos, eventos);
- **LUGARES**: as paradas da participante;
- **PLANOS DO GRUPO**: os provisórios do 95b, quando houver.

Espaçamento: 24px entre blocos dentro do card, 16px entre paradas, 32px entre cards (regra de 8px do `CLAUDE.md`).

## 2. Sub-abas renomeadas e "adicionar o meu" fora de Sugestões

- Sub-abas do Roteiro: **"Roteiro" · "Sugestões do app" · "Dicas locais"**. Abre sempre em "Roteiro".
- **"Sugestões do app"** fica só com o que o app sugere: seções por perfil, "Eventos nas suas datas" e "Escolhas dos convidados". Cada card mantém o "+".
- **Sai de Sugestões** o campo "Buscar ou adicionar um lugar" (ajuste 87) e a seção "Adicionados". Os lugares que a pessoa adicionou por conta própria aparecem no roteiro, nos seus dias, com um selo discreto "Adicionado por você".

## 3. Botão flutuante "Adicionar lugares"

- Na sub-aba **Roteiro**, um botão flutuante bordô no canto inferior direito, acima do menu fixo: ícone "+" e o texto **"Adicionar lugares"**. Altura 48px, sombra média. Some ao rolar pra baixo e volta ao rolar pra cima, pra não cobrir o conteúdo. Respeitar a área segura do iPhone.
- Não aparece em "Sugestões do app" nem em "Dicas locais".
- Toque abre uma **folha de baixo pra cima** (`Sheet`/`Drawer` do shadcn, 90% da altura) com:
  1. Título "Adicionar a {cidade}". Se a aba de cidade for "Todas", mostra antes um seletor de cidade.
  2. **"Em qual dia?"**: pílulas com os dias da cidade + a primeira opção "Deixar o app escolher". **Padrão = o dia selecionado nas pílulas de data da tela**. Se estiver em "Todos os dias", o padrão é "Deixar o app escolher".
  3. **Campo de busca**, com foco automático (font-size 16px, ajuste 96), placeholder "Restaurante, museu, bar, endereço…".
  4. Resultados (seção 4).

## 4. Busca em tempo real com prévia

Enquanto digita (a partir de 2 letras, espera de 300ms entre teclas), a lista mostra até 3 grupos, nesta ordem, cada um com título pequeno:

1. **"Já no seu roteiro"**: lugares da viagem que batem com o texto, com o dia em que estão ("Dia 18"). Tocar leva até a parada.
2. **"Sugestões do app"**: lugares do `places.json` da cidade que batem com o texto (nome, bairro, categoria), com a foto local.
3. **"Outros lugares em {cidade}"**: busca ao vivo no **Photon (OpenStreetMap)**:
   - `GET https://photon.komoot.io/api/?q={texto}&lat={lat da cidade}&lon={lng da cidade}&limit=8`
   - descartar resultados a mais de 40km do centro da cidade;
   - descartar os que já apareceram nos grupos 1 e 2 (mesmo nome + distância menor que 150m);
   - cada linha: ícone da categoria (mapear `osm_value`: restaurant/cafe/bar → gastronomia; museum/gallery/theatre/attraction/monument → cultura; park/garden/viewpoint/beach → natureza; marketplace/shop/mall → compras; outros → "lugar"), nome, rua + bairro;
   - crédito "Resultados © OpenStreetMap" pequeno no fim do grupo;
   - erro, sem internet ou demora maior que 4s → o grupo some sem mensagem de erro; os grupos 1 e 2 continuam.

No fim da lista, sempre: **"+ Adicionar '{texto}' como lugar meu"** (sem endereço, ícone genérico).

**Prévia ao tocar num resultado** (dentro da mesma folha, com "‹ Voltar" pra lista):
- foto: local (grupo 2) ou da Wikipedia pelo nome + cidade, reaproveitando `usePlaceThumbnail` (grupo 3); sem foto → ícone da categoria grande;
- nome, categoria, endereço;
- **mini mapa** (Leaflet, 140px de altura, sem interação) com o pino;
- botão primário **"Adicionar ao dia 18"** (ou "Adicionar ao roteiro", quando "Deixar o app escolher").

Ao adicionar: a folha fecha, a tela rola até o lugar no dia certo, o card pisca rapidamente e aparece o toast "Salvo ✓" (ajuste 22).

**Dados:** lugar vindo do Photon vira uma seleção própria com `source: 'osm'`, `name`, `lat`, `lng`, `address`, `category` e `osmId`. Ele entra no mapa, na proximidade e na Agenda, como qualquer lugar.

## 5. Lugar fixado no dia

- Lugar adicionado com um dia escolhido fica **fixado**: campo `pinnedDayISO`. A divisão por proximidade (ajuste 80) **não move** lugares fixados; os outros se organizam em volta deles.
- Na parada, um pequeno ícone de alfinete ao lado do nome, com `aria-label="Fixado neste dia"`.
- "Alterar → Mudar de dia" também fixa o lugar no dia novo. Uma opção nova em "Alterar" (ajuste 95, item 4): **"Deixar o app escolher o dia"**, que tira a fixação.
- Cobrir em `proximityDays.test.ts`: um lugar fixado no dia 18 continua no dia 18 depois de adicionar 3 lugares novos na cidade.

## 6. Conferir

- Testar em 375px e 390px (iPhone) e 360px (Android): nada sai da tela, o botão flutuante não cobre o último item (espaço inferior suficiente) e a folha abre e fecha sem deslocar a página.
- Atualizar a seção Roteiro do `CLAUDE.md`: nomes das sub-abas, botão flutuante, busca ao vivo (terceira exceção de internet do protótipo, depois do mapa e das fotos da Wikipedia) e lugar fixado.

---

## Como ficou (27/out/2026)

- **1. Ordem:** `Tabs` ganhou `variant="full"` (trilho stone-200 de largura total, 44px, ícone + texto; ativa branca com `shadow-sm` e peso 600; inativa `--muted`, 6.08:1 no stone-200). Presos no topo: abas de cidade + Lista | Mapa. **Decisão:** as pílulas de data vêm logo abaixo, mas **rolam com a página**, porque cidade + Lista|Mapa + pílulas presas somariam cerca de 160px fixos num iPhone (regra "compactar em vez de empilhar" do CLAUDE.md). O interruptor "Mostrar planos do grupo" fica depois das pílulas, só na Lista. Os títulos de bloco perderam os ícones e viraram caixa alta, 12px e `--muted`. "Lugares pra visitar" virou "LUGARES". Espaçamentos: 24px entre blocos, 16px entre paradas (era 24) e 32px entre cards (era 16).
- **2. Sub-abas:** "Roteiro · Sugestões do app · Dicas locais", abrindo no Roteiro. Os atalhos de outras telas (Novidades → Escolhas dos convidados) continuam abrindo na aba que pedem. Saíram `PlaceSearchBar`, `AddedPlaceCard` e `trip.addCustomPlace`. Lugar trazido pela pessoa (escrito à mão ou do OpenStreetMap) leva o selo "Adicionado por você". Como a seção "Adicionados" era o único lugar de remover, o "Alterar" da parada ganhou **"Tirar do roteiro"** para lugar só seu.
- **3. Botão flutuante:** `FloatingActionButton` (é o `Button` primary em pílula, 48px, `shadow-md`), entra pela prop nova `fab` do `ScreenShell`. Fica dentro da folha da tela, então já fica acima do menu fixo, que guarda a área segura do iPhone. Some ao rolar pra baixo e volta ao rolar pra cima. Sobe 56px enquanto há toast, pra não ficar por cima da mensagem. Espaço de 64px no fim da aba. Dia vazio ganhou o atalho "Adicionar lugares", que abre a folha naquele dia e naquela cidade.
- **4. Busca:**
  - O Photon é chamado em `src/utils/photon.ts`, com `searchPhoton` para a busca e `parsePhoton` para a leitura da resposta (pura, testada em `photon.test.ts`).
  - O centro da cidade vem de `cityCenter`, a média dos lugares do app, porque o `cities.json` não tem coordenada. Cidade sem lugar no app busca sem filtro de distância, com o nome da cidade no texto.
  - Se o Photon falhar, demorar mais de 4s ou ficar sem internet, ele devolve `[]` e o grupo simplesmente não aparece.
  - Os grupos 1 e 2 não usam rede, então funcionam offline.
  - Na prévia de lugar do OpenStreetMap, a foto da Wikipedia é buscada pelo nome do lugar: o `usePlaceThumbnail` procura pelo título exato do artigo, e "nome, cidade" não é título de artigo.
  - O mini mapa é o `MiniMap`, com os mesmos tiles e a atribuição do `RouteMap`.
- **5. Lugar fixado:**
  - `computeProximityDays` aceita `fixedDay` no item: ele fica fora dos passos de agrupamento e entra no dia dele, na rota daquele dia.
  - A regra "só abre aos domingos" não move lugar fixado; a parada continua avisando.
  - O `itinerary.ts` converte `pinnedDayISO` → dia local pelas datas do destino (`proximityOptionsFor` agora devolve `dayISOs`). O "Mudar de dia" (override) também vira `fixedDay` e passou a entrar na rota do dia em vez de ir pro fim.
  - Parada pulada continua congelada no fim do dia.
  - Teste em `proximityDays.test.ts`: o Café de los Angelitos fixado no dia 18 continua no 18 depois de entrarem Teatro Colón, Rosedal e Feria de San Telmo.
- **6.** Não deu pra testar em 360/375/390px aqui (sem navegador automatizado); revisão feita no código. **Falta conferir no aparelho.** CLAUDE.md atualizado (seção Roteiro, "Navegação interna fixa" e a terceira exceção de internet em "Dados reais").

## Checklist de aceite
- [x] Ordem: cidade → Lista|Mapa (largura total, com texto) → datas → dias.
- [x] Card do dia com blocos AGENDA DO DIA / LUGARES / PLANOS DO GRUPO.
- [x] Sub-abas "Roteiro · Sugestões do app · Dicas locais"; Sugestões sem o campo de adicionar e sem "Adicionados".
- [x] Botão flutuante "Adicionar lugares" só na sub-aba Roteiro, sem cobrir conteúdo (espaço de 64px no fim; conferir no aparelho).
- [x] "Em qual dia?" começa no dia selecionado nas pílulas.
- [x] Buscar "Café de los Angelitos" em Buenos Aires mostra resultado do OpenStreetMap com prévia e mini mapa; adicionar ao dia 18 coloca no dia 18 e ele não muda de dia ao adicionar outros lugares. O Photon respondeu ao vivo com o lugar certo (Av. Rivadavia 2100, Balvanera), e a regra de ficar no dia está coberta por teste. A tela em si falta conferir no aparelho.
- [x] Sem internet, a busca continua mostrando "Já no seu roteiro" e "Sugestões do app": os dois grupos não usam rede, e a falha do Photon devolve lista vazia. Falta conferir no aparelho, em modo avião.
- [x] `npm run lint`, `npm test` (36/36) e `npm run build` ok.
