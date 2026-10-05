# Ajuste 60 — Roteiro: sugestões separadas por categoria do perfil, eventos locais nas datas da viagem e respiro visual

Pedido da Adriana (02/out/2026):
1. Deixar claro **o que preencher no Perfil da viagem**, porque é dele que saem as sugestões do Roteiro.
2. No Roteiro, **separar as sugestões por categoria**: Pontos turísticos, Fora do circuito, Gastronomia, Cultura… ou seja, **tudo o que a pessoa marcou no perfil**.
3. Uma divisão de **eventos locais** que acontecem **na cidade, nas datas em que a pessoa vai estar lá**.
4. O Roteiro está bagunçado: **mais ícones visuais e mais espaçamento**, tudo bem distribuído.

Princípios mantidos: dado real, nunca inventado (eventos pesquisados com fonte e data de checagem); sem IA generativa; tokens do Tairu; alvo de toque ≥ 44px; foco visível; reaproveitar componentes.

---

## 1. Perfil da viagem: dizer pra que serve cada resposta

### 1.1 Texto no app — `src/components/quiz/TripProfileQuiz.tsx`
- No topo do quiz (antes do hint de multidestino que já existe), um parágrafo curto (`--text-sm`, `--muted`):
  > Suas respostas montam as sugestões do Roteiro. Cada estilo e cada interesse que você marcar vira uma seção de sugestões.
- Abaixo do `legend` de **"Turístico ou fora do circuito?"**, hint: "Turístico mostra os pontos mais conhecidos; fora do circuito, o que os moradores frequentam. Equilibrado mostra os dois."
- Abaixo do `legend` de **"Interesses da viagem"**, hint: "Marque quantos quiser."
- Hints no mesmo estilo de texto auxiliar já usado (`--text-sm`, `--muted`, `--space-2` abaixo do legend).

### 1.2 O que preencher no teste (cenário fixo)
Atualizado direto no roteiro de teste (`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md`, seção "Cenário fixo"). Pra referência do desenvolvimento:
- Turístico ou fora do circuito: **Turístico + Fora do circuito**
- Ritmo: **Moderado** · Orçamento: **Moderado** · Como vai ser: **Amigos**
- Interesses: **Gastronomia, Cultura e história, Natureza**
- Já conhece: **Não, primeira vez**

Com isso, o Roteiro mostra as seções: Eventos nas suas datas, Pontos turísticos, Fora do circuito, Gastronomia, Cultura e história e Natureza.

---

## 2. Dados de eventos — `src/data/events.json` (já entregue, fonte em `docs/dados/events.json`)

7 eventos reais, pesquisados em 02/out/2026, cada um com `sourceUrl` e `checkedAt`. Só dentro das datas do cenário (Buenos Aires 20–22/11, Santiago 22–24/11, San Pedro de Atacama 24–25/11):

| Cidade | Data | Evento |
|---|---|---|
| Buenos Aires | sáb 21/11 | Milonga ao ar livre na Glorieta de Belgrano (20h) |
| Buenos Aires | sáb 21/11 | Miguel Mateos — "Los Tres Reinos", Teatro Gran Rex |
| Buenos Aires | dom 22/11 | Feira de San Telmo (10h–17h) |
| Santiago | dom 22/11 | Persa Biobío (melhor 11h–16h) |
| Santiago | seg 23/11 | Troca da Guarda no Palácio La Moneda (10h) |
| Santiago | seg 23/11 | CA7RIEL & Paco Amoroso, Movistar Arena (19h) |
| San Pedro de Atacama | ter 24/11 | Lua cheia no deserto (afeta tours astronômicos) |

### 2.1 Tipo e helpers — `src/data/index.ts`
```ts
import eventsRaw from './events.json';

export type EventKind = 'show' | 'feira' | 'danca' | 'cerimonia' | 'ceu';

export interface EventEntry {
  id: string;
  cityId: string;
  name: string;
  kind: EventKind;
  /** ISO yyyy-mm-dd */
  date: string;
  time: string;
  venue: string;
  neighborhood: string;
  categories: string[];
  popularity: 'turistico' | 'fora-do-circuito';
  price: string;
  description: string;
  lat: number | null;
  lng: number | null;
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: string;
  recurring?: string;
  note?: string;
}

export const events: EventEntry[] = eventsRaw as EventEntry[];

/** Eventos da cidade dentro do intervalo [startISO, endISO], inclusive, ordenados por data. */
export function getEventsForDestination(cityId: string, startISO: string | null, endISO: string | null): EventEntry[];
export function getEventById(id: string): EventEntry | undefined;
```
Destino sem as duas datas → `getEventsForDestination` devolve `[]` (a seção mostra o estado vazio da 4.4).

