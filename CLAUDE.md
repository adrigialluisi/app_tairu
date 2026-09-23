# Tairu — Protótipo Mês 2 (contexto do projeto)

Leia este arquivo inteiro antes de escrever qualquer código. Ele é a fonte de verdade de como este protótipo deve ser construído.

## O que é este projeto

Protótipo clicável e **funcional de verdade** (não mockup estático) do fluxo redesenhado do Tairu — app de planejamento de viagem em grupo. Vai ser usado num teste de usabilidade com 10 pessoas (Mês 2 de um ciclo de validação de 3 meses). Não é o app de produção, mas os componentes precisam se comportar como se fossem: autocomplete de verdade, máscara de input de verdade, validação de verdade — não é só visual.

## Documentos de referência (pasta Tairu, um nível acima desta)

Leia estes antes de desenhar qualquer tela — eles têm a razão de cada decisão, ligada a entrevistas reais com usuários. Não improvise conteúdo que contradiga o que está neles.

- `../Site_Publicado/14-fluxo-proposto-mes2.html` — fluxo completo de 11 etapas / 13 telas do Mês 2, com "o que faz" e "por que" de cada etapa.
- `../Instrucoes/15-roteiro-teste-usabilidade-mes2.md` — cenário fixo de teste (viagem "Buenos Aires, Santiago e Deserto do Atacama", 20-25/nov/2026, grupo de 3, moedas ARS/CLP; Atacama adicionado em 14/set/2026 pra misturar cidade com natureza — ver `docs/ajustes-30-...md`) e as 13 tarefas que os usuários vão seguir durante o teste **(atenção: essa lista de tarefas ainda reflete a numeração de telas antiga do fluxo original, não a navegação por menu fixo atual — revisão pendente, não bloqueante, ver `tairu_plano_prototipo_mes2.md`)**.
- `../Site_Publicado/01-analise-usabilidade.html` — diagnóstico de usabilidade do app atual (a base de tudo que este protótipo corrige).
- `../Site_Publicado/Prints telas/` — prints de tela do app atual (referência de identidade visual).

## Regra mais importante: nada pré-preenchido

As telas do protótipo começam **vazias**, como em produção. O cenário fixo do roteiro de teste é uma instrução que o *moderador* dá ao *usuário* durante o teste ("crie uma viagem chamada X, com destinos Y e Z") — o usuário digita tudo sozinho. Nunca pré-carregar dados de exemplo dentro da própria tela do app. (Uma tentativa anterior, feita fora deste projeto, errou nisso — não repetir.)

## Stack

- React + Vite + TypeScript.
- Sem biblioteca de UI pronta (Material UI, Ionic, shadcn etc.) — os componentes (input, chip, calendário, app bar, bottom nav) são construídos aqui, porque precisamos de duas cascas visuais (iOS/Android) que nenhuma lib pronta cobre bem ao mesmo tempo sem luta.
- CSS: variáveis CSS (design tokens) + CSS Modules (ou styled-components, à sua escolha) — nada de Tailwind aqui, queremos controle fino por componente.
- Sem backend. Estado do app em memória (React state/Context). Nada precisa persistir entre sessões — cada participante do teste começa do zero.
- Roteamento entre telas: React Router (ou state machine simples) — como for mais simples de manter conforme o número de telas cresce (este é só o primeiro bloco de 13 telas ao todo).

## Protótipo único, com alternância iOS/Android

Uma aplicação só. Um seletor de plataforma (iOS/Android), visível durante o teste, troca a "casca" de navegação sem duplicar telas — conteúdo e lógica são os mesmos, só a apresentação muda:

- Barra de navegação: iOS com "‹" e título centralizado; Android com "←" e título alinhado à esquerda.
- Navegação inferior (quando existir): iOS estilo tab bar (ícone + texto); Android Material Bottom Navigation.
- Botão de ação principal: iOS como "+" na barra superior; Android como FAB.
- Modais/bottom sheets: iOS com cantos superiores bem arredondados e "puxador"; Android Material Bottom Sheet, cantos mais discretos.
- Abas: iOS segmented control (pílula); Android Material Tabs (sublinhado).
- Cantos de botões/inputs: mais arredondados no iOS, mais discretos no Android.
- Tipografia: iOS usa a stack do sistema (`-apple-system, "SF Pro Text", ...`); Android usa Roboto (Google Fonts).
- Alvo de toque mínimo 44×44px nos dois.

