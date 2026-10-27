/*
  Teste automatizado do rateio com acertos (ajustes-90, item 2). Roda com o `node --test` nativo
  (`npm test`). Grupo do cenário: Você, Marina e Rodrigo. Um gasto de R$ 749,01 pago por você e
  dividido pelos 3 deixa cada um devendo R$ 249,67 a você.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBalances,
  computeTransfers,
  externalMemberId,
  type BalanceEntry,
  type Settlement,
  unsplitCost,
} from './settlement.ts';

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

/*
  "Outro" em "Quem pagou?" (ajustes-94): alguém de fora da viagem paga e entra no acerto pelo nome
  digitado. Paula paga um jantar de R$ 150 dividido entre ela, você e a Marina.
*/
const PAULA = externalMemberId('Paula');
const WITH_PAULA = [...MEMBERS, { id: PAULA }];
const paulaDinner: BalanceEntry = { amountBRL: 150, paidBy: PAULA, splitWith: ['voce', 'marina', PAULA] };

test('Outro: gasto pago pela Paula → Você deve R$ 50 pra Paula, e a Marina também', () => {
  const transfers = computeTransfers(computeBalances([paulaDinner], WITH_PAULA));
  assert.equal(transfers.find((t) => t.from === 'voce' && t.to === PAULA)?.amountBRL, 50);
  assert.equal(transfers.find((t) => t.from === 'marina' && t.to === PAULA)?.amountBRL, 50);
  assert.equal(transfers.some((t) => t.from === 'rodrigo'), false);
});

test('Outro: o mesmo nome com outra caixa, acento e espaços é a mesma pessoa', () => {
  assert.equal(externalMemberId('  PAULÁ  '), PAULA);
  assert.equal(externalMemberId('Ana  Maria'), externalMemberId('ana maria'));
  // segundo gasto da "paula ", R$ 60 entre ela e você: você passa a dever R$ 50 + R$ 30
  const coffee: BalanceEntry = { amountBRL: 60, paidBy: externalMemberId('paula '), splitWith: ['voce', externalMemberId('PAULA')] };
  const transfers = computeTransfers(computeBalances([paulaDinner, coffee], WITH_PAULA));
  assert.equal(transfers.filter((t) => t.to === PAULA).length, 2);
  assert.equal(transfers.find((t) => t.from === 'voce' && t.to === PAULA)?.amountBRL, 80);
});

/*
  Convidado com convite pendente (ajustes-95, desfaz o 94b): o organizador lança gastos sem depender
  de quem aceitou. O Rodrigo ainda não aceitou e pagou um táxi de R$ 90 dividido com você; ninguém
  entrou na viagem e o rateio funciona mesmo assim, só com quem aparece no gasto.
*/
test('pendente: táxi de R$ 90 pago pelo Rodrigo (convite pendente) → Você deve R$ 45 pra ele', () => {
  const taxi: BalanceEntry = { amountBRL: 90, paidBy: 'rodrigo', splitWith: ['voce', 'rodrigo'] };
  const transfers = computeTransfers(computeBalances([taxi], [{ id: 'voce' }, { id: 'rodrigo' }]));
  assert.deepEqual(
    transfers.map((t) => [t.from, t.to, t.amountBRL]),
    [['voce', 'rodrigo', 45]],
  );
});

/*
  "Dividido entre quantas pessoas?" (ajustes-95b): a Paula ("Outro") paga R$ 300 dividido entre 4
  pessoas — você, a Marina e mais duas que não estão no app. Só você e a Marina estão marcadas:
  cada uma deve R$ 75 pra Paula; as outras duas partes (e a da própria Paula) ficam fora do acerto.
*/
test('dividido entre 4: R$ 300 pago pela Paula, Eu e Marina marcadas → cada uma deve R$ 75 pra Paula', () => {
  const lunch: BalanceEntry = { amountBRL: 300, paidBy: PAULA, splitWith: ['voce', 'marina'], splitCount: 4 };
  const balances = computeBalances([lunch], WITH_PAULA);
  const transfers = computeTransfers(balances);
  assert.deepEqual(
    transfers.map((t) => [t.from, t.to, t.amountBRL]).sort(),
    [
      ['marina', PAULA, 75],
      ['voce', PAULA, 75],
    ],
  );
  assert.equal(balances.find((b) => b.memberId === PAULA)?.outsideBRL, 150);
});

test('dividido entre: número menor que os marcados conta os marcados', () => {
  const taxi: BalanceEntry = { amountBRL: 90, paidBy: 'voce', splitWith: ['voce', 'marina', 'rodrigo'], splitCount: 2 };
  assert.equal(marinaOwes([taxi], []), 30);
});

/*
  Gasto começa só com quem lançou (ajustes-95c): o hotel de R$ 1.200 que veio da Central, sem a
  divisão editada, é só seu — ninguém deve nada a ninguém.
*/
test('custo da Central sem edição não gera dívida', () => {
  const hotel: BalanceEntry = { amountBRL: 1200, ...unsplitCost() };
  const balances = computeBalances([hotel], MEMBERS);
  assert.deepEqual(computeTransfers(balances), []);
  assert.ok(balances.every((b) => Math.abs(b.balanceBRL) < 0.005));
});

/*
  "+ Outra pessoa" no "Dividir com" (ajustes-95c): a Paula não está na viagem, só nesse gasto. Você
  paga R$ 200, dividido entre você e ela (2 pessoas) → a Paula deve R$ 100 pra você. O nome vale
  sem diferenciar maiúscula, acento e espaços.
*/
test('Eu + "Paula" (pessoa de fora) dividido entre 2 → Paula deve metade pra mim', () => {
  const dinner2: BalanceEntry = { amountBRL: 200, paidBy: 'voce', splitWith: ['voce', externalMemberId(' paula ')], splitCount: 2 };
  const transfers = computeTransfers(computeBalances([dinner2], [{ id: 'voce' }, { id: externalMemberId('Paula') }]));
  assert.deepEqual(
    transfers.map((t) => [t.from, t.to, t.amountBRL]),
    [[externalMemberId('Paula'), 'voce', 100]],
  );
});
