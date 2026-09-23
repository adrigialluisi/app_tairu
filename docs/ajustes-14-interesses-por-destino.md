# Ajuste 14 — Interesses e "já conhece" viram por destino, não da viagem toda

> **Superado em 10/set/2026.** A Adriana achou que ficou muita coisa nos cards de destino e pediu pra voltar a ter só um Perfil da viagem geral (com copy pedindo mais detalhe, cobrindo todos os destinos). Ver `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md` — este arquivo fica só como registro histórico da decisão anterior.

Pergunta da Adriana (10/set/2026): ela viajou pra Buenos Aires (estilo urbano) e Ushuaia (estilo natureza) na mesma viagem — faz sentido ter um "estilo" só pra viagem inteira, ou isso deveria variar por destino, pra dar dicas mais específicas de cada lugar? Resposta usada como base deste ajuste: **quebrar só as 2 perguntas que já eram hipótese de produto (não achado de pesquisa validado), mantendo intactas as 3 perguntas validadas.**

## Por que quebrar só parte do Quiz

- **Ritmo do dia a dia, Orçamento e Relax/urbano (pace) continuam por viagem** — são achado de pesquisa validado (Padrão 4, 9/10 entrevistados, ver `docs/tela-03-quiz-perfil.md`). Fragmentar uma pergunta validada por destino seria testar uma coisa diferente do que a pesquisa realmente mediu — isso é uma decisão nova, não uma leitura do que já foi validado.
- **Interesses da viagem e Já conhece esse destino já eram hipótese de produto**, não achado de pesquisa — não tem o mesmo risco de descaracterizar algo validado. E fazem mais sentido por destino: "interesses" já alimenta a ordenação de lugares (`rankPlacesByProfile`), que **já** é calculada por destino (cada cidade tem sua própria lista em `places.json`) — então botar Interesses por destino só destrava o que a ordenação já é capaz de fazer, sem precisar de nenhuma característica nova no dataset de lugares (Buenos Aires já vai ranquear cultura/gastronomia primeiro se a pessoa marcar isso pra ela, e um destino de natureza ranquearia natureza primeiro, se marcado assim — sem precisar "etiquetar" a cidade como um todo).
- "Já conhece esse destino" logicamente já varia por cidade (conhecer Buenos Aires não diz nada sobre já conhecer Ushuaia) — mover pra por destino é só corrigir uma imprecisão que já existia.

## Mudanças de dados (`TripContext.tsx`)

`TripDestination` ganha dois campos novos:

```ts
export interface TripDestination {
  id: string;
  cityId: string;
  city: string;
  country: string;
  currencyCode: string;
  dateStart: string | null;
  dateEnd: string | null;
  interests: QuizInterest[]; // novo — default [] ao adicionar destino
  knowsDestination: QuizKnowsDestination | null; // novo — default null ao adicionar destino
}
```

`QuizAnswers` perde os dois campos equivalentes:

```ts
export interface QuizAnswers {
  pace: QuizPace | null;
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  companionType: QuizCompanionType | null;
  // interests e knowsDestination saem daqui
}
```

Novas funções no `TripContextValue` (padrão igual ao `toggleQuizInterest`/`setDestinationCurrency` que já existem):

```ts
toggleDestinationInterest: (destinationId: string, interest: QuizInterest) => void;
setDestinationKnowsDestination: (destinationId: string, value: QuizKnowsDestination) => void;
```

`addDestination` passa a inicializar `interests: []` e `knowsDestination: null` (mesmo padrão que já usa pra `dateStart`/`dateEnd: null`).

## `QuizProfile.tsx` — 4 perguntas, não 6