## Navegação — menu fixo, sem fluxo único (atualizado em 10/set/2026)

**Decisão que substitui o modelo de wizard usado até aqui.** As primeiras telas (Criar viagem → Convidar → Quiz → Lugares → Roteiro) foram construídas como um fluxo linear, cada uma com "Continuar" travado até a anterior estar completa. A Adriana pediu pra mudar isso: a viagem real não é preenchida de uma vez em sequência — a pessoa quer poder voltar, complementar, adicionar um destino no meio do planejamento, sem re-percorrer nada. Ver `docs/ajustes-13-navegacao-menu-fixo.md` pra especificação técnica completa da migração.

- **Sem pré-requisito nenhum pro menu aparecer.** O menu fixo (bottom nav) aparece assim que a pessoa entra na Início e escolhe uma viagem (nova ou já existente) — não depende de a viagem já ter nome, destino ou qualquer outro dado preenchido (atualizado em 11/set/2026, ver `docs/ajustes-21-menu-sempre-visivel.md`, que substitui as duas tentativas anteriores de condicionar isso ao nome — `docs/ajustes-16-menu-aparece-so-ao-confirmar-nome.md` e `docs/ajustes-20-corrigir-regressao-menu.md`, ambas com implementação correta na época, mas em cima de uma premissa que deixou de valer). Fora isso, nenhuma seção trava a outra.
- **Menu fixo embaixo (bottom nav), sempre visível dentro de uma viagem**, com **5 itens, nessa ordem** (atualizado em 14/set/2026, ver `docs/ajustes-26-central-inicio-documentos-splash.md`): **Destinos, Central, Convidados, Roteiro, Custos**. Antes eram 6 itens (Destinos, Membros, Roteiro, Reservas, Documentos, Gastos) — "Membros" virou "Convidados", "Reservas" virou "Central" (rota `/central`, com abas internas Transporte/Estadia/Outros), "Gastos" virou "Custos" (rota `/custos`), e "Documentos" saiu do menu fixo — ver bullet de Documentos mais abaixo. Cada item é uma seção independente, sempre acessível, nunca bloqueada — se faltar um pré-requisito (ex.: abrir Roteiro sem nenhum destino com data ainda), a seção mostra orientação + atalho pra resolver, nunca um estado travado/cinza (mesmo princípio já usado no estado vazio de Lugares/Roteiro).
- **Tela Início (`/inicio`), antes de entrar numa viagem** (novo em 14/set/2026, mesmo doc acima): mostra a viagem atual (se já tiver nome ou destino preenchido) com opção de continuar, um botão "Nova viagem" (reseta o estado da viagem via `trip.resetTrip()`) e o acesso a Documentos. Splash → "Continuar" leva pra Início, não mais direto pra Destinos. Versão propositalmente simples por agora — sem lista de "viagens passadas" de verdade (o protótipo ainda guarda só 1 viagem em memória por sessão).
- **Documentos (passaporte, visto, vacina etc.) não é mais item do menu fixo da viagem** — é informação da pessoa, não da viagem específica, então virou algo de nível usuário, acessível só pela Início (`docs/ajustes-26-central-inicio-documentos-splash.md`). A rota `/documentos` continua existindo, mas sem `bottomNav` — usa `onBack` pra voltar pra Início.
- **Membros (convidar companheiros, hoje rotulado "Convidados" no menu) é item do menu, não link secundário** (atualizado em 10/set/2026, ver `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`) — convidar gente é uma ação que faz sentido a qualquer momento da viagem, igual Destinos/Roteiro, não uma etapa de configuração inicial.
- **Adicionar um destino novo a qualquer momento (seção Destinos) reflete automaticamente no Roteiro** — novo intervalo de dias pra esse destino, sem nenhuma ação extra da pessoa. Isso já é como o cálculo de dias por destino funciona (lê direto de `trip.destinations`), só precisa continuar acessível fora de ordem.
- **Destino e Perfil da viagem, dentro da seção Destinos, viraram 2 steps sequenciais, não mais abas livres** (atualizado em 11/set/2026, ver `docs/ajustes-23-destinos-em-steps-com-resumo.md`, que substitui o alternador leve criado em `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md`) — cada passo tem um botão de salvar próprio, que troca o formulário por um resumo editável (botão "Editar" volta a abrir). **Esta é a única trava intencional dentro do app**: o Passo 2 (Perfil da viagem) só aparece depois que o Passo 1 (Destino) é salvo — decisão explícita da Adriana, escopo só desta tela, não afeta em nada a regra de o menu fixo (bottom nav) nunca travar.
- Selecionar lugares deixa de ser uma seção própria no menu — vira uma aba a mais dentro do Roteiro (Lugares / Roteiro / Dicas locais), já que as três coisas giram em torno do mesmo destino.
- O roteiro de teste de usabilidade (`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md`) foi escrito pro modelo linear antigo — pode (e deve) ser revisado depois pra bater com a navegação nova; não é bloqueante pra essa migração.

