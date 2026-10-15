/*
  Rateio em reais (ajustes-61), com os acertos como PAGAMENTOS registrados (ajustes-90).
  Módulo puro — sem imports de valor — pra rodar no teste automatizado com o `node --test`
  nativo (src/utils/settlement.test.ts, `npm test`). O costs.ts reexporta daqui.
*/

/** id de membro ('voce' ou o id do convidado) — mesmo tipo do TripContext */
type MemberId = string;

/** o mínimo de um lançamento que o rateio precisa (CostEntry de utils/costs.ts encaixa aqui) */
export interface BalanceEntry {
  /** null = moeda sem cotação: fica de fora do rateio (a tela conta à parte) */
  amountBRL: number | null;
  paidBy: MemberId;
  /** já resolvido (null → todos os membros) */
  splitWith: MemberId[];
}

/**
 * Acerto registrado (ajustes-90): "Marina pagou R$ 249,67 pra Você". Entra no saldo como um gasto
 * no sentido contrário — por isso um gasto novo depois gera só a diferença, e a dívida já paga
 * não "renasce" (antes a marcação guardava o valor da transferência e sumia quando ele mudava).
 */
export interface Settlement {
  id: string;
  from: MemberId;
  to: MemberId;
  amountBRL: number;
  /** yyyy-mm-dd */
  date: string;
}

export interface MemberBalance {
  memberId: MemberId;
  paidBRL: number;
  shareBRL: number;
  /** positivo = vai receber; negativo = deve */
  balanceBRL: number;
}

/**
 * Saldo de cada membro: o que pagou − a parte dele nos gastos, ajustado pelos acertos (quem pagou
 * o acerto sobe, quem recebeu desce). Entradas sem amountBRL ficam de fora.
 */
export function computeBalances(
  entries: BalanceEntry[],
  members: { id: MemberId }[],
  settlements: Settlement[] = [],
): MemberBalance[] {
  const byId = new Map(members.map((m) => [m.id, { memberId: m.id, paidBRL: 0, shareBRL: 0, balanceBRL: 0 }]));
  for (const e of entries) {
    if (e.amountBRL === null || e.splitWith.length === 0) continue;
    const payer = byId.get(e.paidBy);
    if (payer) payer.paidBRL += e.amountBRL;
    const share = e.amountBRL / e.splitWith.length;
    for (const id of e.splitWith) {
      const m = byId.get(id);
      if (m) m.shareBRL += share;
    }
  }
  for (const s of settlements) {
    const from = byId.get(s.from);
    const to = byId.get(s.to);
    if (from) from.paidBRL += s.amountBRL;
    if (to) to.paidBRL -= s.amountBRL;
  }
  return [...byId.values()].map((b) => ({ ...b, balanceBRL: b.paidBRL - b.shareBRL }));
}

export interface Transfer {
  /** `${from}->${to}` */
  key: string;
  from: MemberId;
  to: MemberId;
  amountBRL: number;
}

/** Greedy: maior devedor paga ao maior credor até zerar; ignora < R$ 0,01. É sempre o que FALTA. */
export function computeTransfers(balances: MemberBalance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.balanceBRL < -0.005)
    .map((b) => ({ id: b.memberId, left: -b.balanceBRL }))
    .sort((a, b) => b.left - a.left);
  const creditors = balances
    .filter((b) => b.balanceBRL > 0.005)
    .map((b) => ({ id: b.memberId, left: b.balanceBRL }))
    .sort((a, b) => b.left - a.left);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left);
    if (amount >= 0.01) {
      const from = debtors[i].id;
      const to = creditors[j].id;
      transfers.push({ key: `${from}->${to}`, from, to, amountBRL: Math.round(amount * 100) / 100 });
    }
    debtors[i].left -= amount;
    creditors[j].left -= amount;
    if (debtors[i].left < 0.005) i++;
    if (creditors[j].left < 0.005) j++;
  }
  return transfers;
}
