# Ajuste 80 — Dias montados por proximidade, mapa com cara de Google Maps, mais eventos nas datas da viagem

> **Pra quem vai aplicar (Claude Code no Antigravity):** aplicar **depois** dos ajustes 78/79. Arquivos principais: `src/utils/itinerary.ts`, `src/components/itinerary/RouteMap.tsx`, `src/components/recap/StoryMap.tsx`, `src/data/events.json`, `src/data/index.ts`, `src/utils/categoryVisuals.ts`, `src/components/suggestions/EventCard.tsx`.

Pedidos da Adriana (08/out/2026):
1. No Roteiro, as atividades têm que ser distribuídas nos dias **pela distância**: o que fica pertinho cai no mesmo dia.
2. O mapa deve ter um visual **parecido com o Google Maps**, não o OpenStreetMap padrão.
3. Ter **atividades/eventos acontecendo na cidade em todos os dias da viagem**, mesmo que fictícios, com o dia indicado e a opção de adicionar ao roteiro.

---

## 1. Distribuição dos lugares nos dias por proximidade

Hoje `computeDestinationAssignments` (`src/utils/itinerary.ts`) distribui por **round-robin** na ordem em que a pessoa marcou. Trocar por agrupamento geográfico, **determinístico** (mesma entrada → mesmo resultado, sem aleatório):

1. Pegar os itens **sem override** daquele destino (os movidos/pulados continuam fixos, como hoje). Item sem `lat/lng` vai pro fim da lista.
2. **Montar uma rota pelo vizinho mais próximo** (distância haversine; já existe `haversineKm` em `src/utils/pastTrip.ts`, mover pra `src/utils/geo.ts` e importar dos dois lugares):
   - começa pelo lugar **mais ao norte** (maior `lat`; empate → menor `lng`);
   - a cada passo, vai pro lugar ainda não visitado mais próximo do atual.
3. **Cortar essa rota em `dayCount` pedaços consecutivos**, com tamanhos o mais iguais possível (os primeiros dias ficam com 1 a mais quando não dividir certinho). Pedaço 1 = dia 1, e assim por diante.
   - Melhoria: antes de cortar, se a distância entre dois vizinhos da rota for **> 2× a mediana** dos saltos, preferir cortar ali (ajusta ±1 item no tamanho do pedaço). Assim um bairro não é partido no meio só pra equilibrar.
4. A **ordem dentro do dia** é a ordem da rota (o que está perto um do outro fica em sequência). A numeração "Parada 1, 2…" segue essa ordem.
5. `computeUnpinnedLocalDay` tem que usar **a mesma função** (extrair `computeProximityDays(items, dayCount): Map<id, {day, order}>` e chamar dos dois lugares), senão o "pulei" congela o dia errado.
6. Atualizar o comentário do topo da função (hoje fala em round-robin).

**Na tela (aba Roteiro):** abaixo das pílulas de data, uma linha 13px `text-muted-foreground` com ícone lucide `Route`: "Organizamos os dias juntando os lugares que ficam perto. Você pode mover o que quiser."
No cabeçalho de cada dia, depois da data, o(s) bairro(s) dominante(s) do dia: "Sáb, 21/11 · San Telmo e La Boca" (usar `neighborhood` dos lugares; até 2 nomes, os mais frequentes).

**No mapa:** cada dia ganha uma **cor de pino própria** (até 4 dias: bordô `--accent`, azul, verde, âmbar, tirados dos tokens/tema; conferir contraste ≥ 3:1 do pino contra o mapa) e a linha da rota liga as paradas **do mesmo dia** na ordem. Filtro "Todos os dias" mostra todos com as cores; legenda pequena com "Dia 1 · Dia 2 · Dia 3" e a cor. Cor nunca sozinha: o número dentro do pino é a ordem e o rótulo da legenda tem o texto do dia.

## 2. Mapa com visual parecido com o Google Maps

Usar o Google Maps de verdade exigiria chave de API com cobrança e os termos deles não permitem usar os tiles dentro do Leaflet. Então: **trocar os tiles do OpenStreetMap padrão pelos do CARTO "Voyager"**, que têm a paleta clara, ruas brancas, parques verdes, água azul e rótulos discretos, bem parecidos com o Google Maps. Gratuito, sem chave.