## Progresso e confirmação de salvamento — regra geral pra toda tela (novo em 11/set/2026)

Como o menu fixo não trava nada (ver "Navegação" acima) e não existe botão "Salvar" — tudo grava no estado assim que a pessoa preenche —, faltava um jeito de ela perceber o que já preencheu, confirmar que ficou salvo, e ser guiada pro próximo passo natural, sem reintroduzir nenhuma trava. Spec completa: `docs/ajustes-22-trilha-progresso-e-salvo.md`.

- **Selos de progresso nos ícones do menu fixo** (`BottomNav.tsx`): ✓ quando a seção está "completa" por um critério objetivo (Destinos: pelo menos 1 destino com datas preenchidas; Roteiro: pelo menos 1 lugar escolhido), número quando é uma contagem sem meta (Membros: quantidade de convites enviados). Critérios centralizados em `src/utils/tripProgress.ts`, reaproveitados também pelos cards de sugestão abaixo.
- **Toast "Salvo ✓"** (`SaveToast.tsx` + `src/hooks/useSaveToast.ts`, primeiro hook próprio do projeto), disparado só em ações de **adicionar** (nunca ao remover): adicionar destino, completar as duas datas de um destino, escolher ou adicionar um lugar no Roteiro, adicionar um convite em Membros. É só reforço visual — o dado já estava salvo no `TripContext` antes do toast aparecer.
- **Cards de sugestão de próximo passo** (`SuggestionCard.tsx`), sempre dispensáveis (botão "×", nunca bloqueiam navegação), seguindo a mesma ordem do menu fixo (Destinos → Central → Convidados → Roteiro → Custos): em Destinos, depois de salvar o Perfil da viagem, sugere ir pra Central (atualizado em 14/set/2026, ver `docs/ajustes-26-central-inicio-documentos-splash.md` — antes sugeria Convidados, que era o item seguinte na ordem anterior do menu, ver `docs/ajustes-25-trilha-segue-menu-e-aviso-de-datas.md`); em Roteiro, sugere convidar companheiros (segundo lembrete, independente da posição de Convidados na ordem do menu) quando já tem lugar escolhido e nenhum convite foi enviado ainda.
- **O Roteiro dia a dia só existe pra destinos com as duas datas preenchidas** — um destino sem data não trava o salvamento (é permitido salvar Destinos sem data, ver `docs/ajustes-23-destinos-em-steps-com-resumo.md`), mas fica de fora do dia a dia até a data ser completada. O resumo do Passo 1 (Destino) avisa quando isso acontece.
- Essas três coisas são só feedback — não mudam em nada o que já estava documentado em "Navegação" (nenhuma seção passa a travar a outra por causa disso).

## Identidade visual — reaproveitar, mas corrigir contraste e acessibilidade

Tokens de partida, extraídos dos prints do app atual (fundo em gradiente pêssego→verde-azulado, vermelho/bordô como destaque, cards em creme):

```
--bg-top:      #F3DAB8
--bg-mid:      #DECCA9
--bg-low:      #A6BAB3
--bg-bottom:   #4C6A70
--accent:      #B23345
--accent-dark: #7E2331
--card:        #FBF6EA
--card-border: #E4D6B6
--text:        #2B2A2E
--muted:       #726C5E
```

