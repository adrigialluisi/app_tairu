# Ajuste 13 — Navegação: menu fixo em vez de fluxo único

Decisão da Adriana (10/set/2026): trocar o modelo de wizard (Criar viagem → Convidar → Quiz → Lugares → Roteiro, cada um travando o próximo) por um menu fixo embaixo, com seções sempre acessíveis e complementáveis a qualquer momento — sem perder a possibilidade de rodar o roteiro de teste de usabilidade na mesma ordem de hoje, só que sem travas artificiais entre as etapas.

## Regra geral

- **Único pré-requisito real: a viagem ter um nome.** Enquanto `trip.name` estiver vazio, a pessoa está na Tela 0/1 (Splash → preencher nome + já pode ir adicionando destinos). A partir do momento que `trip.name.trim().length > 0`, o menu fixo aparece e todas as seções ficam acessíveis, completas ou não.
- **Nenhuma seção trava a outra.** Se faltar pré-requisito de dado pra alguma seção fazer sentido (ex.: abrir Roteiro sem nenhum destino com datas ainda), a seção mostra orientação com atalho pra resolver — nunca um item de menu desabilitado/cinza. Mesmo princípio já usado no estado vazio de Lugares/Roteiro (`docs/ajustes-08-estado-vazio-lugares-roteiro.md`), agora generalizado pro app inteiro.
- **Adicionar destino a qualquer momento reflete automaticamente no Roteiro** — isso já é como `splitDaysByDestination` funciona (lê direto de `trip.destinations` toda vez), não precisa de nenhuma sincronização extra, só continuar acessível fora de ordem.

## 1. Menu fixo (`BottomNav`) — 5 itens

Novo componente `src/components/shell/BottomNav.tsx` + `BottomNav.module.css`, com 5 itens, ícone + texto (diferente do alternador Lista/Mapa da Tela de Roteiro, que é ícone-only — aqui o padrão é o mesmo já documentado no `CLAUDE.md` pra navegação inferior: iOS tab bar ícone+texto, Android Material Bottom Navigation ícone+texto):

| Rota | Label | Ícone sugerido |
|---|---|---|
| `/destinos` | Destinos | 📍 |
| `/roteiro` | Roteiro | 🧭 |
| `/reservas` | Reservas | 🎫 |
| `/documentos` | Documentos | 📄 |
| `/gastos` | Gastos | 💰 |

- Item ativo determinado por `useLocation().pathname` batendo com a rota do item (`NavLink`-like, sem precisar de lib nova — comparação simples de string já resolve, são rotas exatas).
- Cada botão precisa de alvo de toque ≥44×44px (mesma regra do resto do app) e `aria-current="page"` no item ativo.
- Renderizado em `App.tsx`, como um novo prop `bottomNav` do `ScreenShell` (ver seção 2 abaixo) — **não** um elemento solto fixo por cima de tudo; reaproveita o mesmo padrão de layout em coluna que `ScreenShell` já usa pro `footer`, só que abaixo do `.sheet` inteiro, não dentro dele. Isso evita ter que gerenciar `position: fixed` e sobreposição com o footer de cada tela.
- Só renderiza quando `trip.name.trim().length > 0` — cada uma das 5 telas de seção decide isso lendo `useTrip()` e passando ou não o prop `bottomNav` pro `ScreenShell`.

## 2. `ScreenShell` — novo slot `bottomNav`

```tsx
interface ScreenShellProps {
  appBar?: ReactNode;
  bottomNav?: ReactNode; // novo
  footer?: ReactNode;
  children: ReactNode;
}
```

Estrutura: `.screen` continua `display:flex; flex-direction:column`, mas agora com até 3 filhos diretos: `appBar`, `.sheet` (inalterado, contém `content` + `footer`), e `bottomNav` (novo, depois do `.sheet`, com o mesmo tratamento de `padding-bottom: env(safe-area-inset-bottom)` que o `.footer` já usa). Como `.sheet` já é `flex:1; min-height:0`, adicionar o `bottomNav` como mais um filho não quebra o scroll interno do conteúdo — ele só ocupa espaço fixo na base da tela, exatamente como o `.footer` já ocupa hoje.

