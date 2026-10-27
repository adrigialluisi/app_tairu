import { BedDouble, ClipboardList, ShoppingBag, Ticket, TrainFront, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { ExpenseCategory, MemberId, OtherItem, TripCompanion, TripContextValue } from '../context/TripContext';
import { isValidCalendarDate, toISODate } from './dateMask';
import { assignMemberColors } from './memberColors';
import { externalMemberId, isExternalMemberId, unsplitCost } from './settlement';
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
  'companions' | 'formerCompanions' | 'expenses' | 'transportItems' | 'stayItems' | 'otherItems' | 'centralCostOverrides'
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
  /**
   * saiu da viagem (ajustes-83): continua pra dar nome aos lugares/gastos que trouxe e entra no
   * rateio pelo que pagou, mas não aparece em "quem pagou/dividir com" nem no "todos" da divisão
   */
  former?: boolean;
  /** e-mail do convite (convidados) — "Quem pagou?" e "Dividir com" mostram o e-mail de quem ainda não tem nome */
  email?: string;
  /** convite ainda não aceito — entra em "Quem pagou?", "Dividir com" e no rateio mesmo assim (ajustes-95, desfaz o 94b) */
  pending?: boolean;
  /**
   * "Outro" de "Quem pagou?" (ajustes-94): pessoa de fora da viagem, pelo nome digitado. Entra no
   * rateio, mas não no "todos" da divisão nem na lista de membros dos formulários.
   */
  external?: boolean;
  /** cor fixa da pessoa (ajustes-94, src/utils/memberColors.ts) — CSS var; "Outro" não tem */
  color?: string;
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
  /** nome de quem pagou quando foi "Outro" (ajustes-94) */
  paidByName?: string;
  /** já resolvido (null → todos os membros) */
  splitWith: MemberId[];
  /** "Dividido entre quantas pessoas?" (ajustes-95b) — ver effectiveSplitCount */
  splitCount?: number;
  /** pessoas de fora marcadas no "Dividir com" (ajustes-95c) */
  splitNames?: string[];
  date: string | null;
}

function toMember(c: TripCompanion, former: boolean): Member {
  const label = c.name ?? (c.email.split('@')[0] || c.email);
  return {
    id: c.id,
    label: former ? `${label} (saiu da viagem)` : label,
    shortName: c.name ? c.name.split(' ')[0] : label,
    initials: c.initials ?? label.slice(0, 2).toUpperCase(),
    email: c.email,
    ...(c.status === 'convite-enviado' ? { pending: true } : {}),
    ...(former ? { former: true } : {}),
  };
}

/**
 * quem pagou como "Outro" ou entrou no "Dividir com" pelo "+ Outra pessoa" (ajustes-95c) em algum
 * gasto (ou custo da Central), uma vez por nome normalizado
 */
function externalMembers(
  trip: Partial<Pick<TripContextValue, 'expenses' | 'centralCostOverrides'>>,
): Member[] {
  const byId = new Map<MemberId, Member>();
  const names = [...(trip.expenses ?? []), ...(trip.centralCostOverrides ?? [])].flatMap((e) => [
    ...(e.paidByName && isExternalMemberId(e.paidBy) ? [e.paidByName] : []),
    ...(e.splitNames ?? []),
  ]);
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const id = externalMemberId(name);
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      label: name,
      shortName: name.split(' ')[0],
      initials: name.slice(0, 2).toUpperCase(),
      external: true,
    });
  }
  return [...byId.values()];
}

/**
 * Você + convidados (aceitos ou com convite pendente) + quem saiu (marcado `former`) + quem pagou
 * como "Outro" (marcado `external`, ajustes-94). Cada um com a sua cor fixa (memberColors.ts).
 */
export function getMembers(
  trip: Pick<TripContextValue, 'companions'> &
    Partial<Pick<TripContextValue, 'formerCompanions' | 'expenses' | 'centralCostOverrides'>>,
): Member[] {
  const members: Member[] = [
    { id: YOU, label: 'Você', shortName: 'Você', initials: 'EU' },
    ...trip.companions.map((c) => toMember(c, false)),
    ...(trip.formerCompanions ?? []).map((c) => toMember(c, true)),
  ];
  const colors = assignMemberColors(members, YOU);
  return [...members.map((m) => ({ ...m, color: colors.get(m.id) })), ...externalMembers(trip)];
}

/** Só quem está na viagem agora (com convite pendente também) — pra escolher quem pagou/divide e pro "todos" da divisão. */
export function activeMembers(members: Member[]): Member[] {
  return members.filter((m) => !m.former && !m.external);
}

export function memberLabel(members: Member[], id: MemberId): string {
  return members.find((m) => m.id === id)?.label ?? 'Alguém que saiu da viagem';
}

/** null → todos; ids de convidados removidos são ignorados ("Outro" fica); se sobrar ninguém, volta pra todos. */
export function resolveSplit(splitWith: MemberId[] | null, members: Member[]): MemberId[] {
  const all = activeMembers(members).map((m) => m.id);
  if (!splitWith) return all;
  const valid = splitWith.filter((id) => all.includes(id) || isExternalMemberId(id));
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
      paidByName: e.paidByName,
      splitWith: resolveSplit(e.splitWith, members),
      splitCount: e.splitCount,
      splitNames: e.splitNames,
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
      paidByName: override?.paidByName,
      // sem divisão editada, só você (ajustes-95c): o custo da Central não vira dívida sozinho
      splitWith: override ? resolveSplit(override.splitWith, members) : unsplitCost().splitWith,
      splitCount: override?.splitCount,
      splitNames: override?.splitNames,
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

/*
  Saldos e transferências moraram aqui até o ajustes-90; agora ficam em settlement.ts (módulo puro,
  testado com o node --test), com os acertos registrados entrando no cálculo.
*/
export {
  computeBalances,
  computeTransfers,
  effectiveSplitCount,
  unsplitCost,
  type MemberBalance,
  type Settlement,
  type Transfer,
} from './settlement';
