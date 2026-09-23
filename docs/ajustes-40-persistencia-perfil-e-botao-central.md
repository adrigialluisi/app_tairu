# Ajuste 40 — Perfil da viagem "esquece" que foi salvo ao trocar de seção; botão "Ir pra Central" vira vermelho padrão

Feedback da Adriana (22/set/2026), testando o fluxo completo: "em nova viagem eu escolhi os destinos e o perfil e salvei, fui até a central e quando voltei pra destinos, estava assim como se não tivesse sido salvo. Isso não pode acontecer." E: "o botão de seguir para central tem que ser esse vermelho padrão também."

## 1. Bug: Passo 2 (Perfil da viagem) volta a aparecer como formulário não-salvo

**Causa raiz**, em `src/screens/CreateTrip.tsx`: o Passo 1 (Destino) calcula se já foi salvo a partir do próprio dado da viagem (`isDestinosComplete(trip)`), então sobrevive a trocar de tela e voltar. O Passo 2 (Perfil), não — `perfilSaved` é um `useState(false)` fixo, sem nenhuma lógica de recalcular a partir do que já está salvo. Toda vez que `CreateTrip` remonta (ex.: sair pra Central e voltar pra Destinos), `perfilSaved` volta pro valor inicial `false`, e o Passo 2 volta a mostrar o formulário editável em vez do resumo — mesmo com as respostas do quiz intactas no `TripContext` (dá pra ver isso no print: os chips continuam marcados, só a tela que "esqueceu" que aquele passo já tinha sido confirmado).

Corrigir só isso com outro `isPerfilComplete(trip)` (derivado do conteúdo do quiz) é frágil: nenhuma das 6 perguntas é obrigatória hoje, então uma viagem real pode ser salva com campos em branco e o heurístico erraria de novo. A causa raiz de verdade é que **o estado "esse passo foi salvo" nunca devia ter sido `useState` local da tela** — ele precisa viver no mesmo lugar que o resto do dado da viagem (`TripContext`), que já sobrevive a navegação. Isso também corrige, de forma preventiva, o mesmo risco latente que já existe hoje no Passo 1 (se uma pessoa adicionar um destino sem preencher as datas — o botão "Salvar destinos" não exige isso — `isDestinosComplete` recalcularia `false` ao voltar pra tela, com o mesmo sintoma).

### `src/context/TripContext.tsx`

Adicionar `destinosSaved`/`perfilSaved` como estado de verdade do contexto, do mesmo jeito que `destinations`/`quiz` já são:

- Na interface `TripState`, adicionar: `destinosSaved: boolean;` e `perfilSaved: boolean;`
- Na interface `TripContextValue`, adicionar: `setDestinosSaved: (value: boolean) => void;` e `setPerfilSaved: (value: boolean) => void;`
- Em `TripProvider`, adicionar os dois estados:
  ```ts
  const [destinosSaved, setDestinosSaved] = useState(false);
  const [perfilSaved, setPerfilSaved] = useState(false);
  ```
- Incluir `destinosSaved`, `perfilSaved`, `setDestinosSaved`, `setPerfilSaved` no objeto `value` do `useMemo`, e os dois estados na array de dependências do `useMemo`.
- Em `resetTrip()`, adicionar `setDestinosSaved(false);` e `setPerfilSaved(false);` junto dos outros resets (nova viagem começa com os dois passos não-salvos, como já é hoje).

### `src/screens/CreateTrip.tsx`

- Remover o `useState` local dos 3 flags (`destinoSaved`, `perfilUnlocked`, `perfilSaved`) e o import de `isDestinosComplete` (que continua existindo em `tripProgress.ts` e continua usado pelo `BottomNav.tsx` — não mexer nisso).
- `perfilUnlocked` deixa de ser estado próprio — vira derivado direto: `const perfilUnlocked = trip.destinosSaved || trip.perfilSaved;` (mantém a regra "depois que desbloqueou uma vez, não trava de novo mesmo se voltar a editar Destinos" — se o perfil já foi salvo antes, `trip.perfilSaved` sozinho já garante isso).
- `handleSaveDestinos()`: trocar `setDestinoSaved(true)` por `trip.setDestinosSaved(true)` (`setPerfilUnlocked(true)` só é removido, já não existe mais).
- No primeiro `<StepSection>` (Destino): `saved={destinoSaved}` → `saved={trip.destinosSaved}`; `onEdit={() => setDestinoSaved(false)}` → `onEdit={() => trip.setDestinosSaved(false)}`.
- No segundo `<StepSection>` (Perfil da viagem): `saved={perfilSaved}` → `saved={trip.perfilSaved}`; `onEdit={() => setPerfilSaved(false)}` → `onEdit={() => trip.setPerfilSaved(false)}`.
- No botão "Salvar perfil da viagem": `setPerfilSaved(true)` → `trip.setPerfilSaved(true)` (mantém o `show('Perfil da viagem salvo')`).
- Na condição do `SuggestionCard` no fim: `perfilSaved && trip.companions.length === 0` → `trip.perfilSaved && trip.companions.length === 0`.

## 2. Botão "Ir pra Central" (e qualquer outro CTA de `SuggestionCard`) vira vermelho padrão

`SuggestionCard.tsx` chama o botão de ação com `variant="secondary"` (fundo claro/creme, mesmo estilo do botão "Editar") — a Adriana quer o mesmo vermelho sólido (`--accent`) dos botões principais tipo "Salvar perfil da viagem". Esse componente é compartilhado (usado em Destinos → "Ir pra Central" e em Roteiro → sugestão de convidar companheiros), então a mudança vale pros dois de uma vez, o que é o comportamento desejado (consistência entre CTAs de sugestão).

**`src/components/shell/SuggestionCard.tsx`** — trocar:
```tsx
<Button variant="secondary" onClick={() => navigate(to)}>
  {actionLabel}
</Button>
```
por:
```tsx
<Button onClick={() => navigate(to)}>
  {actionLabel}
</Button>
```
(`variant` some porque `primary` já é o default do componente `Button` — ver `Button.tsx`.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Fluxo de teste: criar viagem nova → preencher e salvar Destino → preencher e salvar Perfil da viagem → ir pra Central (ou qualquer outra seção do menu) → voltar pra Destinos. Os dois passos devem aparecer como resumo salvo (com "Editar"), não como formulário em branco/editável de novo.
- Clicar "Editar" no Passo 1 (Destino) e confirmar que o Passo 2 continua desbloqueado e salvo (não deve reaparecer o aviso "o perfil da viagem aparece aqui depois que você salvar os destinos").
- Botão "Ir pra Central" (Destinos) e o botão de sugestão em Roteiro (convidar companheiros) aparecem vermelhos sólidos, iguais aos outros botões principais — não mais com fundo claro.
- Testar "Nova viagem" (Início) depois do fluxo acima: os dois passos devem voltar a aparecer como não-salvos (reset funcionando).
