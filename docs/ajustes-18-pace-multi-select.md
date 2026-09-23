# Ajuste 18 — "Relax ou urbano?" vira múltipla escolha

Feedback da Adriana (11/set/2026): "no perfil da viagem os pills vão ter que ser multi select. Se eu tenho viagens que vão ser urbanas e relax tem que ser possível escolher mais de um." Uma viagem pode ter os dois perfis ao mesmo tempo (ex.: dias mais urbanos e dias mais relax na mesma viagem) — a pergunta 1 do Quiz deixa de ser seleção única e vira múltipla escolha, no mesmo padrão já usado em "Interesses da viagem".

> **Nota sobre pesquisa validada:** esta é uma das 3 perguntas marcadas em `docs/tela-03-quiz-perfil.md` como "Padrão 4, confirmado em 9/10 entrevistados — não alterar texto nem opções". Este ajuste muda só o **modelo de interação** (única → múltipla escolha) — o texto da pergunta e as 3 opções (Relax / Equilibrado / Urbano) continuam exatamente iguais, nada do achado de pesquisa em si é alterado. Registrar isso no `tela-03-quiz-perfil.md` como uma exceção documentada, não como uma reabertura geral das 3 perguntas validadas.

## 1. `TripContext.tsx` — `pace` vira array

```ts
export interface QuizAnswers {
  pace: QuizPace[]; // era QuizPace | null — agora múltipla escolha
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  companionType: QuizCompanionType | null;
  interests: QuizInterest[];
  knowsDestination: QuizKnowsDestination | null;
}
```

- `initialQuiz.pace` passa de `null` pra `[]`.
- `setQuizAnswer` continua servindo só pras perguntas de seleção única (`rhythm`, `budget`, `companionType`, `knowsDestination`) — `pace` sai da lista de campos que ele cobre.
- Nova função em `TripContextValue`, mesmo padrão de `toggleQuizInterest`:

```ts
toggleQuizPace: (pace: QuizPace) => void;
```

```ts
toggleQuizPace: (pace) =>
  setQuiz((prev) => ({
    ...prev,
    pace: prev.pace.includes(pace) ? prev.pace.filter((p) => p !== pace) : [...prev.pace, pace],
  })),
```

## 2. `TripProfileQuiz.tsx` — trocar `OptionChipGroup` por `MultiOptionChipGroup` só nessa pergunta

```tsx
<MultiOptionChipGroup
  legend="Relax ou urbano?"
  options={PACE_OPTIONS}
  values={trip.quiz.pace}
  onToggle={trip.toggleQuizPace}
/>
```

(Substitui o `<OptionChipGroup ... value={trip.quiz.pace} onChange={(v) => trip.setQuizAnswer('pace', v)} />` atual.) `PACE_OPTIONS` não muda. As outras 3 perguntas de seleção única (Ritmo, Orçamento, Como vai ser essa viagem) continuam em `OptionChipGroup`, sem mudança — só "Relax ou urbano?" e "Interesses da viagem" ficam multi-select agora.

## 3. `src/data/index.ts` — `rankPlacesByProfile`/`getAlsoWorthVisiting` recebem array

```ts
export function rankPlacesByProfile(
  cityPlaces: PlaceEntry[],
  interests: QuizInterest[],
  pace: QuizPace[], // era QuizPace | null
): PlaceEntry[] {
  function score(place: PlaceEntry): number {
    let s = 0;
    if (place.categories.some((c) => interests.includes(c as QuizInterest))) s += 2;
    if (pace.includes('relax') && place.categories.includes('natureza')) s += 1;
    if (pace.includes('urbano') && (place.categories.includes('cultura') || place.categories.includes('vida-noturna'))) s += 1;
    return s;
  }
  return [...cityPlaces].sort((a, b) => score(b) - score(a));
}
```

Mesma troca de tipo em `getAlsoWorthVisiting`. Se a pessoa marcar **Relax e Urbano ao mesmo tempo**, um lugar que seja tanto "natureza" quanto "cultura"/"vida-noturna" pode somar os dois bônus — não precisa de tratamento especial, é o comportamento natural da soma. Marcar "Equilibrado" (sozinho ou junto com os outros) não muda pontuação nenhuma, igual hoje (nunca teve bônus próprio).

Os call-sites em `Itinerary.tsx` (`rankPlacesByProfile(cityPlaces, trip.quiz.interests, trip.quiz.pace)` e a chamada de `getAlsoWorthVisiting`) não precisam mudar — já passam `trip.quiz.pace` direto, só o tipo dele muda de `QuizPace | null` pra `QuizPace[]`.

## 4. `docs/tela-03-quiz-perfil.md` — atualizar a pergunta 1

Trocar a linha `1. **Relax ou urbano?** — Relax / Equilibrado / Urbano` (dentro de "Já validadas por pesquisa") por:

```
1. **Relax ou urbano?** — Relax / Equilibrado / Urbano. **Múltipla escolha desde 11/set/2026** (ver `docs/ajustes-18-pace-multi-select.md`) — uma viagem pode ter os dois perfis ao mesmo tempo (ex.: dias mais urbanos e dias mais relax na mesma viagem). Texto e opções continuam os mesmos do achado de pesquisa original — só o modelo de interação mudou, de seleção única pra múltipla escolha, igual "Interesses da viagem".
```

E na frase geral do "Objetivo" ("toda pergunta é seletor de toque único ou multi-toque") não precisa mudar nada — já cobria a possibilidade.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- "Relax ou urbano?" permite marcar mais de uma opção ao mesmo tempo (ex.: Relax + Urbano juntos), com o mesmo visual de chip múltiplo já usado em "Interesses da viagem".
- Marcar só "Relax" prioriza lugares de natureza; marcar só "Urbano" prioriza cultura/vida-noturna; marcar os dois dá bônus pros dois tipos de lugar ao mesmo tempo.
- Nenhuma referência sobrando a `setQuizAnswer('pace', ...)` no código.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