---

## 3. Estado — `src/context/TripContext.tsx`

- `selectedEventIds: string[]` no estado + `toggleEvent(eventId: string)` no contexto (adiciona/remove).
- `setSelectedEventIds([])` no `resetTrip()`; incluir nas dependências do `useMemo`.
- Evento tem **data fixa**: não entra no `selectedPlaces` nem na distribuição automática de dias. Ele aparece no Roteiro no próprio dia (seção 5).
- `isRoteiroComplete` (`src/utils/tripProgress.ts`): considerar completo também se houver pelo menos 1 evento escolhido.

---

## 4. Aba "Lugares" vira "Sugestões", organizada por seções

`src/screens/Itinerary.tsx`: a aba principal `lugares` passa a se chamar **"Sugestões"** (o valor interno `'lugares'` pode ficar). Ordem das abas: **Sugestões → Roteiro → Dicas locais**.

### 4.1 Estrutura da aba, de cima pra baixo
1. **Abas de destino** (as que já existem: Buenos Aires / Santiago / San Pedro de Atacama).
2. **Faixa "Com base no seu perfil"**: card baixo (`--card`, raio do card, padding `--space-4`) com o texto "Sugestões com base no seu perfil" e, embaixo, os chips do que foi marcado (ícone + rótulo, só leitura, ex.: `📍 Turístico` `🧭 Fora do circuito` `🍽️ Gastronomia`…), e um link "Editar perfil" que leva pra Destinos já no Passo 2 (`navigate('/destinos')`, o Passo 2 já existe por lá). Se o perfil estiver vazio, a faixa vira um convite: "Responda o perfil da viagem pra ver sugestões do seu jeito" + botão secundário "Responder perfil"; enquanto isso, mostrar **todas** as seções (fallback, nunca tela vazia).
3. **Atalhos das seções**: linha horizontal rolável de chips (ícone + nome + contador, ex.: `🍽️ Gastronomia 4`). Tocar rola até a seção (`scrollIntoView({ behavior: 'smooth', block: 'start' })`). Fica logo abaixo da faixa do perfil (não precisa ser sticky).
4. **"Adicionar um lugar por conta própria"**: deixa de ser um campo aberto no topo. Vira uma linha compacta com ícone `➕` e o texto "Não achou? Adicione um lugar por conta própria"; ao tocar, expande o `TextField` + botão "Adicionar" que já existem. A lista de lugares customizados continua aparecendo logo abaixo, agora com ícone `✏️` em cada item.
5. **Seções**, nesta ordem, cada uma só se tiver pelo menos 1 item pra cidade ativa:

| Seção | Ícone | Quando aparece | O que entra |
|---|---|---|---|
| Eventos nas suas datas | 📅 | sempre (com estado vazio próprio) | `getEventsForDestination(cityId, dateStart, dateEnd)` |
| Pontos turísticos | 📍 | perfil tem `turistico` ou `equilibrado` | lugares `popularity === 'turistico'` |
| Fora do circuito | 🧭 | perfil tem `fora-do-circuito` ou `equilibrado` | lugares `popularity === 'fora-do-circuito'` |
| Gastronomia | 🍽️ | interesse marcado | `categories` inclui `gastronomia` |
| Cultura e história | 🏛️ | interesse marcado | inclui `cultura` |
| Natureza | 🌿 | interesse marcado | inclui `natureza` |
| Vida noturna | 🌙 | interesse marcado | inclui `vida-noturna` |
| Compras | 🛍️ | interesse marcado | inclui `compras` |

