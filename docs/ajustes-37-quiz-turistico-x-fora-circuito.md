# Ajuste 37 — "Relax ou urbano?" vira "Turístico ou fora do circuito?"

Feedback da Adriana (15/set/2026): "Esse relax ou urbano não reflete exatamente um perfil bem identificável. Montar uma outra opção que capte informações mais específicas." Esclarecido por pergunta direta: o problema é o EIXO da pergunta, não só a redação — e ela escolheu a direção entre 3 opções que dei: substituir por um eixo novo, **turístico × fora do circuito**.

## Por que essa pergunta specificamente

As outras 2 perguntas do Quiz já cobrem, cada uma, o que "Relax ou urbano" tentava capturar de forma indireta: Interesses da viagem já pergunta direto por categoria (gastronomia/cultura/natureza/vida-noturna/compras), Ritmo do dia a dia já pergunta por intensidade (tranquilo/moderado/corrido). "Turístico × fora do circuito" é um eixo genuinamente novo — não é quantidade de coisas por dia, não é categoria de lugar, é sobre **o quanto a pessoa quer ver os pontos mais conhecidos vs. explorar algo menos óbvio** — e dá pra usar direto na ordenação de lugares sugeridos.

**Isso exige dado novo, não só pergunta nova**: cada um dos 53 lugares já curados precisa de uma etiqueta "turístico" ou "fora do circuito" pra pergunta ter efeito real na recomendação. **Já fiz essa curadoria** (critério: quão em destaque o lugar aparece nos principais guias de viagem/quão movimentado costuma ser, não é opinião solta) — `docs/dados/places.json` já tem o campo novo `popularity` em todos os 53 lugares (33 turístico, 20 fora do circuito, distribuição parecida nas 3 cidades). Falta só o código usar isso.

## 1. Dado: `popularity` em cada lugar

`docs/dados/places.json` já tem, em cada entrada, um campo novo:

```json
"popularity": "turistico"
```
ou
```json
"popularity": "fora-do-circuito"
```

**No código**: copiar esse campo novo pra `src/data/places.json` — **cuidado, mesmo risco já sinalizado no `ajustes-30`**: `src/data/places.json` tem `wikiTitle` corrigidos manualmente que não existem em `docs/dados/places.json`. Não sobrescrever o arquivo inteiro — só ADICIONAR o campo `popularity` em cada entrada existente (casando por `id`), preservando todo o resto (incluindo os `wikiTitle` já corrigidos).

## 2. `PlaceEntry` ganha o campo

**`src/data/index.ts`** — no `interface PlaceEntry`, adicionar:

```ts
export interface PlaceEntry {
  id: string;
  cityId: string;
  name: string;
  neighborhood: string;
  categories: string[];
  description: string;
  lat: number;
  lng: number;
  wikiTitle?: string;
  /** "turistico" (pontos mais conhecidos/visitados) ou "fora-do-circuito" — ver docs/ajustes-37-quiz-turistico-x-fora-circuito.md */
  popularity: 'turistico' | 'fora-do-circuito';
}
```

## 3. Tipo do Quiz: `QuizPace` vira `QuizDiscovery`

**`src/context/TripContext.tsx`** — trocar:

```ts
export type QuizPace = 'relax' | 'equilibrado' | 'urbano';
```

por:

```ts
export type QuizDiscovery = 'turistico' | 'equilibrado' | 'fora-do-circuito';
```

E todas as outras referências no mesmo arquivo, mesma lógica de antes (continua múltipla escolha, desde o `ajustes-18` — não muda esse comportamento):

- `pace: QuizPace[]` → `discovery: QuizDiscovery[]` (dentro de `QuizAnswers`)
- `toggleQuizPace: (pace: QuizPace) => void` → `toggleQuizDiscovery: (discovery: QuizDiscovery) => void` (na interface do contexto)
- `pace: []` → `discovery: []` (em `initialQuiz`)
- `toggleQuizPace: (pace) => ...` → `toggleQuizDiscovery: (discovery) => ...`, com a mesma lógica de toggle (adicionar/remover do array), só trocando o nome da chave de `pace` pra `discovery`

## 4. Pergunta do Quiz