## 3. Rotas — `App.tsx`

- `/criar-viagem` → renomear pra `/destinos` (o componente `CreateTrip.tsx` continua sendo a mesma tela — é a mesma lógica de nome+destinos+datas+moeda que já existe, só muda de rota/AppBar/footer, ver seção 4). Atualizar `Splash.tsx` pra navegar pra `/destinos`.
- `/lugares` **removida** — o conteúdo de `SelectPlaces.tsx` vira uma aba dentro de `/roteiro` (ver seção 5).
- `/reservas`, `/documentos`, `/gastos` — rotas novas, renderizando uma versão do `ComingSoon` (ver seção 6) com `bottomNav`, sem `onBack` (são seções de topo, não têm "anterior").
- `/convidar` e `/quiz` continuam existindo como rotas, mas viram **telas secundárias** (ver seção 4) — sem `bottomNav`, com `onBack` de volta pra `/destinos`.

```tsx
<Route path="/destinos" element={<CreateTrip />} />
<Route path="/convidar" element={<InviteCompanions />} />
<Route path="/quiz" element={<QuizProfile />} />
<Route path="/roteiro" element={<Itinerary />} />
<Route path="/reservas" element={<ComingSoon title="Reservas" />} />
<Route path="/documentos" element={<ComingSoon title="Documentos" />} />
<Route path="/gastos" element={<ComingSoon title="Gastos" />} />
```

## 4. Telas que mudam de "Continuar trava a próxima" pra "seção sempre editável"

**`CreateTrip.tsx` (agora tela de Destinos, rota `/destinos`):**
- AppBar: título "Destinos e datas" (era "Criar viagem"), sem `onBack` (é seção de topo do menu).
- Footer: remover o botão "Continuar" e toda a lógica de `canContinue`/`missing` — não há mais "próxima tela" fixa pra travar. O sinal de que a viagem já pode ser navegada é o próprio menu fixo aparecer assim que o nome for preenchido.
- Adicionar dois links/cards logo após o campo de nome (antes ou depois do campo de Destinos, o que ficar mais natural visualmente): "Convidar companheiros de viagem →" (`/convidar`) e "Perfil da viagem →" (`/quiz`) — acesso às duas telas secundárias que saem do fluxo obrigatório.

**`InviteCompanions.tsx` (Convidar, rota `/convidar`, secundária):**
- AppBar `onBack`: trocar de `/criar-viagem` pra `/destinos`.
- Footer: os botões que hoje navegam pra `/quiz` (tanto o de convidar quanto o de pular) passam a navegar pra `/destinos` — não força mais ida ao Quiz. Texto pode virar algo como "Salvar e voltar" em vez de forçar a leitura de "pular" como se fosse perder algo.

**`QuizProfile.tsx` (Perfil da viagem, rota `/quiz`, secundária):**
- AppBar `onBack`: trocar de `/convidar` pra `/destinos`.
- Footer: remover a trava `disabled={!canContinue}` — o botão vira "Salvar e voltar" sempre habilitado, navegando pra `/destinos`. Responder o Quiz deixa de ser obrigatório pra usar o resto do app (já era hipótese de produto, não pré-requisito técnico).
- Ver também `docs/ajustes-14-interesses-por-destino.md` — 2 das 6 perguntas saem daqui (viram campos por destino), o Quiz fica com 4 perguntas.