Em `RouteMap.tsx` e `StoryMap.tsx`:
```tsx
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
  subdomains="abcd"
  maxZoom={20}
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
/>
```
(manter o timeout/aviso de "mapa sem internet" que já existe em `TileLayerWithTimeout`).

Pra completar a cara de Google Maps:
- **Pino em gota** (formato teardrop do Google), em SVG inline via `L.divIcon`, 28×40px, cor do dia, número branco no centro (contraste do branco sobre a cor ≥ 4.5:1), sombra leve. O pino selecionado cresce pra 34×48.
- **Controles de zoom** no canto inferior direito, botões brancos redondos de 44px com sombra (`+`/`−` com ícones lucide `Plus`/`Minus`), em vez do controle padrão do Leaflet no canto superior esquerdo.
- **Botão "centralizar"** (ícone `LocateFixed`) acima do zoom: reenquadra nos pinos do filtro atual.
- Popup do pino no estilo cartão do Google: foto pequena (a mesma da parada, quando tiver), nome em 15px semibold, bairro e "Dia 2 · Parada 3" em 13px.
- No `StoryMap` (recordação) trocar só os tiles; os pinos lá continuam como estão.

Se a Adriana quiser depois o Google Maps de verdade, vira um ajuste à parte (precisa de conta Google Cloud e chave).

## 3. Eventos em todos os dias da viagem (incluindo fictícios)

Hoje `src/data/events.json` tem 7 eventos reais e sobram dias sem nada (20/11 em Buenos Aires, 24/11 em Santiago, 25/11 em San Pedro de Atacama). A Adriana pediu atividades em todos os dias, **mesmo que inventadas**.

**Dados:** os 13 eventos novos estão prontos em `docs/dados/events-simulados.json` (feito pelo Claude/Cowork). Locais reais com coordenada aproximada, eventos fictícios, cada um com `"simulated": true` e **sem** `sourceUrl`/`sourceLabel`/`checkedAt`. Juntar os dois no `src/data/events.json` (ordenar por cidade e data). Depois disso, cada dia de cada cidade do cenário tem **2 a 4 eventos**.

**Tipos:** em `src/data/index.ts`:
- `EventKind` ganha `'gastronomia'` e `'passeio'`; em `EVENT_KIND_ICONS`: `gastronomia: UtensilsCrossed`, `passeio: Footprints`.
- `EventEntry`: `sourceLabel`, `sourceUrl`, `checkedAt` viram opcionais; novo `simulated?: boolean`.

**`EventCard`:**
- Sem `sourceUrl` → não mostra a linha "Fonte". Não mostrar selo de "fictício" pro participante (o roteiro de teste do moderador é quem sabe o que é simulado).
- Deixar o **dia** bem claro também no texto, não só no bloco de data: acima do nome, 13px `font-medium` cor `--accent-dark`: "Sex, 20/11 · 21:30".
- O botão continua: "Adicionar ao roteiro" (secundário) / "✓ No roteiro, 20/11" (primário). O evento entra no **dia fixo** dele (como hoje); **não** entra na distribuição por proximidade da seção 1, mas aparece no mapa daquele dia com pino de outro formato (ícone `CalendarDays` dentro, mesma cor do dia).

**Seção "Eventos nas suas datas"** (Sugestões): agrupar o carrossel por dia, com um rótulo pequeno antes do primeiro card de cada dia ("Sexta, 20/11"), pra mostrar que tem coisa em todos os dias.

## 4. Regras de sempre
- Tokens do Tairu, contraste conferido (pino, número do pino, legenda).
- Testar em 375px e 390px, iOS e Android, com e sem internet (sem internet o aviso de mapa continua).
- `npm run lint` e `npm run build` sem erro.
- `CLAUDE.md`: (a) distribuição dos dias por proximidade substitui o round-robin; (b) tiles CARTO Voyager; (c) exceção nova à regra "dado real": eventos com `simulated: true` são fictícios, pedidos pela Adriana em 08/out/2026, pra o cenário de teste ter atividade todo dia.
- Commit: `ajuste 80: dias por proximidade, mapa estilo Google, eventos simulados`.
