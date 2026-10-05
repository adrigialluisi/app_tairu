import { BedDouble, ClipboardList, ShoppingBag, Ticket, TrainFront, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { ExpenseCategory, MemberId, OtherItem, TripContextValue } from '../context/TripContext';
import { isValidCalendarDate, toISODate } from './dateMask';
import { parseAmount, toBRL } from './money';
import { otherItemTitle } from './otherSummary';
import { stayItemTitle } from './staySummary';
import { transportItemTitle } from './transportSummary';

/**
 * Custos da viagem (docs/ajustes-61-custos-lancamentos-e-rateio.md): junta
 * os gastos lançados à mão com os custos já digitados na Central e calcula
 * o rateio (estilo Splitwise) em reais.
 */

type TripForCosts = Pick<
  TripContextValue,
  'companions' | 'expenses' | 'transportItems' | 'stayItems' | 'otherItems' | 'centralCostOverrides'
>;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'transporte',
  'hospedagem',
  'alimentacao',
  'passeios',
  'compras',
  'outros',
];

/** Cor da barra sempre acompanhada do ícone + texto na legenda (nunca só cor). */
export const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: LucideIcon; color: string }> = {
  transporte: { label: 'Transporte', icon: TrainFront, color: 'var(--chart-1)' },
  hospedagem: { label: 'Hospedagem', icon: BedDouble, color: 'var(--chart-2)' },
  alimentacao: { label: 'Alimentação', icon: UtensilsCrossed, color: 'var(--chart-3)' },
  passeios: { label: 'Passeios', icon: Ticket, color: 'var(--chart-4)' },
  compras: { label: 'Compras', icon: ShoppingBag, color: 'var(--chart-5)' },
  outros: { label: 'Outros', icon: ClipboardList, color: 'var(--chart-6)' },
};

export const YOU: MemberId = 'voce';

export interface Member {
  id: MemberId;
  /** nome completo quando existir (convidado simulado), senão o começo do e-mail */
  label: string;
  /** primeiro nome (ou o label), pra frases curtas: "Marina quer ir" */
  shortName: string;
  /** "EU" pra você; iniciais do convidado */
  initials: string;
}

export interface CostEntry {
  /** id do Expense ou sourceId da Central */
  id: string;
  origin: 'manual' | 'central';
  description: string;
  amount: number;
  currencyCode: string;
  amountBRL: number | null;
  destinationId: string | null;
  category: ExpenseCategory;
  paidBy: MemberId;
  /** já resolvido (null → todos os membros) */
  splitWith: MemberId[];
  date: string | null;
}

export function getMembers(trip: Pick<TripContextValue, 'companions'>): Member[] {
  return [
    { id: YOU, label: 'Você', shortName: 'Você', initials: 'EU' },
    ...trip.companions.map((c) => {
      const label = c.name ?? (c.email.split('@')[0] || c.email);
      return {
        id: c.id,
        label,
        shortName: c.name ? c.name.split(' ')[0] : label,
        initials: c.initials ?? label.slice(0, 2).toUpperCase(),
      };
    }),
  ];
}

export function memberLabel(members: Member[], id: MemberId): string {
  return members.find((m) => m.id === id)?.label ?? 'Alguém que saiu da viagem';
}

/** null → todos; ids de convidados removidos são ignorados; se sobrar ninguém, volta pra todos. */
export function resolveSplit(splitWith: MemberId[] | null, members: Member[]): MemberId[] {
  const all = members.map((m) => m.id);
  if (!splitWith) return all;
  const valid = splitWith.filter((id) => all.includes(id));
  return valid.length > 0 ? valid : all;
}

/** "22/11/2026" ou "22/11/2026 14:00" → "2026-11-22"; qualquer outra coisa → null */
export function displayDateToISO(value: string): string | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const date = { day: Number(m[1]), month: Number(m[2]), year: Number(m[3]) };
  return isValidCalendarDate(date) ? toISODate(date) : null;
}

function otherCategory(item: OtherItem): ExpenseCategory {
  return item.type === 'seguro' ? 'outros' : 'passeios';
}

export function buildCostEntries(trip: TripForCosts): CostEntry[] {
  const members = getMembers(trip);
  const entries: CostEntry[] = [];

  for (const e of trip.expenses) {
    const amount = parseAmount(e.amount);
    if (amount === null || amount <= 0) continue;
    entries.push({
      id: e.id,
      origin: 'manual',
      description: e.description,
      amount,
      currencyCode: e.currencyCode,
      amountBRL: toBRL(amount, e.currencyCode),
      destinationId: e.destinationId,
      category: e.category,
      paidBy: e.paidBy,
      splitWith: resolveSplit(e.splitWith, members),
      date: e.date,
    });
  }

  function pushCentral(
    sourceId: string,
    costAmount: string,
    currencyCode: string,
    description: string,
    category: ExpenseCategory,
    destinationId: string | null,
    date: string | null,
  ) {
    const amount = parseAmount(costAmount);
    if (amount === null || amount <= 0) return;
    const override = trip.centralCostOverrides.find((o) => o.sourceId === sourceId);
    entries.push({
      id: sourceId,
      origin: 'central',
      description,
      amount,
      currencyCode,
      amountBRL: toBRL(amount, currencyCode),
      destinationId,
      category,
      paidBy: override && members.some((m) => m.id === override.paidBy) ? override.paidBy : YOU,
      splitWith: resolveSplit(override?.splitWith ?? null, members),
      date,
    });
  }

  for (const t of trip.transportItems) {
    const when = t.type === 'carro-locado' ? t.pickupAt : t.departureAt;
    pushCentral(
      t.id,
      t.costAmount,
      t.costCurrencyCode,
      transportItemTitle(t),
      'transporte',
      t.destinationId,
      displayDateToISO(when),
    );
  }
  for (const s of trip.stayItems) {
    pushCentral(s.id, s.costAmount, s.costCurrencyCode, stayItemTitle(s), 'hospedagem', s.destinationId, s.checkInDate);
  }
  for (const o of trip.otherItems) {
    pushCentral(o.id, o.costAmount, o.costCurrencyCode, otherItemTitle(o), otherCategory(o), o.destinationId, o.startDate);
  }

  return entries;
}

export interface MemberBalance {
  memberId: MemberId;
  paidBRL: number;
  shareBRL: number;
  /** positivo = vai receber; negativo = deve */
  balanceBRL: number;
}

/** Entradas sem amountBRL (moeda sem cotação) ficam de fora do rateio — a tela conta à parte. */
export function computeBalances(entries: CostEntry[], members: Member[]): MemberBalance[] {
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
  return [...byId.values()].map((b) => ({ ...b, balanceBRL: b.paidBRL - b.shareBRL }));
}

export interface Transfer {
  /** `${from}->${to}` */
  key: string;
  from: MemberId;
  to: MemberId;
  amountBRL: number;
}

/** Greedy: maior devedor paga ao maior credor até zerar; ignora < R$ 0,01. */
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

/** Chave guardada em settledTransferKeys — inclui o valor, então a marcação some se o valor mudar. */
export function settledKey(t: Transfer): string {
  return `${t.key}:${t.amountBRL.toFixed(2)}`;
}
