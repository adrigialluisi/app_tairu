# Ajuste 85 — Correções rápidas vistas no teste de 13/out/2026

Origem: teste do roteiro de usabilidade feito pela Adriana em 13/out/2026, passo a passo, com prints. Este ajuste junta só as correções **pequenas e independentes** (sem mudar fluxo). As maiores vêm nos ajustes 86 a 92.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint` e `npm run build` sem erro. Commit único: `ajuste 85: correções rápidas do teste de 13/out`.

---

## 1. ✓ de Destinos no menu só depois de salvar

**Problema:** o ✓ do item Destinos no menu fixo acende assim que o primeiro destino ganha datas, antes de a pessoa apertar "Salvar destinos".

**Causa:** `BottomNav.tsx` usa `isDestinosComplete(trip)` (só olha se há destino com datas).

**Fazer:** em `BottomNav.tsx`, o ✓ de `/destinos` passa a depender de `trip.destinosSaved` (estado que já existe no `TripContext` desde o ajuste 40) **e** de `isDestinosComplete(trip)`. Se a pessoa editar e o passo voltar a não-salvo, o ✓ some.

Obs.: os ✓ de Roteiro e Custos serão revistos no ajuste 89 (convidados em dois momentos). Não mexer neles aqui.

## 2. "Disponível offline" só em Meus documentos; toast só ao salvar

**Problema:** o aviso de offline aparece em todo lugar (toasts, resumo de Destinos e Perfil, cartões da Central, Roteiro, Custos, card da viagem na Início). Virou ruído. E o toast aparece a cada destino ou data adicionada, não só ao salvar.

**Fazer:**
- Remover `<OfflineBadge>` de: `CreateTrip.tsx` (as 2 ocorrências), `Home.tsx` (card da viagem), `Itinerary.tsx` (as 2 ocorrências), `Costs.tsx`, `TransportItemCard.tsx`, `StayItemCard.tsx`, `OtherItemCard.tsx`.
- **Manter** só em Meus documentos, e **uma vez só**: o texto do topo da tela de Documentos ("Seus documentos ficam salvos no celular e abrem sem internet"). Tirar o `<OfflineBadge />` de dentro de cada `DocumentCard.tsx`.
- `withOffline()` em `useSaveToast.ts`: parar de usar em todas as telas (InviteCompanions, Costs, CreateTrip, SuggestionsPanel). O toast mostra só a mensagem ("Destinos salvos", "Gasto salvo"). Pode apagar a função se não sobrar uso.
- Toast **só em ação explícita de salvar** (botões "Salvar …"), em convite enviado e em adicionar lugar/evento ao roteiro. **Não** disparar ao adicionar um destino no campo, ao escolher datas ou ao mudar qualquer campo de formulário. Revisar os `show(...)` de `CreateTrip.tsx` com isso em mente.
- Atualizar a regra correspondente no `CLAUDE.md` (o trecho que veio do ajuste 82 sobre offline em tudo): agora offline só aparece em Meus documentos.

## 3. Margem lateral faltando (Custos, Central, Documentos, Gerar recordação)

**Problema:** nos prints, títulos e cartões encostam na borda esquerda da tela em Custos, Central, Meus documentos e Gerar recordação. Destinos e Roteiro estão normais.

**Hipótese:** o `ScreenShell` já tem `padding: var(--space-6) var(--space-4)`. O mais provável é **estouro horizontal**: algum elemento mais largo que a tela (linha de pílulas/chips sem quebra, tabela, carrossel, `<select>` com largura mínima) faz o conteúdo rolar para o lado, e a tela aparece deslocada.

**Fazer:**
1. Abrir cada uma dessas telas em 375px de largura e achar o elemento que passa da largura (DevTools → procurar `scrollWidth > clientWidth`).
2. Corrigir na origem (`min-width: 0` em filhos de flex/grid, `flex-wrap`, `max-width: 100%`, `overflow-x: auto` só dentro de carrosséis). Não esconder o problema com `overflow-x: hidden` no corpo inteiro.
3. Conferir também que nenhum desses containers zera o padding lateral do `ScreenShell`.
4. Critério de aceite: em 375px e 390px, nenhuma dessas telas rola na horizontal e todo título tem 16px até a borda.

## 4. Navegação interna fixa no topo (regra geral)

**Fazer agora:**
- **Central:** a barra de abas Transporte · Hospedagem · Outros fica `position: sticky` no topo da área rolável, logo abaixo do `AppBar`, com fundo igual ao do miolo pra não deixar conteúdo aparecer por trás.
- **Custos:** idem para Lançamentos · Rateio · Conversor.
- **Regra no `CLAUDE.md`** (seção nova "Navegação interna fixa"): abas e alternadores que trocam o conteúdo de uma tela ficam presos no topo ao rolar. Se forem mais de uma linha de controles, compactar em vez de empilhar.

O Roteiro (que tem várias linhas de controles) fica pro ajuste 88.

## 5. Central: destino sem item não abre formulário vazio

**Problema:** em Transporte, todo destino sem item já aparece com o formulário inteiro aberto. Com 3 destinos, a página fica enorme.

**Causa:** `TransportDestinationGroup.tsx` começa com `editingId = 'new'` quando não há itens. Conferir o mesmo em `StayDestinationGroup.tsx` e `OtherSection.tsx`.

**Fazer:** começar sempre com `editingId = null`. Destino sem item mostra só um texto curto ("Nenhum transporte ainda") e o botão "+ Adicionar transporte" (mesmo botão já usado depois de salvar). O formulário abre ao tocar.

## 6. Lançar gasto: botão Cancelar

**Problema:** ao abrir "+ Lançar gasto" não há como desistir.

**Fazer:** no `ExpenseForm.tsx`, adicionar "Cancelar" como botão secundário ao lado (ou acima) de "Salvar gasto", que fecha o formulário sem salvar. Se o formulário estiver editando um gasto existente, "Cancelar" volta ao cartão sem alterações.

## 7. Cartão do documento mostra o lembrete

**Problema:** o cartão do passaporte não mostra se o "Me avisar" foi configurado.

**Fazer:** em `DocumentCard.tsx`, quando há `expiryDate`, mostrar uma linha com o lembrete: "Aviso 6 meses antes", "Aviso 3 meses antes", "Aviso 1 mês antes" ou "Sem aviso de vencimento" (esta última já existe). Usar o mesmo estilo de `styles.detail`.

## 8. Gerar recordação: foto não escolhida continua nítida

**Problema:** quando o limite de 8 por cidade é atingido, as fotos não escolhidas ficam com `opacity-50` e quase somem — justamente as que a pessoa precisa ver pra decidir trocar.

**Fazer:** em `PastTripRecap.tsx`, trocar o `opacity-50` do estado `blocked` por algo que mantenha a foto nítida: foto normal + um véu escuro leve (ex.: `bg-black/20` por cima) e o cursor `not-allowed`. A legenda "Limite de 8 fotos por cidade. Desmarque uma pra trocar." continua.

**Também:** o Palácio da Pena fica em Sintra. Nos dados de exemplo da viagem passada (`src/data/examplePastTrips.ts`), o rótulo passa a ser "Palácio da Pena · Sintra". Regra geral: lugar fora da cidade-base mostra a cidade no rótulo.

---

## Checklist de aceite
- [ ] ✓ de Destinos só aparece depois de "Salvar destinos".
- [ ] Nenhum "disponível offline" fora de Meus documentos; lá, só uma vez no topo.
- [ ] Nenhum toast ao digitar destino ou escolher data; toast ao salvar continua.
- [ ] Custos, Central, Documentos e Gerar recordação sem rolagem horizontal em 375px.
- [ ] Abas de Central e Custos fixas ao rolar.
- [ ] Central abre sem formulários vazios.
- [ ] "Cancelar" no lançar gasto.
- [ ] Lembrete visível no cartão do documento.
- [ ] Fotos bloqueadas nítidas; Palácio da Pena · Sintra.
- [ ] `npm run lint` e `npm run build` ok.
