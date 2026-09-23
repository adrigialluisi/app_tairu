# Ajuste 17 — Perfil da viagem volta a ser geral; alternador Destino/Perfil fica mais sutil

Feedback da Adriana (10/set/2026), vendo o card "Detalhes por destino" já construído com a personalização por destino (`docs/ajustes-14-interesses-por-destino.md`) e o alternador de abas em `CreateTrip.tsx` (`docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`): dois recuos, nenhum mexe na navegação por menu fixo (`docs/ajustes-13-navegacao-menu-fixo.md`), que continua valendo.

> **Este ajuste substitui `docs/ajustes-14-interesses-por-destino.md` por inteiro** (Interesses e "Já conhece" voltam a ser perguntas gerais da viagem, não por destino) **e substitui só a parte visual do item 1 de `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`** (o alternador Destino/Perfil deixa de usar o componente `Tabs`, mas continua sendo abas dentro da mesma tela — o item 2 desse mesmo ajuste, Membros no menu fixo, **não muda**).

## Por que voltar atrás

- "Acho que ficou muita coisa" — o card de cada destino, com moeda + datas + interesses + já-conhece, ficou denso demais pra uma lista que pode ter vários destinos. Em vez de perder a nuance de "cada destino pode ter um perfil diferente" (Buenos Aires urbano, Ushuaia natureza — exemplo da própria Adriana), a solução passa a ser **pedir mais detalhe no texto da pergunta geral**, não fragmentar a interface.
- "Não gostei do componente de abas, ocupa muito espaço" — o `Tabs` (mesmo componente usado no Roteiro/Dicas, com barra segmentada cheia) é pesado demais só pra alternar entre duas seções de uma mesma tela de cadastro. A troca continua sendo "abas" no sentido funcional (`role="tab"`, dois painéis, mesma tela), só que com uma UI bem mais leve — um par de links de texto, não uma barra segmentada. **Não mexer no componente `Tabs` compartilhado** (usado em Roteiro/Dicas locais, seletor de destino/cidade e no alternador Lista/Mapa) — criar o alternador leve só dentro de `CreateTrip.tsx`, sem tocar nos outros usos.

## 1. `TripContext.tsx` — Interesses e "já conhece" voltam pra `QuizAnswers`

Reverter exatamente a mudança de dados do `ajustes-14`:

```ts
export interface TripDestination {
  id: string;
  cityId: string;
  city: string;
  country: string;
  currencyCode: string;
  dateStart: string | null;
  dateEnd: string | null;
  // interests e knowsDestination SAEM daqui — voltam a ser globais da viagem
}

export interface QuizAnswers {
  pace: QuizPace | null;
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  companionType: QuizCompanionType | null;
  interests: QuizInterest[]; // volta pra cá — default []
  knowsDestination: QuizKnowsDestination | null; // volta pra cá — default null
}
```

- `initialQuiz` ganha `interests: []` e `knowsDestination: null`.
- `addDestination` deixa de inicializar `interests`/`knowsDestination` (esses campos não existem mais em `TripDestination`) — o tipo do parâmetro volta a ser `Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>`.
- Remover `toggleDestinationInterest` e `setDestinationKnowsDestination` de `TripContextValue` e da implementação.
- Adicionar de volta `toggleQuizInterest: (interest: QuizInterest) => void` em `TripContextValue`, com a mesma lógica de toggle que `toggleDestinationInterest` tinha, só que operando em `quiz.interests` (via `setQuiz`) em vez de por destino:

```ts
toggleQuizInterest: (interest) =>
  setQuiz((prev) => ({
    ...prev,
    interests: prev.interests.includes(interest)
      ? prev.interests.filter((i) => i !== interest)
      : [...prev.interests, interest],
  })),
```

- `setQuizAnswer` já serve pra `knowsDestination` (é um valor único, igual `pace`/`rhythm`/`budget`/`companionType`) — não precisa de função nova pra esse campo.

## 2. `DestinationField.tsx` — remover o bloco "Personalizar esse destino"

