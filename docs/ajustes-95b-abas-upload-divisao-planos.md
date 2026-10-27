# Ajuste 95b — Abas de cidade, upload único, divisão por número de pessoas e planos do grupo provisórios

Origem: pedido da Adriana em 27/out/2026, depois do ajuste 95. Commit: `ajuste 95b: abas de cidade, upload único, divisão por número de pessoas e planos do grupo provisórios`.

---

## A. Abas de cidade que cabem no celular

**Problema:** no Roteiro, `Todas · Buenos Aires · Santiago · San Pedro de Atacama` saía da tela.

**Feito:**
- `Tabs` ganhou a prop `scrollable`: faixa com rolagem horizontal sem barra (`no-scrollbar`), cada aba do tamanho do texto. Vale pras abas de cidade de Sugestões, Roteiro e Dicas (`DestinationTabs` sempre passa `scrollable`).
- Faixa rolável (abas `scrollable` e pílulas de data): **degradê** na borda direita na cor do miolo (`--page`) enquanto houver aba escondida, e a **aba ativa rola sozinha** pra ficar visível ao abrir e ao trocar. A rolagem mexe só no `scrollLeft` da faixa, nunca na rolagem vertical da tela.
- **Rótulo curto** acima de 14 caracteres (`shortCityLabel`): corta antes do primeiro "de/del/do/da" ("San Pedro de Atacama" → "San Pedro"); sem conector, as 2 primeiras palavras. Nome completo no `aria-label` da aba e nos cabeçalhos dos dias.
- Linha das pílulas + Lista/Mapa: a faixa das pílulas fica num contêiner `min-w-0`, encolhe e rola; o Lista/Mapa fica fixo na ponta. Nada sai da tela em 360px.
- No Android a faixa rolável ganha `pb-px`, pra o sublinhado de 2px da aba ativa não ser cortado pelo `overflow`.

## B. Lançar gasto com um upload só

**Problema:** o `ExpenseForm` tinha 2 botões de anexar: "Enviar foto da nota" em cima (lê e preenche) e o `AttachmentList` de comprovante embaixo.

**Feito:** saiu o `AttachmentList`. O bloco de cima é o comprovante: o arquivo aparece como anexado nele, enviar outro substitui e "Excluir nota" tira. Mesma lógica do ajuste 93 em Central → Outros (só revoga a URL de arquivo enviado neste formulário). O `CentralCostForm` não tem anexo — nada a mudar.

## C. Divisão do gasto por número de pessoas

**Feito (`PaidSplitFields` + `settlement.ts`):**
1. "Outro" em "Quem pagou?" → o nome digitado vira chip no "Dividir com", **desmarcado**. Trocar o nome troca o chip (continua marcado se estava); voltar pra um membro tira o chip.
2. Campo **"Dividido entre quantas pessoas?"** abaixo dos chips (`TextField`, `inputMode="numeric"`). Começa igual aos marcados e acompanha os chips enquanto não for editado; marcar um chip a mais que o número sobe o número junto. Menor que os marcados (ou vazio) → erro "Tem N pessoas marcadas: o número não pode ser menor." e o formulário não salva.
3. "Cada um: R$ X" = total ÷ esse número.
4. Rateio: cada marcado deve total ÷ número; quem pagou recebe só essas partes. As partes de quem não está marcado ficam fora do acerto (`outsideBRL`, mostrado no cartão do Rateio como "Fora do acerto (quem não está no app)").
5. `splitCount` no `Expense` e no `CentralCostOverride`, salvo só quando passa dos marcados. Sem o campo (gastos antigos), vale o número de marcados (`effectiveSplitCount`). O cartão do lançamento diz "dividido entre N pessoas".
6. Testes em `settlement.test.ts`: R$ 300 pago pela Paula ("Outro"), dividido entre 4, com Eu e Marina marcadas → Eu devo R$ 75 pra Paula e Marina deve R$ 75 pra Paula; e número menor que os marcados conta os marcados.

## D. Planos dos convidados viram provisórios (muda a regra do ajuste 87)

Cada pessoa tem o próprio roteiro. O da participante mostra os planos dos outros só como referência.

1. **Modelo:** lugar escolhido só por convidado (`addedBy` ≠ `'voce'` e `'voce'` fora de `alsoWantedBy`) é um **plano do grupo**. `isMyPlace` (`src/utils/itinerary.ts`) filtra dentro de `computeDestinationAssignments` e `computeUnpinnedLocalDay`: o plano fica fora da divisão por proximidade, do mapa, da Agenda do dia e da contagem de lugares (o ✓ do menu já contava só a participante desde o ajuste 89).
2. **Roteiro → Lista:** em cada dia, abaixo das paradas, bloco **"Planos do grupo"** (`groupPlansByDay`: dia em que o plano cairia se a participante tocasse "+" agora, calculado com as paradas dela sem override + ele; sem dia calculável, o 1º dia da cidade). Cartão provisório `GroupPlanCard`: borda tracejada de 1,5px na cor do convidado (decorativa, o nome está escrito), foto 48px, fundo transparente, avatar + "Marina vai" e o "+" circular à direita (`JoinButton`, extraído da lista de "Escolhas dos convidados"; aria "Ir também a …").
3. Tocar no "+" → `'voce'` entra em `alsoWantedBy`, o lugar vira parada normal, entra na proximidade e mostra "Você e Marina vão". Na parada, ao lado da tag de quem sugeriu, fica o ✓ (`JoinButton joined`): tocar desfaz e o lugar volta a ser plano provisório da Marina (toast "Saiu do seu roteiro. Continua como plano da Marina.").
4. Interruptor **"Mostrar planos do grupo"** (`Switch`, ligado por padrão) no topo da aba Roteiro; desligado esconde o bloco. Só aparece quando existe algum plano (sem plano, seria um interruptor que não faz nada).
5. **Textos** (`goersText`, substitui `wantersText` em `src/utils/members.ts`): antes do toque, "Marina vai · toque + pra ir também"; depois, "Você e Marina vão". No `PlaceCard`, o plano usa o mesmo "+" do canto — saíram o botão "Eu também" e o selo "Selecionado pelo grupo". A lista "Escolhas dos convidados" começa sempre no "+".
6. **Mock** (`mockCompanions.ts`, `applyMockContributions`): `places` virou `{ placeId, reserves }[]`. O convidado sugere o primeiro lugar da lista que ninguém escolheu ainda (nem a participante, nem o outro convidado). Reservas, mesma cidade e categoria parecida:
   - Marina: Don Julio → La Cabrera, La Brigada, Cabaña Las Lilas · Bocanáriz → Liguria, La Cabrera (Las Condes), Peumayén · Laguna Cejar → Laguna Chaxa, Ojos del Salar, Valle de la Muerte.
   - Rodrigo: La Bombonera → Monumental de River, Teatro Colón, Casa Rosada · Mercado Central → Confitería Torres, Costanera Center, Liguria · Valle de la Luna → Géiseres del Tatio, Valle de la Muerte, Lagunas Altiplânicas.
   As "Novidades na viagem" e o banner contam lugares por cidade ("2 lugares sugeridos em Buenos Aires"), sem nome de lugar — continuam certos com a reserva.
7. CLAUDE.md, seção Roteiro, com a regra nova.