- Dentro de cada seção, os lugares seguem `rankPlacesByProfile` (o que bate com mais coisa do perfil primeiro).
- **Um lugar pode aparecer em mais de uma seção** (ex.: Don Julio em Pontos turísticos e em Gastronomia). É esperado: o estado de "adicionado" é o mesmo nas duas, então marcar em uma reflete na outra.
- Seção sem nenhum item naquela cidade some (ex.: Vida noturna em San Pedro de Atacama), em vez de mostrar seção vazia. Exceção: Eventos, que mostra o estado vazio da 4.4.

### 4.2 Cabeçalho de seção — novo `src/components/suggestions/SuggestionSection.tsx`
- Ícone num círculo de 40px (fundo `--card`, borda `--card-border`), título `h3` em `--text-xl`/`--font-weight-semibold`, contador "4 lugares" (ou "2 eventos") em `--text-sm`/`--muted` ao lado ou abaixo do título.
- Uma linha de descrição curta em `--muted` por seção:
  - Eventos: "Acontecendo em {cidade} enquanto você estiver lá."
  - Pontos turísticos: "Os lugares mais conhecidos da cidade."
  - Fora do circuito: "O que os moradores frequentam."
  - Gastronomia / Cultura / Natureza / Vida noturna / Compras: "Porque você marcou {interesse} no perfil."
- Conteúdo: **carrossel horizontal** (`overflow-x: auto`, `scroll-snap-type: x mandatory`, `gap: var(--space-3)`, padding lateral igual ao da tela pra o primeiro card alinhar com o título; scrollbar escondida; navegável por teclado: cada card é focável).
- Espaçamento: **`--space-8` (32px) entre uma seção e outra**; `--space-4` entre cabeçalho e carrossel.

### 4.3 Card de lugar — novo `src/components/suggestions/PlaceCard.tsx`
Substitui o `PlaceRow` nesta aba (o `PlaceRow` pode continuar existindo se for usado em outro lugar; se não for, apagar).
- Largura 200px, foto no topo 4:3 com `--radius-photo` (via `usePlaceThumbnail(place.wikiTitle ?? place.name)`, fallback com a inicial como hoje).
- Sobre a foto, canto superior direito: botão redondo 44px **"+"** (não adicionado) ou **"✓"** (adicionado, fundo `--accent`, texto branco). `aria-pressed`, `aria-label="Adicionar {nome} ao roteiro"` / "Remover…".
- Abaixo da foto: nome (`--text-lg`, 2 linhas no máximo), bairro com `📍` em `--text-sm`/`--muted`, e os chips das categorias do lugar com ícone (mesmo mapa de ícones da tabela acima, pequenos, só leitura).
- Card inteiro com borda `--accent` quando adicionado. Ao adicionar: toast "Lugar adicionado" (já existe).

### 4.4 Card de evento — novo `src/components/suggestions/EventCard.tsx`
Visual diferente de lugar, pra seção de eventos se destacar:
- Largura 240px, sem foto. À esquerda, **bloco de data** (fundo `--accent`, texto branco, raio do card): dia da semana abreviado em cima ("SÁB"), número grande ("21"), mês embaixo ("NOV").
- À direita: ícone do tipo (`🎵` show, `🧺` feira, `💃` dança, `🎺` cerimônia, `🌕` céu) + nome do evento (2 linhas no máximo); `🕗 {time}`; `📍 {venue}`; `🎟️ {price}`. Se tiver `recurring`, um selo pequeno "Todo domingo" etc.
- Link "Fonte: {sourceLabel}" (`target="_blank"`, `--text-sm`). Se tiver `note`, mostrar em `--muted` abaixo.
- Botão de largura cheia embaixo: **"Adicionar ao roteiro"** (secundário) / **"✓ No roteiro, {dd/mm}"** (estado ativo). Chama `trip.toggleEvent(id)` + toast "Evento adicionado ao dia {dd/mm}".
- **Estado vazio** da seção: card baixo com `📅` e "Nenhum evento encontrado em {cidade} nas suas datas." Se o destino não tiver datas: "Preencha as datas de {cidade} em Destinos pra ver eventos." com link.

### 4.5 O que sai
- A lista vertical única de `PlaceRow` sai desta aba.
- O card de sugestão "Já tem lugares escolhidos. Quer convidar alguém?" continua, no fim da aba.

---

## 5. Aba Roteiro (Lista): eventos no dia + ícones + respiro