**Estes valores são só ponto de partida — não estão validados.** A Adriana relatou explicitamente que o app atual tem "cor de fonte sem contraste e coisas difíceis de ler". Antes de finalizar qualquer tela:

1. Calcule a razão de contraste (fórmula WCAG) de **todo par texto/fundo realmente usado** na tela — não assuma que os tokens acima já passam.
2. Ajuste qualquer combinação abaixo de **4.5:1** pra texto normal e **3:1** pra texto grande (≥18px ou ≥14px bold), ícones funcionais e bordas de campo.
3. Preste atenção especial a: texto secundário/muted sobre o fundo em gradiente (fora dos cards), placeholder de input, texto sobre o próprio vermelho de destaque, e qualquer texto claro sobre a parte clara do gradiente (`--bg-top`).
4. Foco de teclado visível em todo elemento interativo (outline ou equivalente, nunca `outline: none` sem substituto).
5. Nunca usar só cor pra indicar estado (erro, sucesso) — sempre acompanhar de ícone e/ou texto.

## Espaçamento e organização visual — regra geral pra toda tela

Print da tela de Quiz mostrou espaçamento inconsistente entre pergunta, opções e o grupo de perguntas seguinte — em alguns pontos parece espremido, em outros solto, sem uma hierarquia clara. **Esta regra vale pra toda tela, já construída ou futura — não é um ajuste pontual da tela do Quiz.**

