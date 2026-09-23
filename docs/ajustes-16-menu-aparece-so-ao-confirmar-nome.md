# Ajuste 16 — Menu fixo não pode "piscar" a cada tecla digitada

Feedback da Adriana (10/set/2026): o menu aparece assim que digita o nome da viagem — "esquisito". Causa raiz: hoje **4 lugares diferentes** (`CreateTrip.tsx`, `InviteCompanions.tsx`, `Itinerary.tsx`, `App.tsx`) calculam `hasName = trip.name.trim().length > 0` de forma independente, direto a cada re-render — ou seja, o `BottomNav` monta/desmonta a cada tecla digitada no campo "Nome da viagem", literalmente no meio da digitação, empurrando o layout embaixo do cursor. Isso também tem um bug latente: se a pessoa apagar o nome depois (em qualquer tela), o menu inteiro some de novo, mesmo já tendo destinos/roteiro montados.

## Correção: virar um estado explícito, "trava uma vez", não recalculado a cada tecla

**`TripContext.tsx`** ganha um novo campo, guardado no estado (não derivado a cada render):

```ts
interface TripState {
  // ...campos existentes
  hasStartedTrip: boolean; // novo — default false
}

interface TripContextValue extends TripState {
  // ...
  markTripStarted: () => void; // novo — liga a flag, nunca desliga (idempotente)
}
```

`markTripStarted` só faz `setHasStartedTrip(true)`. Uma vez ligada, o menu fixo fica visível pelo resto da sessão, mesmo que a pessoa depois apague o nome da viagem — a viagem já "existe", não faz sentido o menu sumir de novo.

## Quando chamar `markTripStarted`

Só no **momento em que a pessoa termina de preencher o nome**, não a cada tecla — em `CreateTrip.tsx`, no campo "Nome da viagem":

```tsx
<TextField
  id="trip-name"
  label="Nome da viagem"
  placeholder="Ex.: Réveillon em família"
  value={trip.name}
  onChange={trip.setName}
  onBlur={() => {
    if (trip.name.trim().length > 0) trip.markTripStarted();
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && trip.name.trim().length > 0) trip.markTripStarted();
  }}
  required
/>
```

(`TextField` já repassa `onBlur`/`onKeyDown` nativamente pro `<input>` via spread de props — não precisa mexer no componente.)

## Trocar a condição do menu nos 4 lugares

Em `CreateTrip.tsx`, `InviteCompanions.tsx`, `Itinerary.tsx` e `App.tsx` (`SectionComingSoon`), trocar toda ocorrência de `trip.name.trim().length > 0` por `trip.hasStartedTrip`:

```tsx
// antes
const hasName = trip.name.trim().length > 0;
// depois
const hasName = trip.hasStartedTrip;
```

## Polimento opcional (baixo risco, vale a pena)

Em `BottomNav.module.css`, adicionar uma animação de entrada suave no `.nav`, pra quando ele aparecer (ao confirmar o nome) não ser um "pulo" seco:

```css
.nav {
  /* ...regras existentes */
  animation: bottomNavIn 200ms ease-out;
}

@keyframes bottomNavIn {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Digitar no campo "Nome da viagem" **não** faz o menu aparecer a cada tecla — só ao sair do campo (clicar/tab pra outro lugar) ou apertar Enter, e só se já tiver algum texto.
- Depois que o menu aparece uma vez, apagar o nome da viagem inteiro **não** faz o menu sumir de novo.
- O menu continua aparecendo igual nas 6 seções (Destinos, Membros, Roteiro, Reservas, Documentos, Gastos).
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
