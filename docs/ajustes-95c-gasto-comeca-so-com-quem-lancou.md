# Ajuste 95c — Gasto começa só com quem lançou e pessoas de fora no "Dividir com"

Origem: pedido da Adriana em 27/out/2026, depois do ajuste 95b. Commit: `ajuste 95c: gasto começa só com quem lançou e pessoas de fora no dividir com`.

---

1. **Custos da Central não se dividem sozinhos.** Sem divisão editada (sem `CentralCostOverride`), o custo é pago por você e só seu (`unsplitCost()` em `src/utils/settlement.ts`, usado no `buildCostEntries`): Quem pagou = Eu, Dividir com = só Eu, Dividido entre = 1. Só entra no "quem deve pra quem" depois que a pessoa edita a divisão.
2. **Lançar gasto começa igual:** Eu pagou, só Eu marcado, 1 pessoa. A pessoa marca os amigos se quiser dividir. O formulário salva sempre a lista marcada: o `splitWith: null` ("todos, inclusive quem entrar depois") ficou só nos gastos simulados dos convidados, que continuam divididos entre todos. Tirar da viagem a única pessoa de uma divisão deixa a divisão só com você, nunca "todos".
3. **Editar custo da Central:** o formulário abre com o que está salvo ou com o padrão do item 1. O `usePaidSplit` nunca começa sem ninguém marcado: lista vazia vira "só Eu", e o número nunca é 0.
4. **"+ Outra pessoa"** no fim dos chips do "Dividir com" (borda tracejada, é uma ação): abre "Nome da pessoa" com "Adicionar" (ou Enter) e "Cancelar" (ou Esc). Ao confirmar, vira um chip já marcado com "×" pra remover (`MultiOptionChipGroup` ganhou `removableValues`, `onRemove` e `trailing`). Dá pra pôr várias. Essas pessoas existem só nesse gasto (`splitNames` no `Expense`/`CentralCostOverride`, não viram convidados) e entram no rateio pelo nome (`externalMemberId`, igual ao "Outro" de quem pagou): mesmo nome = mesma pessoa, sem diferenciar maiúscula, acento e espaços. Nome igual ao "Outro" de quem pagou só marca o chip que já existe.
5. **"Dividido entre quantas pessoas?"** continua como no 95b: acompanha os marcados enquanto não for editado e nunca fica menor que eles.
6. **Cartão do lançamento:** com só você na divisão, "Pago por Você · só você" no lugar de "dividido entre 1 pessoa".
7. **Testes** (`settlement.test.ts`): custo da Central sem edição não gera dívida; Eu + "Paula" (de fora) dividido entre 2 → a Paula deve metade pra mim.