- Escala de espaçamento em grade de 8px como tokens CSS: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`. Nunca usar valor solto (ex.: 13px, 22px) fora dessa escala.
- Hierarquia por espaçamento: o espaço **entre um grupo e o próximo** (ex.: do fim das opções de "Ritmo do dia a dia" até o título de "Orçamento aproximado") tem que ser visivelmente maior que o espaço **dentro de um grupo** (ex.: entre o título de uma pergunta e suas opções, ou entre duas opções lado a lado). Se os dois parecerem do mesmo tamanho, está errado.
- Alinhamento consistente: todo elemento do mesmo tipo (pills, inputs, títulos de seção, botões) alinhado na mesma margem esquerda/direita da tela, sem variação.
- Antes de considerar qualquer tela pronta, comparar visualmente o espaçamento pergunta→opções vs. grupo→grupo — essa checagem entra também na seção "Antes de considerar uma tela pronta" abaixo.
- Esta regra é retroativa: revisar Criar viagem, Convidar companheiros e Quiz de perfil (já construídas) além de aplicar em toda tela nova.

## Reaproveitar componentes existentes — regra geral pra toda tela

Pedido explícito da Adriana (10/set/2026, vendo a Tela 4b): melhorar a usabilidade no geral e sempre usar bem o que já existe no projeto em vez de construir do zero a cada tela nova. **Vale pra toda tela, já construída ou futura — mesmo espírito da regra de espaçamento acima.**

- Antes de criar um componente novo, olhar em `src/components/shell`, `src/components/inputs`, `src/components/places`, `src/components/itinerary`, `src/components/quiz` — se o que a tela precisa é uma variação de algo que já existe (um `Tabs` com ícone em vez de texto, um `Button`, um `PlaceRow`), estender o componente existente com uma prop nova em vez de duplicar a lógica num arquivo novo. Exemplo já aplicado: o alternador Lista/Mapa da Tela 4b usa o mesmo `Tabs` de sempre, só com uma prop `iconOnly` nova — não virou um componente do zero.
- Antes de considerar qualquer tela pronta, rodar `npm run lint` (checagem de tipos) e `npm run build` — os dois têm que passar sem erro. Isso já era pedido pontualmente em alguns ajustes; agora é regra fixa pra toda entrega, nova ou revisão de tela existente.
- Isso entra também na checklist "Antes de considerar uma tela pronta" abaixo.


**Botões, sempre pelo componente `Button` (15/set/2026)**: nenhuma tela ou ajuste futuro deve criar um botão "customizado" à parte — toda ação que parece botão usa `src/components/shell/Button.tsx` (`variant="primary"`/`"secondary"`), nunca um `<button>`/`<Link>` estilizado do zero. Reforço explícito depois da Adriana pedir "manter sempre o mesmo padrão de botões" — ver `docs/ajustes-38-fase3-fundo-mais-branco.md`.
## Dados reais, sem IA generativa

Princípio já validado pro produto real (dicas locais e sugestão de lugares usam fontes reais, nunca texto gerado por IA) — vale também pro protótipo: a base de cidades/países/moedas usada no autocomplete tem que ser uma base de dados real (ex.: um dataset aberto tipo GeoNames, ou a lista de países/moedas ISO 4217), embutida localmente no projeto como JSON — sem chamada de API externa (o protótipo precisa funcionar offline durante as sessões de teste, sem depender de rede). Nunca inventar nomes de cidade ou moeda.

**Exceção deliberada (10/set/2026): o mapa da Tela 4b usa tiles do OpenStreetMap via Leaflet, que precisam de internet.** É a única parte do protótipo que depende de rede — decisão consciente da Adriana, porque um mapa geográfico real tem mais valor de teste do que a garantia de funcionar 100% offline; sessões de teste moderadas normalmente têm wi-fi. As coordenadas dos lugares em `src/data/places.json` (`lat`/`lng`) são reais, de landmarks públicos conhecidos, com precisão de bairro/quarteirão — não são geradas nem inventadas.

**Exceção pontual e sinalizada (14/set/2026): o carrossel "Viagens passadas" da tela Início mostra 1-2 viagens de EXEMPLO fixas no código (`EXAMPLE_PAST_TRIPS` em `Home.tsx`), não dado real.** O protótipo não tem histórico real de viagens (tudo em memória, decisão do `ajustes-26`) — os cards são só ilustração de layout, sempre com o selo "Exemplo" visível e não clicáveis, pra nunca serem confundidos com dado real durante um teste de usabilidade. Ver `docs/ajustes-28-tela-inicio-redesign.md`.


**Pergunta "Relax ou urbano?" do Quiz substituída (15/set/2026) por "Turístico ou fora do circuito?"** (`docs/ajustes-37-quiz-turistico-x-fora-circuito.md`) — o eixo antigo era redundante com Interesses (categoria) e Ritmo (intensidade do dia); o novo campo `popularity` (`turistico`/`fora-do-circuito`) foi curado nos 53 lugares em `docs/dados/places.json`, critério de quão em destaque o lugar aparece nos principais guias de viagem, não opinião solta.
## Fotos reais dos lugares no Roteiro (novo em 11/set/2026, estendido em 14/set/2026)

Segunda exceção deliberada à regra de funcionar offline, no mesmo espírito da do mapa (ver "Dados reais, sem IA generativa" acima): a lista de Lugares no Roteiro busca ao vivo, na Wikipedia/Wikimedia (pt primeiro, es como segunda tentativa), uma foto real de cada ponto turístico — nunca uma imagem gerada por IA. Quando não encontra (comum em restaurantes/lugares menores), mostra um quadradinho com a inicial do nome, nunca uma foto errada só pra preencher espaço. Spec completa: `docs/ajustes-24-fotos-reais-dos-lugares.md`. Se algum lugar específico mostrar a foto de um homônimo errado, corrige preenchendo o campo opcional `wikiTitle` desse lugar em `places.json` com o título exato do artigo certo — não precisa mexer em mais nada. Desde 14/set/2026 (`docs/ajustes-27-timeline-roteiro-lista.md`), o mesmo hook (`usePlaceThumbnail`) também alimenta a timeline da aba Roteiro → Lista — só pra lugares reais (com `placeId`), nunca pra itens de texto livre. Também desde 14/set/2026 (`docs/ajustes-30-hero-card-atacama-documentos.md`), alimenta o card de destaque da tela Início, buscando pelo nome da cidade do primeiro destino da viagem (não um ponto turístico específico).

**Terceiro destino do cenário fixo, San Pedro de Atacama (14/set/2026):** curadoria real de 10 lugares (`docs/ajustes-30-...md`) — a cidade real é "San Pedro de Atacama" (povoado, entra no autocomplete de Destinos), não "Deserto do Atacama" como texto livre. Ver `../Instrucoes/15-roteiro-teste-usabilidade-mes2.md` pro cenário fixo atualizado (3 destinos).

## Referências visuais do Figma — estrutura sim, tokens não (novo em 14/set/2026)

A Adriana tem templates no Figma (MCP conectado) que às vezes compartilha como referência de organização de tela/componentes — ex.: `docs/ajustes-27-timeline-roteiro-lista.md` usou uma tela de roteiro de lá como referência de como estruturar uma timeline. Regra permanente, dita por ela explicitamente: usar essas telas só como referência de **estrutura** (layout, hierarquia de componentes, padrão de interação) — nunca importar as cores, tipografia ou outros tokens visuais de lá, porque a identidade visual do Tairu (tokens definidos na seção "Identidade visual" acima) já está definida e é intencionalmente diferente. Qualquer ajuste que cite uma referência do Figma deve deixar explícito, na própria spec, o que foi adotado (estrutura) e o que foi deixado de fora ou adaptado (cores, tipografia, dados fictícios como horários — o Tairu só mostra dado real, nunca inventado, mesmo que a referência mostre algo assim).


**Segunda fonte de referência visual (15/set/2026), mesmo princípio**: prints soltos (não-Figma) de apps de viagem, salvos em `docs/referencias/`, guiando um remodelamento dos tokens de base e, nas fases seguintes, dos componentes (cards, timeline, abas, menu) — mesma regra, estrutura/espaçamento/formato sim, cores não (as cores do Tairu, já validadas em WCAG AA, não mudam). Ver `docs/ajustes-34-tokens-estilo-referencia.md` e o roadmap de fases no fim dele.
## Assets

- `public/logo/LogoTairu.svg` — logo sem tagline (242×203), monocromática (`#110F0D`).
- `public/logo/LogoTairu_Tagline.svg` — logo com tagline (243×246), mesma cor.
- Ficam em `public/` (não em `src/assets/`) de propósito: são servidas por URL direta e podem ser substituídas trocando o arquivo, sem mexer em código nem recompilar import. Se a Adriana mandar uma versão nova, é só sobrescrever o arquivo nesse caminho.
- Os dois são escuros/monocromáticos — só ficam legíveis sobre fundo claro. Ver instruções específicas de uso em `docs/tela-00-splash.md`.

