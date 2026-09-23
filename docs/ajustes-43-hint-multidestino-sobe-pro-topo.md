# Ajuste 43 — Aviso "essa viagem tem N destinos" sobe pra logo abaixo do título "Perfil da viagem"

Feedback da Adriana (22/set/2026), vendo o Passo 2 com uma viagem de 2 destinos: o parágrafo "Essa viagem tem 2 destinos — pense em todos eles ao responder as próximas duas perguntas..." está no meio das perguntas (hoje entre "Como vai ser essa viagem?" e "Interesses da viagem", porque ele avisa especificamente sobre as 2 últimas perguntas gerais — Interesses e Já conhece). Ela quer esse aviso logo no topo da seção, abaixo do título "Perfil da viagem", antes de qualquer pergunta.

## O que muda

**`src/components/quiz/TripProfileQuiz.tsx`** — só reposicionar o bloco, sem mudar texto/lógica:

Tirar isto de onde está hoje (entre a pergunta "Como vai ser essa viagem?" e "Interesses da viagem"):
```tsx
{trip.destinations.length > 1 && (
  <p className={styles.multiDestinationHint}>
    Essa viagem tem {trip.destinations.length} destinos — pense em todos eles ao responder as próximas duas
    perguntas. Marque tudo que fizer sentido pra qualquer um dos lugares, mesmo que eles sejam bem diferentes
    entre si (ex.: um destino mais urbano e outro mais de natureza).
  </p>
)}
```
E colocar como o primeiro elemento dentro do `<>...</>` do componente, antes de `<MultiOptionChipGroup legend="Turístico ou fora do circuito?" .../>` (a primeira pergunta). Como o `TripProfileQuiz` é renderizado dentro do `<StepSection title="Perfil da viagem">` em `CreateTrip.tsx`, isso já coloca o aviso logo abaixo do título "2 Perfil da viagem", antes da primeira pergunta.

Nada mais muda: mesma condição (`trip.destinations.length > 1`), mesmo texto, mesma classe CSS.

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Numa viagem com 2+ destinos, o aviso "Essa viagem tem N destinos..." aparece logo abaixo do título "Perfil da viagem", antes de "Turístico ou fora do circuito?" — não mais entre as perguntas.
- Numa viagem com só 1 destino, o aviso continua não aparecendo (condição inalterada).
