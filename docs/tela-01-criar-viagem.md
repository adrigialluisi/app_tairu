# Tela 1 — Criar viagem


> **Atualizado em 10/set/2026 (revisado de novo no mesmo dia):** esta tela vira a seção "Destinos e datas" do menu fixo — sempre editável, sem "Continuar" travando a próxima etapa — com uma aba "Perfil da viagem" (Quiz) ao lado da aba "Destino" (alternador leve, não mais o componente `Tabs` cheio). Os cards de cada destino mostram só moeda e datas — a personalização de Interesses/Já conhece foi tentada por destino e depois revertida pra geral (ver `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md`, que substitui `docs/ajustes-14-interesses-por-destino.md`). Ver também `docs/ajustes-13-navegacao-menu-fixo.md` e `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`.
Ver `../../Site_Publicado/14-fluxo-proposto-mes2.html`, etapa 1, pro racional completo (por que os campos aceitam múltiplos destinos/moedas desde o início — pedido literal de uma das usuárias testadas).

## Objetivo
Consolidar em **uma tela só** o que hoje é um wizard de 3 telas separadas (nome → datas → destino/moeda). Tela vazia — o participante do teste preenche tudo sozinho, seguindo o roteiro de teste que o moderador vai ler em voz alta (não é pra pré-carregar nada aqui).

## Campos

### Nome da viagem
- Input de texto simples, vazio, placeholder "Ex.: Réveillon em família".
- Obrigatório pra avançar.

### Datas — por destino, não mais um campo único pra viagem toda

**Mudança de 10/set/2026:** não existe mais um campo de "Datas" solto pra viagem inteira. Cada destino tem a sua própria data de início e fim — pedido direto da Adriana, porque uma viagem multi-destino de verdade precisa dizer quanto tempo fica em cada cidade, não só o intervalo total. O campo de datas por destino aparece junto dos outros campos por destino (moeda), na seção "Detalhes por destino", depois dos chips — ver seção "Destinos" abaixo.

Cada campo de data por destino funciona como antes:
1. **Toque no campo** abre um calendário de intervalo.
2. **Digitação direta**: formato `dd/mm/aaaa – dd/mm/aaaa`, com máscara aplicada durante a digitação, `inputmode="numeric"` no mobile.
3. Validação: rejeitar datas inválidas, rejeitar data final anterior à inicial — **mais uma validação nova, corrigida em 10/set/2026: datas de destinos diferentes não podem se sobrepor, mas podem se TOCAR.** Ou seja, a data de fim de um destino pode ser igual à data de início do próximo (ex.: sai de Buenos Aires e chega em Santiago no mesmo dia) — isso é permitido, representa o dia de viagem entre as duas cidades. O que não pode é um destino começar ANTES do destino anterior terminar (mais de 1 dia em comum). Regra prática: ordenando os destinos pela data de início, cada destino só pode começar em uma data igual ou posterior à data de fim do destino anterior. Mostrar erro claro (texto) só quando essa regra for violada de verdade — nunca no caso de datas apenas se tocando.
4. Os dois modos de entrada (calendário e digitação) ficam sincronizados.
5. **Não precisa ser contíguo, e pode se tocar**: dá pra deixar um intervalo sem nenhuma cidade entre o fim de um destino e o começo do outro (a Tela 4b mostra esses dias como "Dia livre") — ou fazer as datas se tocarem exatamente (fim de um = início do outro, dia de viagem sem folga). As duas formas são válidas; só não vale um destino começar antes do anterior de fato terminar.

A duração total da viagem (usada em outras telas, como o roteiro dia a dia) passa a ser **calculada automaticamente**: do início do destino que começa primeiro até o fim do destino que termina por último. Não é mais um campo digitado à parte.

### Destinos
- Campo de **autocomplete real**: ao digitar 2+ letras, filtra e mostra sugestões no formato "Cidade, País", vindas de uma base de dados real embutida no projeto (ver seção "Dados reais" do `CLAUDE.md`) — nunca inventar cidade.
- Cada destino escolhido na lista de sugestões vira um **chip removível** (com "×").
- Permite adicionar quantos destinos a pessoa quiser (botão "+ Adicionar destino", ou o próprio campo reabre depois de cada seleção).
- Pelo menos 1 destino obrigatório pra avançar.
- **Ordem fixa: campo de busca sempre primeiro, chips dos destinos já adicionados abaixo dele.** O campo não pode se mover conforme a lista de chips cresce — é o ponto que a pessoa mais volta a usar (pra adicionar o próximo destino), então tem que ficar numa posição estável, não empurrado pra baixo pelos chips acumulados.
- **Foco visual: um anel só, sem duplicar.** O wrapper do campo (`.inputWrap`) desenha o anel de foco; o `<input>` interno precisa suprimir seu próprio `outline` nativo (`:focus-visible { outline: none; }`), senão aparecem dois contornos desalinhados ao mesmo tempo. Mesma regra vale pro campo de datas e pro seletor de moeda.

### Detalhes por destino: moeda e datas
Depois da lista de chips, uma seção "Detalhes por destino" mostra, pra cada destino já adicionado, dois campos lado a lado (ou empilhados no mobile, conforme espaço):

- **Moeda**: sugerida automaticamente ao escolher o destino (mapeamento país → moeda ISO 4217), editável — campo de seleção de moeda por destino, caso a pessoa prefira outra referência (ex.: dólar em vez da moeda local).
- **Datas**: início e fim da estadia *nesse* destino específico (ver seção "Datas" acima) — obrigatório pra avançar, cada destino precisa das suas próprias datas.

Sem campo solto e desconectado do destino — moeda e datas são sempre atreladas a um destino específico, igual já valia só pra moeda antes dessa mudança.

## Botão de avançar
- "Continuar" fica desabilitado até: nome preenchido + pelo menos 1 destino + **todo destino com moeda definida E datas válidas preenchidas** + nenhum destino começando antes do anterior terminar (datas podem se tocar, só não podem se sobrepor de verdade).
- Ao tocar, leva pra Tela 2 (Convidar companheiros).

## Acessibilidade nesta tela especificamente
- Label visível em todo campo (não só placeholder — placeholder some ao digitar e quem usa leitor de tela perde a referência).
- Mensagens de erro de validação anunciadas de forma acessível (`aria-live` ou equivalente), não só cor vermelha.
- Chips removíveis precisam ser operáveis por teclado, não só toque/clique.