## Telas/seções deste primeiro bloco (atualizado em 14/set/2026 — ver "Navegação" acima)

0. Splash — fundo branco, logo centralizada, grafismo leve de fundo (atualizado em 14/set/2026, ver `docs/ajustes-26-central-inicio-documentos-splash.md`; antes era um gradiente pêssego→verde-azulado)
0.5. Início (`/inicio`) — layout próprio, sem `ScreenShell`/`AppBar` padrão (mesmo espírito da Splash, sem o grafismo de pontinhos dela): cabeçalho com logo + ícone de perfil ainda desabilitado (sem captura de nome), saudação genérica. Card de destaque grande ("hero card", `TripHeroCard`) quando existe viagem em andamento — foto real do primeiro destino (via `usePlaceThumbnail`, mesmo hook do `ajustes-24`), nome da viagem, destinos+datas e número de convidados (`src/utils/tripSummary.ts`), clicável no card inteiro. Carrossel de "Viagens passadas" com 1-2 cards de EXEMPLO fixos (nomes de ocasião, não nome de cidade; destinos fora do cenário de teste) no mesmo formato de conteúdo — sempre marcados com o selo "Exemplo", nunca clicáveis (não é dado real nem persistência — ver "Dados reais, sem IA generativa" abaixo). "Meus documentos" é uma linha própria (ícone + rótulo + `›`), não um botão. Só um `<Button>` na tela: "Nova viagem". Criada no `docs/ajustes-26-...md`, redesenhada no `docs/ajustes-28-...md`, refinada no `docs/ajustes-29-...md`, card de destaque com foto real no `docs/ajustes-30-hero-card-atacama-documentos.md`, visual final (raio/sombra/tipografia dos tokens novos, viagens passadas também com foto real) no `docs/ajustes-35-fase2-cards-com-foto.md` (fase 2 do `ajustes-34`). O switcher iOS/Android (`PlatformSwitcher`) é fixo no canto superior direito por padrão (Splash e as telas com `AppBar`), mas na Início ele entra no fluxo normal do `<header>` dela, lado a lado com a logo e o ícone de perfil (`<PlatformSwitcher inline />`, prop adicionada pro componente aceitar as duas formas) — histórico: colisão do ícone de perfil com o switcher fixo corrigida com um `padding-top` temporário em `docs/ajustes-31-...md`; visual do switcher virou um botão sem círculo (só ícone + setinha, mesmo chevron do `CurrencySelect`) em `docs/ajustes-32-...md` e `docs/ajustes-33-switcher-inline-no-header.md`; o `padding-top` do `ajustes-31` foi revertido no `ajustes-33`, já que o switcher inline não precisa mais dele.
1. Destinos e datas — 2 steps sequenciais, "Destino" e "Perfil da viagem" (era "Criar viagem"; abas viraram steps em 11/set/2026, ver `docs/ajustes-23-destinos-em-steps-com-resumo.md`, que substitui o alternador leve do `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md`, que por sua vez substitui `docs/ajustes-14-interesses-por-destino.md`)
2. Central (rota `/central`, menu "Central") — 3 abas: Transporte, Estadia, Outros; ainda placeholder "em construção" em cada aba (era "Reservas", renomeada e estruturada em 14/set/2026, ver `docs/ajustes-26-...md`)
3. Convidados (rota `/convidar`, menu "Convidados") — convidar companheiros de viagem (item próprio do menu fixo desde 10/set/2026, ver `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`; rotulado "Membros" até 14/set/2026)
4. Roteiro — 3 abas: Lugares (era Tela 4a), Roteiro dia a dia, Dicas locais (era Tela 4b). A aba "Roteiro dia a dia" (visualização Lista) usa uma timeline vertical (linha + bolinha por parada, foto e descrição quando é lugar real) desde 14/set/2026, inspirada numa referência do Figma — ver `docs/ajustes-27-timeline-roteiro-lista.md`. Mapa e Lista ganharam também um seletor de dia em formato "pill" (mês + número), reaproveitando o componente `Tabs` com uma variante nova.
5. Custos (rota `/custos`, menu "Custos") — ainda não especificada, placeholder "em construção" (era "Gastos", renomeada em 14/set/2026)
6. Documentos (rota `/documentos`) — fora do menu fixo desde 14/set/2026, acessível só pela Início; ainda não especificada, placeholder "em construção"

