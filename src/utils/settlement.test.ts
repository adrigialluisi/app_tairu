/*
  Teste automatizado do rateio com acertos (ajustes-90, item 2). Roda com o `node --test` nativo
  (`npm test`). Grupo do cenário: Você, Marina e Rodrigo. Um gasto de R$ 749,01 pago por você e
  dividido pelos 3 deixa cada um devendo R$ 249,67 a você.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances, computeTransfers, type BalanceEntry, type Settlement } from './settlement.ts';

const MEMBERS = [{ id: 'voce' }, { id: 'marina' }, { id: 'rodrigo' }];
const ALL = MEMBERS.map((m) => m.id);
const dinner: BalanceEntry = { amountBRL: 749.01, paidBy: 'voce', splitWith: ALL };

function marinaOwes(entries: BalanceEntry[], settlements: Settlement[]): number | null {
  const t = computeTransfers(computeBalances(entries, MEMBERS, settlements)).find(
    (x) => x.from === 'marina' && x.to === 'voce',
  );
  return t ? t.amountBRL : null;
}

const pay = (amountBRL: number, id = 'p1'): Settlement => ({ id, from: 'marina', to: 'voce', amountBRL, date: '2026-11-21' });

test('ponto de partida: Marina paga R$ 249,67 pra Você', () => {
  assert.equal(marinaOwes([dinner], []), 249.67);
});

test('1. Marina registra o pagamento de R$ 249,67 → não aparece mais dívida dela', () => {
  const transfers = computeTransfers(computeBalances([dinner], MEMBERS, [pay(249.67)]));
  assert.equal(transfers.some((t) => t.from === 'marina'), false);
});

test('2. gasto novo de R$ 240 pago por você e dividido por 3 → Marina paga só R$ 80, e o pagamento anterior continua', () => {
  const settlements = [pay(249.67)];
  const extra: BalanceEntry = { amountBRL: 240, paidBy: 'voce', splitWith: ALL };
  assert.equal(marinaOwes([dinner, extra], settlements), 80);
  // o acerto é um registro à parte: nada no cálculo o apaga
  assert.equal(settlements.length, 1);
  assert.equal(settlements[0].amountBRL, 249.67);
});

test('3. pagamento parcial de R$ 100 de uma dívida de R$ 249,67 → Marina paga R$ 149,67', () => {
  assert.equal(marinaOwes([dinner], [pay(100)]), 149.67);
});

test('desfazer o acerto (tirar o pagamento) volta a dívida inteira', () => {
  assert.equal(marinaOwes([dinner], []), 249.67);
});