**`src/components/quiz/TripProfileQuiz.tsx`** — trocar:

```ts
const PACE_OPTIONS: { value: QuizPace; label: string }[] = [
  { value: 'relax', label: 'Relax' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'urbano', label: 'Urbano' },
];
```

por:

```ts
const DISCOVERY_OPTIONS: { value: QuizDiscovery; label: string }[] = [
  { value: 'turistico', label: 'Turístico' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'fora-do-circuito', label: 'Fora do circuito' },
];
```

E a legenda da pergunta (onde hoje é `legend="Relax ou urbano?"`):

```tsx
legend="Turístico ou fora do circuito?"
```

(Mesmo componente `MultiOptionChipGroup`, mesmo `values={trip.quiz.discovery}` — só troca o nome da prop de `pace` pra `discovery` em todo lugar que usa esse campo dentro do arquivo, incluindo a linha do resumo — hoje algo como `Perfil: ${quiz.pace.map(...)}`, vira `Estilo de descoberta: ${quiz.discovery.map((d) => DISCOVERY_OPTIONS.find((o) => o.value === d)?.label).join(' e ')}`, pra ficar mais claro no resumo do Passo 2 que essa linha não é sobre pace/ritmo).

## 5. Ordenação de lugares usa `popularity`, não mais categoria

**`src/data/index.ts`** — trocar a função inteira:

```ts
/**
 * Ordenação por perfil (hipótese de produto): lugares cuja categoria bate
 * com os Interesses do Quiz vêm primeiro; como desempate, discovery
 * "turistico" prioriza lugares marcados popularity "turistico", discovery
 * "fora-do-circuito" prioriza popularity "fora-do-circuito" (ver
 * docs/ajustes-37-quiz-turistico-x-fora-circuito.md — substitui o critério
 * antigo de pace relax/urbano por categoria, que era redundante com a
 * pergunta de Interesses). `discovery` é múltipla escolha (herdado do
 * ajustes-18) — marcar os dois soma os dois bônus naturalmente. Sort é
 * estável, então empates mantêm a ordem original do dataset.
 */
export function rankPlacesByProfile(
  cityPlaces: PlaceEntry[],
  interests: QuizInterest[],
  discovery: QuizDiscovery[],
): PlaceEntry[] {
  function score(place: PlaceEntry): number {
    let s = 0;
    if (place.categories.some((c) => interests.includes(c as QuizInterest))) s += 2;
    if (discovery.includes('turistico') && place.popularity === 'turistico') s += 1;
    if (discovery.includes('fora-do-circuito') && place.popularity === 'fora-do-circuito') s += 1;
    return s;
  }
  return [...cityPlaces].sort((a, b) => score(b) - score(a));
}
```

E o import no topo do arquivo: `QuizPace` → `QuizDiscovery`.

`getAlsoWorthVisiting` só troca o nome do parâmetro (`pace: QuizPace[]` → `discovery: QuizDiscovery[]`) e repassa pro `rankPlacesByProfile` — mesma estrutura, sem mudança de lógica própria.

## 6. `Itinerary.tsx` — atualizar as 2 chamadas

Trocar `trip.quiz.pace` pelas 2 ocorrências em `src/screens/Itinerary.tsx` (linha da chamada de `rankPlacesByProfile` e a de `getAlsoWorthVisiting`) por `trip.quiz.discovery`.

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro — a troca de nome (`pace`→`discovery`, `QuizPace`→`QuizDiscovery`) precisa estar em TODOS os lugares (o TypeScript deve acusar qualquer um esquecido).
- A pergunta no Quiz aparece como "Turístico ou fora do circuito?" com as 3 opções novas, continua múltipla escolha.
- O resumo do Passo 2 (Perfil da viagem) mostra a resposta nova, não mais "Relax"/"Urbano".
- Marcar "Turístico" muda a ordem dos lugares sugeridos na aba Lugares do Roteiro (lugares com `popularity: "turistico"` sobem), e "Fora do circuito" faz o oposto — testar os dois em Buenos Aires ou Santiago (mistura maior de ambos que Atacama).
- `src/data/places.json` tem o campo `popularity` em todos os 53 lugares, sem perder nenhum `wikiTitle` que já tinha sido corrigido manualmente.