Ver `docs/tela-00-splash.md`, `docs/tela-01-criar-viagem.md`, `docs/tela-02-convidar-companheiros.md`, `docs/tela-03-quiz-perfil.md` e `docs/tela-04b-roteiro-e-dicas.md` (que agora também cobre o conteúdo antigo de `tela-04a`) pra especificação detalhada — mais `docs/ajustes-13-navegacao-menu-fixo.md` e `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md` pras mudanças estruturais mais recentes (o `ajustes-17` substitui o `ajustes-14`, que fica só como registro histórico). As telas de Lugares/Roteiro/Dicas também dependem dos datasets reais em `docs/dados/places.json` e `docs/dados/local-tips.json` (copiar pra `src/data/`, ver instruções em cada spec).

## Antes de considerar uma tela pronta

- Rodou o teste de contraste em todo par texto/fundo usado (ver seção acima)?
- Testou em largura mobile real (375px e 390px), não só desktop redimensionado?
- Testou as duas variantes (iOS/Android) — o layout não quebra ao trocar?
- Os campos funcionam de verdade (autocomplete filtra, máscara de data funciona, validação impede avançar com dado inválido)?
- Não tem nenhum dado de exemplo pré-preenchido na tela?
- O espaçamento segue a escala de 8px, com grupo→grupo visivelmente maior que pergunta/campo→opções (ver seção "Espaçamento e organização visual")?
- Reaproveitou componentes existentes em vez de duplicar (ver "Reaproveitar componentes existentes")? `npm run lint` e `npm run build` rodaram sem erro?
- Ações de adicionar (destino, data, lugar, convite) disparam o toast "Salvo" e atualizam os selos do menu fixo corretamente (ver "Progresso e confirmação de salvamento")?
