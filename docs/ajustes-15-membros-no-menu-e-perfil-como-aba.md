# Ajuste 15 — Membros vira item do menu; Perfil da viagem vira aba de Destinos

Feedback da Adriana (10/set/2026), vendo a tela de Destinos já com os links "Convidar companheiros" e "Perfil da viagem" (`docs/ajustes-13-navegacao-menu-fixo.md`): dois ajustes na organização, nenhum muda dado nem lógica de validação.

## 1. Perfil da viagem vira aba dentro de Destinos, não link/rota própria

> **Nota (10/set/2026): a UI do alternador `Tabs` descrita abaixo neste item foi substituída por algo mais sutil em `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md`** — o conceito de aba dentro da mesma tela continua valendo, só a aparência mudou. O item 2 abaixo (Membros no menu fixo) não foi afetado.

Hoje `/quiz` é uma rota separada, aberta por um link em `/destinos`. Passa a ser uma aba **dentro** da própria tela de Destinos, junto de "Destino":

- `CreateTrip.tsx` ganha um `Tabs` (reaproveitando o componente já existente, mesmo padrão usado no Roteiro) logo abaixo do campo "Nome da viagem", com dois itens: **"Destino"** (conteúdo atual: `DestinationField`) e **"Perfil da viagem"** (as 4 perguntas do Quiz — Relax/urbano, Ritmo, Orçamento, Como vai ser essa viagem).
- Extrair o bloco de perguntas de `QuizProfile.tsx` (as 4 `OptionChipGroup`, com as respectivas opções `PACE_OPTIONS`/`RHYTHM_OPTIONS`/`BUDGET_OPTIONS`/`COMPANION_TYPE_OPTIONS`) pra um componente novo, sem `ScreenShell`/`AppBar`/footer próprios — só o conteúdo das perguntas: `src/components/quiz/TripProfileQuiz.tsx`. `CreateTrip.tsx` renderiza `<TripProfileQuiz />` dentro do painel da aba "Perfil da viagem".
- Remover a rota `/quiz` do `App.tsx` e apagar `QuizProfile.tsx` (o conteúdo dele já vive em `TripProfileQuiz.tsx` + a aba de `CreateTrip.tsx`).
- Remover o link "Perfil da viagem →" que hoje fica em `.secondaryLinks` — não existe mais como link separado.

## 2. Membros vira item do menu fixo, não link dentro de Destinos

A Adriana pediu explicitamente: "os membros tem que entrar no menu, porque sempre pode ser possível convidar novos membros" — ou seja, convidar gente é uma ação que faz sentido a qualquer momento da viagem, igual Destinos/Roteiro, não uma etapa de configuração inicial escondida atrás de um link.

- `BottomNav.tsx`: adicionar um 6º item, **"Membros"** (rota `/convidar`, ícone 👥), entre Destinos e Roteiro:

```ts
const ITEMS: NavItem[] = [
  { path: '/destinos', label: 'Destinos', icon: '📍' },
  { path: '/convidar', label: 'Membros', icon: '👥' },
  { path: '/roteiro', label: 'Roteiro', icon: '🧭' },
  { path: '/reservas', label: 'Reservas', icon: '🎫' },
  { path: '/documentos', label: 'Documentos', icon: '📄' },
  { path: '/gastos', label: 'Gastos', icon: '💰' },
];
```

- `InviteCompanions.tsx` passa a ser seção de topo do menu, igual `CreateTrip.tsx`/`Itinerary.tsx` hoje:
  - Remover `onBack` do `AppBar` (não é mais tela secundária, não tem "anterior").
  - Remover o footer inteiro (botão "Salvar e voltar") — não existe mais "voltar", a pessoa navega pelo menu fixo como em qualquer outra seção.
  - Passar `bottomNav={hasName ? <BottomNav /> : undefined}` do mesmo jeito que `CreateTrip.tsx` já faz (`const hasName = trip.name.trim().length > 0`).
  - Texto de intro pode reforçar que é sempre editável: trocar "Convidar é opcional — dá pra seguir sozinho e convidar depois, sem problema nenhum." por algo como "Convide quem quiser, quando quiser — volte aqui a qualquer momento pra adicionar mais gente."
- `App.tsx`: a rota `/convidar` continua igual, só muda o que `InviteCompanions` renderiza internamente (sem wrapper novo, mesmo padrão que `CreateTrip` já usa sozinho).

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Tela de Destinos mostra Nome da viagem, depois as abas "Destino"/"Perfil da viagem" — sem nenhum link solto pra Convidar ou Quiz.
- O menu fixo mostra 6 itens (Destinos, Membros, Roteiro, Reservas, Documentos, Gastos), todos sempre acessíveis.
- Abrir "Membros" a qualquer momento (mesmo com roteiro já montado) funciona normalmente, sem back button e sem footer de "voltar".
- Nenhuma rota `/quiz` sobra no app; `QuizProfile.tsx` não é mais referenciado em lugar nenhum.
- Testar em 375px — 6 itens no menu fixo cabem sem cortar texto nem esconder ícone (ajustar `font-size`/padding do `BottomNav` se precisar).
- Testar nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`; componentes reaproveitados (`Tabs`, `BottomNav`, `OptionChipGroup`) em vez de duplicados.
