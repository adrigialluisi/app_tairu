# Ajuste 90 — Custos: lançar gasto pela foto da nota e rateio com acertos parciais

Origem: teste de 13/out/2026.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 90: gasto pela nota e rateio com acertos`.

---

## 1. Lançar gasto pela foto da nota (mock, igual aos vouchers)

**Ideia da Adriana:** como na Central, tirar foto da nota e já preencher pelo menos valor e local, do jeito mais simples possível. A foto fica guardada como comprovante.

**Arquivos de exemplo (já criados e salvos):**
- `public/mock-receipts/nota-don-julio-buenosaires.jpg` — Parrilla Don Julio, Buenos Aires, ARS 120.000, 20/11/2026.
- `public/mock-receipts/nota-bocanariz-santiago.jpg` — Bocanáriz, Santiago, CLP 89.900, 23/11/2026.
(As mesmas imagens estão no kit do participante, em `Instrucoes/Envio_Participante_Tairu/Arquivos do teste/`.)

**Fazer:**
- No topo do `ExpenseForm.tsx` (em Custos e no gasto aberto pela parada do Roteiro), um bloco igual ao da Central: "Tem a nota? Envie uma foto pra preencher automaticamente." + botão "Enviar foto da nota". Reaproveitar o componente `VoucherUpload` (ou extrair dele o que for comum).
- **Leitura simulada pelo nome do arquivo**, mesmo padrão de `src/data/mockVouchers.ts` (ajuste 84). Criar `MOCK_RECEIPTS` (pode ficar em `mockVouchers.ts` ou num `mockReceipts.ts` ao lado):
  - `nota-don-julio-buenosaires.jpg` → descrição "Don Julio", onde = Buenos Aires, valor `120000`, moeda ARS, categoria Alimentação, data 20/11/2026.
  - `nota-bocanariz-santiago.jpg` → descrição "Bocanáriz", onde = Santiago, valor `89900`, moeda CLP, categoria Alimentação, data 23/11/2026.
  - **Qualquer outro arquivo** → preenche só o que dá pra deduzir do contexto, sem inventar valor: se o formulário foi aberto pela parada, usa o lugar, a cidade, a moeda e a data da parada; o **valor fica vazio**, com foco no campo e o texto "Não conseguimos ler o valor. Digite o total da nota."
- Campos preenchidos ganham o mesmo destaque e o mesmo aviso verde da Central: "Preenchemos os campos com o que lemos da nota. Confira antes de salvar."
- A foto entra automaticamente em "Comprovante" (anexo do gasto).
- No cartão do lançamento (`ExpenseCard.tsx`), mostrar uma miniatura da nota quando houver; tocar abre a imagem.

## 2. Rateio com acertos parciais (a dívida paga não "renasce")

**Problema:** hoje "Marcar como acertado" guarda uma chave que inclui o **valor** da transferência (`settledKey` em `utils/costs.ts`). Se entra um gasto novo depois, o valor muda, a marcação some e a pessoa volta a aparecer devendo **o total**, inclusive o que já pagou.

**Fazer:**
- **Acerto vira pagamento registrado.** Novo tipo no `TripContext`:
  ```ts
  interface Settlement { id: string; from: MemberId; to: MemberId; amountBRL: number; date: string /* ISO */; }
  ```
  com `settlements: Settlement[]`, `addSettlement`, `removeSettlement`. Substitui `settledTransferKeys` (migrar: pode simplesmente zerar, o protótipo não persiste entre sessões).
- **Saldos consideram os pagamentos:** em `computeBalances`, cada `Settlement` soma `amountBRL` a quem pagou (`from`) e subtrai de quem recebeu (`to`), como um gasto no sentido contrário. `computeTransfers` continua igual, mas agora calcula **só o que falta**.
- **Na tela (`SettlementPanel.tsx`):**
  - Cada transferência pendente: "Marina paga R$ 249,67 pra Você" + botão "Registrar pagamento".
  - "Registrar pagamento" abre um mini-formulário com o valor já preenchido com o total (editável, pra permitir **pagamento parcial**) e a data de hoje. Confirmar cria o `Settlement`.
  - Se ninguém deve nada: "Tudo acertado por enquanto."
  - **Histórico de acertos** abaixo: "Marina pagou R$ 249,67 pra Você · 21/11", com "Desfazer" em cada linha.
- **Critério de aceite (no `npm test`):**
  1. Marina deve R$ 249,67 → registra pagamento de R$ 249,67 → não aparece mais dívida dela.
  2. Entra um gasto novo de R$ 240,00 pago por você e dividido por 3 → aparece "Marina paga R$ 80,00 pra Você" (só a diferença), e o pagamento anterior continua no histórico.
  3. Pagamento parcial de R$ 100 de uma dívida de R$ 249,67 → continua "Marina paga R$ 149,67 pra Você".

---

## Checklist de aceite
- [ ] Enviar `nota-don-julio-buenosaires.jpg` preenche Don Julio, Buenos Aires, ARS 120.000, Alimentação e data, com aviso verde, e guarda a foto como comprovante.
- [ ] Enviar uma foto qualquer não inventa valor.
- [ ] Miniatura da nota no lançamento.
- [ ] Acerto vira pagamento; gasto novo gera só a diferença; pagamento parcial funciona; histórico com "Desfazer".
- [ ] Os 3 critérios do item 2 cobertos no `npm test`.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