Remover os blocos de "Interesses da viagem" (`MultiOptionChipGroup`) e "Já conhece algum desses destinos?" (`OptionChipGroup` com `KNOWS_DESTINATION_OPTIONS`), junto com as respectivas constantes de opções (`INTEREST_OPTIONS`, `KNOWS_DESTINATION_OPTIONS`) — essas duas constantes **não somem**, só saem daqui e vão pra um lugar compartilhado (ver seção seguinte). `canContinue` (que vira só validação informativa, já que o botão não trava mais nada — ver `docs/ajustes-13-navegacao-menu-fixo.md`) passa a checar só `pace`, `rhythm`, `budget`, `companionType`.

## `DestinationField.tsx` — novo bloco "Personalizar esse destino" por item

Dentro do `.detailsCard` de cada destino (onde já ficam `CurrencySelect` e `DateRangeField`), adicionar — depois do `DateRangeField`, como parte do mesmo card — um bloco compacto e opcional:

```tsx
<div className={styles.personalize}>
  <span className={styles.personalizeLabel}>Personalizar esse destino (opcional)</span>
  <MultiOptionChipGroup
    legend={`Interesses em ${d.city}`}
    options={INTEREST_OPTIONS}
    values={d.interests}
    onToggle={(interest) => onToggleInterest(d.id, interest)}
  />
  <OptionChipGroup
    legend={`Já conhece ${d.city}?`}
    options={KNOWS_DESTINATION_OPTIONS}
    value={d.knowsDestination}
    onChange={(v) => onKnowsDestinationChange(d.id, v)}
  />
</div>
```

`DestinationField` ganha duas props novas (`onToggleInterest`, `onKnowsDestinationChange`), passadas por `CreateTrip.tsx` a partir de `trip.toggleDestinationInterest`/`trip.setDestinationKnowsDestination`. Sem obrigar preenchimento — é reforço opcional, não trava nada (mesmo espírito do restante da migração de navegação).

**Extrair as opções compartilhadas:** `INTEREST_OPTIONS` e `KNOWS_DESTINATION_OPTIONS` (hoje só dentro de `QuizProfile.tsx`) precisam existir num lugar comum, já que agora são usadas em dois componentes — mover pra `src/data/quizOptions.ts` (ou arquivo equivalente já existente em `src/data`), exportando as duas constantes, e importar dos dois lugares (`QuizProfile.tsx` só as que sobraram lá não usa mais essas duas; `DestinationField.tsx` importa as duas).

## Lugares e Dicas locais — trocar a fonte de `interests`

Em `Itinerary.tsx` (aba Lugares, que segundo `docs/ajustes-13-navegacao-menu-fixo.md` passa a viver aqui) e na aba Dicas locais (`getAlsoWorthVisiting`), toda chamada que hoje usa `trip.quiz.interests` passa a usar `destination.interests` (os interesses **daquele destino específico**, não mais da viagem toda). `trip.quiz.pace` continua sendo usado normalmente (esse não muda de escopo).

```ts
// antes
rankPlacesByProfile(cityPlaces, trip.quiz.interests, trip.quiz.pace)
// depois
rankPlacesByProfile(cityPlaces, destination.interests, trip.quiz.pace)
```

Se `destination.interests` estiver vazio (pessoa não personalizou esse destino), a ordenação simplesmente não dá bônus de interesse a nenhum lugar — cai pra ordem original do dataset, com o `pace` ainda funcionando como desempate. Não precisa de nenhum tratamento especial de "vazio" — o `score()` de `rankPlacesByProfile` já lida com array vazio naturalmente.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Quiz de perfil mostra só 4 perguntas (Relax/urbano, Ritmo, Orçamento, Como vai ser essa viagem).
- Cada destino em "Destinos e datas" tem seu próprio bloco de Interesses e "Já conhece" — marcar num destino não afeta o outro.
- Marcar "Natureza" só no destino A (não no B) faz a lista de lugares de A ranquear natureza primeiro, sem afetar a ordenação de B.
- Deixar um destino sem personalizar não trava nada nem gera erro — a lista dele só não é reordenada por interesse.
- Espaçamento segue a regra geral do `CLAUDE.md`.