**`Itinerary.tsx` (Roteiro, rota `/roteiro`):**
- AppBar: sem `onBack` (seção de topo do menu). Título continua "Roteiro da viagem".
- Footer: remover o botão "Continuar" que ia pra `/em-construcao` — não existe mais "próxima etapa fixa"; quem quiser ir pra Reservas usa o menu.
- Passa a receber `bottomNav`.
- Estado vazio (`dayRanges.length === 0`, hoje com botão "Ir pra Criar viagem"): trocar o destino do botão de `/lugares` (que deixa de existir) pra `/destinos`.
- Ganha a aba "Lugares" — ver seção 5.

## 5. Selecionar lugares vira aba dentro do Roteiro

Hoje `SelectPlaces.tsx` é uma tela própria na rota `/lugares`. Passa a ser a primeira aba de `Itinerary.tsx`, junto de "Roteiro" e "Dicas locais" (`MAIN_TABS_NAME`), nessa ordem: **Lugares → Roteiro → Dicas locais** (faz sentido escolher antes de ver organizado por dia).

- Mover o conteúdo de `SelectPlaces.tsx` (seletor de destino, lista de lugares rankeados, campo "adicionar por conta própria" já no topo — `docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md` — e lista de customizados) pra dentro de `Itinerary.tsx`, como conteúdo da aba `'lugares'`.
- O seletor de destino da aba Lugares pode reaproveitar o mesmo `activeDestinationId`/`Tabs` de seletor de cidade já usado nas abas Roteiro e Dicas locais, ou manter um estado próprio — o que for mais simples de manter sincronizado (ex.: ao marcar um lugar num destino na aba Lugares e trocar pra aba Roteiro, o destino ativo pode continuar o mesmo, evitando a pessoa ter que escolher a cidade de novo).
- `SelectPlaces.tsx` e sua rota deixam de ser usados — pode apagar o arquivo ou só parar de referenciá-lo no `App.tsx` (apagar é mais limpo, evita confusão futura).
- Toda a lógica de estado (`selectedPlaces`, `togglePlace`, `addCustomPlace`, `removeSelectedPlace`) continua igual no `TripContext` — só muda onde a UI vive.

## 6. `ComingSoon.tsx` — placeholders de Reservas/Documentos/Gastos

Estender pra aceitar props opcionais, mantendo o comportamento atual como default (ainda é usado, agora sem `onBack`, pelas 3 seções novas):

```tsx
interface ComingSoonProps {
  title?: string; // default: "Em construção"
  message?: string; // default: texto atual
  onBack?: () => void; // opcional agora — seções de topo do menu não passam
  bottomNav?: ReactNode;
}
```

Cada rota nova passa `title` específico ("Reservas", "Documentos", "Gastos") e `bottomNav`. Mensagem pode ser algo como "Essa seção ainda não foi desenhada nesse bloco do protótipo." — sem fingir conteúdo que não existe (mesmo princípio de "nada fingido" do `CLAUDE.md`).

## 7. Roteiro de teste de usabilidade

`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md` foi escrito assumindo o fluxo linear antigo ("toque em Continuar" etc.). A Adriana confirmou que pode ser revisado depois pra bater com a navegação nova — **não é bloqueante pra essa migração**, só fica registrado aqui como pendência separada.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Com o nome da viagem vazio, nenhum menu fixo aparece — só depois de preencher o nome.
- As 5 seções (Destinos, Roteiro, Reservas, Documentos, Gastos) estão sempre acessíveis pelo menu, em qualquer ordem, sem nenhuma travada.
- Adicionar um destino novo em Destinos, a qualquer momento (mesmo depois de já ter roteiro montado), aparece automaticamente no Roteiro com os dias corretos.
- Convidar companheiros e Perfil da viagem abrem a partir de links em Destinos, não travam mais nada depois de si.
- A aba "Lugares" dentro do Roteiro tem o mesmo comportamento que a antiga Tela 4a (seletor de destino, lista rankeada, adicionar por conta própria no topo).
- Reservas/Documentos/Gastos mostram a mensagem de placeholder, com o menu fixo continuando visível.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`; componentes reaproveitados (`Tabs`, `ScreenShell`, `ComingSoon`) em vez de duplicados.