- Remover o `<div className={styles.personalize}>` inteiro (Interesses + Já conhece) de dentro de cada `.detailsCard`, incluindo o `<span className={styles.personalizeLabel}>`.
- Remover as props `onToggleInterest` e `onKnowsDestinationChange` da interface `DestinationFieldProps` e da assinatura do componente.
- Remover os imports que só existiam por causa desse bloco: `INTEREST_OPTIONS`, `KNOWS_DESTINATION_OPTIONS` de `../../data/quizOptions`, `QuizInterest`/`QuizKnowsDestination` de `../../context/TripContext`, `OptionChipGroup` e `MultiOptionChipGroup`.
- O tipo do parâmetro `onAdd` volta a `Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>` (sem `interests`/`knowsDestination`, que não existem mais nesse tipo).
- `DestinationField.module.css`: as classes `.personalize` e `.personalizeLabel` (linhas ~152 e ~160 hoje) ficam sem uso — pode remover, ou deixar comentado se preferir não mexer no CSS agora; não é bloqueante.

## 3. `CreateTrip.tsx` — parar de passar as props removidas

No `<DestinationField>`, remover as duas props que não existem mais:

```tsx
<DestinationField
  destinations={trip.destinations}
  onAdd={trip.addDestination}
  onRemove={trip.removeDestination}
  onCurrencyChange={trip.setDestinationCurrency}
  onDateRangeChange={trip.setDestinationDateRange}
  dateOverlapError={overlapError}
/>
```

## 4. `TripProfileQuiz.tsx` — 6 perguntas de novo, com copy nova pra cobrir todos os destinos

Adicionar de volta, ao final do componente (depois de "Como vai ser essa viagem?"), as duas perguntas que tinham saído no `ajustes-14` — reaproveitando `MultiOptionChipGroup`/`OptionChipGroup` e as opções já existentes em `src/data/quizOptions.ts` (`INTEREST_OPTIONS`, `KNOWS_DESTINATION_OPTIONS` — essas constantes não mudam, só voltam a ser usadas aqui em vez de em `DestinationField.tsx`).

**A diferença em relação ao Quiz original (pré-`ajustes-14`): um parágrafo de apoio antes dessas duas perguntas, pedindo detalhe cobrindo todos os destinos** — é a compensação direta por essas perguntas terem deixado de ser por destino:

```tsx
import { MultiOptionChipGroup } from './MultiOptionChipGroup';
import { INTEREST_OPTIONS, KNOWS_DESTINATION_OPTIONS } from '../../data/quizOptions';
import { useTrip, /* ...tipos já importados... */ } from '../../context/TripContext';

// ...dentro do componente, depois da pergunta "Como vai ser essa viagem?":

{trip.destinations.length > 1 && (
  <p className={styles.multiDestinationHint}>
    Essa viagem tem {trip.destinations.length} destinos — pense em todos eles ao
    responder as próximas duas perguntas. Marque tudo que fizer sentido pra
    qualquer um dos lugares, mesmo que eles sejam bem diferentes entre si
    (ex.: um destino mais urbano e outro mais de natureza).
  </p>
)}

<MultiOptionChipGroup
  legend="Interesses da viagem"
  options={INTEREST_OPTIONS}
  values={trip.quiz.interests}
  onToggle={trip.toggleQuizInterest}
/>

<OptionChipGroup
  legend="Já conhece algum desses destinos?"
  options={KNOWS_DESTINATION_OPTIONS}
  value={trip.quiz.knowsDestination}
  onChange={(v) => trip.setQuizAnswer('knowsDestination', v)}
/>
```

`TripProfileQuiz.tsx` não tem acesso a `styles` ainda hoje (não usa CSS Modules, só `OptionChipGroup`) — criar `TripProfileQuiz.module.css` só com a classe `.multiDestinationHint` (texto secundário, mesmo tom de `--muted`, `font-size` menor, sem virar alerta/erro — é uma dica, não uma validação).

O parágrafo só aparece com mais de 1 destino cadastrado (`trip.destinations.length > 1`) — com 1 destino só, a pergunta já é implicitamente sobre aquele destino, não precisa do reforço.

## 5. Lugares e Dicas locais — voltar a usar `trip.quiz.interests`

Reverter a troca de fonte de dados feita no `ajustes-14`, em `Itinerary.tsx`:

```ts
// volta a ser assim (era destination.interests / tipsDestination.interests):
const rankedPlaces = rankPlacesByProfile(cityPlaces, trip.quiz.interests, trip.quiz.pace);
```