`src/screens/Itinerary.tsx` e `src/components/itinerary/TimelineStop.tsx`:

### 5.1 Eventos escolhidos aparecem no dia certo
- Pra cada dia, pegar os eventos de `trip.selectedEventIds` cuja `date === dateISO` e `cityId` igual à cidade do destino daquele dia.
- Renderizar **antes das paradas**, como `TimelineStop` com: `orderLabel` = "📅 Evento · {time}", título = nome, descrição = `venue`, sem foto (ou ícone grande do tipo no lugar da foto), **sem** seletor "mover pra outro dia" (data fixa) e com botão "Remover" em vez de "Pulei" (`trip.toggleEvent`).
- Dia sem lugares mas com evento não mostra mais "Nenhum lugar alocado".
- Mapa: eventos com `lat`/`lng` entram como pin também (mesmo componente, rótulo "📅 {nome}"); a Lua cheia (sem coordenada) não entra.

### 5.2 Mais ícones
- Cabeçalho do dia: `📅 Sábado, 21 de novembro` (título) e embaixo `📍 Buenos Aires · Dia 2 de 6` (subtítulo).
- Em cada parada (lugar), abaixo do título, os chips de categoria com ícone (mesmo mapa da 4.1). Paradas customizadas: ícone `✏️` "Adicionado por você".
- "Pulei" mantém `⏭`, "Desfazer" mantém `↺`; o seletor de mover dia ganha `↔` antes do texto.
- "Ver dicas locais desse dia →" ganha `💡` na frente.

### 5.3 Mais espaçamento
- Entre cards de dia: `--space-6` (era menor).
- Padding interno do card de dia: `--space-5`.
- Cabeçalho do dia → primeira parada: `--space-4`; entre paradas: `--space-5`.
- Ações da parada (mover/pulei) numa linha própria abaixo da descrição, com `--space-3` acima e `gap: var(--space-2)`.

---

## 6. Mapa de ícones num lugar só — novo `src/utils/categoryVisuals.ts`
```ts
export const SECTION_ICONS = {
  eventos: '📅', turistico: '📍', 'fora-do-circuito': '🧭',
  gastronomia: '🍽️', cultura: '🏛️', natureza: '🌿', 'vida-noturna': '🌙', compras: '🛍️',
} as const;
export const EVENT_KIND_ICONS: Record<EventKind, string> = {
  show: '🎵', feira: '🧺', danca: '💃', cerimonia: '🎺', ceu: '🌕',
};
```
Usado na faixa do perfil, nos atalhos, nos cabeçalhos de seção, nos cards e no Roteiro. Ícone sempre com `aria-hidden="true"` e texto do lado (nunca ícone sozinho carregando significado).

## 7. `CLAUDE.md`
Atualizar o item 4 da listagem de telas (Roteiro): aba "Sugestões" por seções do perfil + eventos reais (`src/data/events.json`, fonte `docs/dados/events.json`, 7 eventos checados em 02/out/2026, com `sourceUrl`); e acrescentar em "Dados reais, sem IA generativa" que eventos seguem a mesma regra (nunca evento inventado; se não houver evento real na data, a seção mostra estado vazio).

## 8. Conferir
- [ ] Perfil do cenário (seção 1.2) → em Buenos Aires aparecem, nesta ordem: Eventos (3), Pontos turísticos, Fora do circuito, Gastronomia, Cultura e história, Natureza.
- [ ] San Pedro de Atacama: Eventos mostra a Lua cheia; não aparece seção de Gastronomia se não houver lugar daquela categoria lá (ou aparece se houver: hoje há 1).
- [ ] Perfil vazio → convite pra responder o perfil + todas as seções visíveis.
- [ ] Adicionar Don Julio em Gastronomia → aparece com ✓ também em Pontos turísticos (se estiver lá).
- [ ] Adicionar "Feira de San Telmo" → no Roteiro, aparece no domingo 22/11 em Buenos Aires, antes das paradas, sem opção de mover.
- [ ] Chips de atalho rolam até a seção certa.
- [ ] Carrossel navegável por teclado (Tab passa pelos cards; foco visível).
- [ ] `npm run lint` e `npm run build` sem erro.
