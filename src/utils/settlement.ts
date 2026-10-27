/*
  Rateio em reais (ajustes-61), com os acertos como PAGAMENTOS registrados (ajustes-90).
  Módulo puro — sem imports de valor — pra rodar no teste automatizado com o `node --test`
  nativo (src/utils/settlement.test.ts, `npm test`). O costs.ts reexporta daqui.
*/

/** id de membro ('voce' ou o id do convidado) — mesmo tipo do TripContext */
type MemberId = string;

/**
 * Pessoa de fora da viagem que pagou um gasto ("Outro" em "Quem pagou?", ajustes-94): entra no
 * rateio pelo nome digitado. O id vem do nome sem diferenciar maiúscula, acento e espaços, então
 * "Paula", "paula " e "PAULA" contam como a mesma pessoa em todos os gastos.
 */
export const EXTERNAL_MEMBER_PREFIX = 'outro:';

export function externalMemberId(name: string): MemberId {
  const key = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return `${EXTERNAL_MEMBER_PREFIX}${key}`;
}

export function isExternalMemberId(id: MemberId): boolean {
  return id.startsWith(EXTERNAL_MEMBER_PREFIX);
}

/**
 * Divisão de um gasto que ninguém dividiu ainda (ajustes-95c): pago por você, só você. É o padrão
 * dos custos que vêm da Central (voo, hotel, ingresso…) até a pessoa editar a divisão — não entram
 * no "quem deve pra quem" sozinhos — e o ponto de partida do "Lançar gasto".
 */
export function unsplitCost(): { paidBy: MemberId; splitWith: MemberId[] } {
  return { paidBy: 'voce', splitWith: ['voce'] };
}

/** o mínimo de um lançamento que o rateio precisa (CostEntry de utils/costs.ts encaixa aqui) */
export interface BalanceEntry {
  /** null = moeda sem cotação: fica de fora do rateio (a tela conta à parte) */
  amountBRL: number | null;
  paidBy: MemberId;
  /** já resolvido (null → todos os membros) */
  splitWith: MemberId[];
  /**
   * "Dividido entre quantas pessoas?" (ajustes-95b): pode ser maior que os marcados, pra incluir
   * gente que não está no app. Cada marcado (menos quem pagou) deve total ÷ esse número pra quem
   * pagou; as partes de quem não está marcado ficam fora do acerto. Sem o campo (ou menor que os
   * marcados): o número de marcados.
   */
  splitCount?: number;
}

/** Em quantas partes o gasto foi dividido: splitCount, nunca menos que os marcados. */
export function effectiveSplitCount(entry: Pick<BalanceEntry, 'splitWith' | 'splitCount'>): number {
  return Math.max(entry.splitCount ?? 0, entry.splitWith.length);
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
  /** o que pagou pela parte de quem não está marcado no gasto (ajustes-95b): fica fora do acerto */
  outsideBRL: number;
  /** positivo = vai receber; negativo = deve */
  balanceBRL: number;
}

/**
 * Saldo de cada membro: o que pagou − a parte dele nos gastos − o que pagou por quem está fora do
 * acerto (ajustes-95b), ajustado pelos acertos (quem pagou o acerto sobe, quem recebeu desce).
 * Entradas sem amountBRL ficam de fora.
 */
export function computeBalances(
  entries: BalanceEntry[],
  members: { id: MemberId }[],
  settlements: Settlement[] = [],
): MemberBalance[] {
  const byId = new Map(
    members.map((m) => [m.id, { memberId: m.id, paidBRL: 0, shareBRL: 0, outsideBRL: 0, balanceBRL: 0 }]),
  );
  for (const e of entries) {
    if (e.amountBRL === null || e.splitWith.length === 0) continue;
    const payer = byId.get(e.paidBy);
    const share = e.amountBRL / effectiveSplitCount(e);
    if (payer) {
      payer.paidBRL += e.amountBRL;
      payer.outsideBRL += e.amountBRL - share * e.splitWith.length;
    }
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
  return [...byId.values()].map((b) => ({ ...b, balanceBRL: b.paidBRL - b.shareBRL - b.outsideBRL }));
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