E na aba Dicas locais, a chamada de `getAlsoWorthVisiting` volta a passar `trip.quiz.interests` no lugar de `tipsDestination.interests`.

## 6. `CreateTrip.tsx` — alternador Destino/Perfil sem o componente `Tabs`

Trocar o bloco `<Tabs name={TABS_NAME} ...>` por um alternador leve, local a esse arquivo (não um componente novo em `src/components/shell` — é específico dessa tela, não reaproveitado em nenhum outro lugar ainda). Mantém a mesma semântica de abas (`role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls`) pra acessibilidade, só troca a aparência de barra segmentada cheia por um par de links de texto:

```tsx
<div className={styles.sectionSwitcher} role="tablist" aria-label="Seções da viagem">
  <button
    type="button"
    role="tab"
    id={`${TABS_NAME}-tab-destino`}
    aria-selected={activeTab === 'destino'}
    aria-controls={`${TABS_NAME}-panel-destino`}
    className={activeTab === 'destino' ? styles.sectionLinkActive : styles.sectionLink}
    onClick={() => setActiveTab('destino')}
  >
    Destino
  </button>
  <button
    type="button"
    role="tab"
    id={`${TABS_NAME}-tab-perfil`}
    aria-selected={activeTab === 'perfil'}
    aria-controls={`${TABS_NAME}-panel-perfil`}
    className={activeTab === 'perfil' ? styles.sectionLinkActive : styles.sectionLink}
    onClick={() => setActiveTab('perfil')}
  >
    Perfil da viagem
  </button>
</div>
```

O resto do arquivo (`activeTab` state, os dois `<div role="tabpanel">`) não muda — só o que fica entre o campo "Nome da viagem" e os painéis.

**CSS novo em `CreateTrip.module.css`** (substituindo o que hoje vem do `Tabs`, que não é mais usado aqui):

```css
.sectionSwitcher {
  display: flex;
  gap: var(--space-4);
  margin-block: var(--space-4);
  /* sem borda, sem fundo, sem padding de "barra" — é só uma linha de links */
}

.sectionLink,
.sectionLinkActive {
  background: none;
  border: none;
  padding: var(--space-2) 0;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px; /* alvo de toque, mesmo sem parecer um botão cheio */
  color: var(--muted);
  border-bottom: 2px solid transparent;
}

.sectionLinkActive {
  color: var(--text);
  border-bottom-color: var(--accent);
}
```

(Valores exatos de cor/espaçamento — ajustar pra bater com os tokens já existentes no arquivo, o importante é: sem fundo, sem borda ao redor, sublinhado só no item ativo, nitidamente mais leve que uma barra `Tabs` cheia.)

**Import do `Tabs` sai de `CreateTrip.tsx`** (não é mais usado nesse arquivo) — mas o componente `Tabs` em si **não muda em nada** e continua sendo usado normalmente no Roteiro (abas Lugares/Roteiro/Dicas, seletor de destino/cidade, alternador Lista/Mapa).

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Quiz de perfil (aba "Perfil da viagem" em Destinos) mostra 6 perguntas: Relax/urbano, Ritmo, Orçamento, Como vai ser essa viagem, Interesses da viagem, Já conhece algum desses destinos.
- Com 2+ destinos cadastrados, aparece o parágrafo pedindo pra considerar todos os destinos antes das perguntas de Interesses/Já conhece; com 1 destino só, o parágrafo não aparece.
- Cada card de destino em "Destinos e datas" volta a mostrar só moeda + datas — sem bloco de "Personalizar esse destino".
- Marcar "Natureza" em Interesses da viagem reordena a lista de lugares de **todos** os destinos (não é mais por destino individual).
- O alternador Destino/Perfil em cima da tela de Destinos aparece como dois links de texto (não uma barra cheia), com sublinhado no item ativo — visualmente mais discreto que antes.
- Os outros usos de `Tabs` no app (Roteiro/Dicas locais, seletor de destino/cidade, Lista/Mapa) continuam exatamente iguais — nenhum ficou mais sutil sem pedido.
- Nenhuma referência sobrando a `toggleDestinationInterest`/`setDestinationKnowsDestination`/`onToggleInterest`/`onKnowsDestinationChange` no código.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`.
