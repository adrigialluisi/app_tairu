import { ShieldCheck, Ticket, TicketCheck, type LucideIcon } from 'lucide-react';
import type { OtherItem, OtherItemType, TripDestination } from '../context/TripContext';
import { formatISOToDisplay } from './dateMask';

const TYPE_LABELS: Record<OtherItemType, string> = {
  seguro: 'Seguro viagem',
  passeio: 'Passeio ou excursão',
  ingresso: 'Ingresso ou evento',
};

const TYPE_ICONS: Record<OtherItemType, LucideIcon> = {
  seguro: ShieldCheck,
  passeio: Ticket,
  ingresso: TicketCheck,
};

export const OTHER_TYPES: OtherItemType[] = ['seguro', 'passeio', 'ingresso'];

export function otherTypeLabel(type: OtherItemType): string {
  return TYPE_LABELS[type];
}

export function otherTypeIcon(type: OtherItemType): LucideIcon {
  return TYPE_ICONS[type];
}

export function otherItemTitle(item: OtherItem): string {
  if (item.type === 'seguro') return item.provider.trim() || item.title.trim() || TYPE_LABELS.seguro;
  return item.title.trim() || item.provider.trim() || TYPE_LABELS[item.type];
}

export function otherItemScope(item: OtherItem, destinations: TripDestination[]): string {
  if (!item.destinationId) return 'Viagem toda';
  const d = destinations.find((x) => x.id === item.destinationId);
  return d ? d.city : 'Viagem toda';
}

/** Uma informação por linha (critério do ajustes-48). Nunca inclui custo. */
export function otherItemDetailRows(item: OtherItem): string[] {
  const rows: string[] = [];
  const period =
    item.startDate && item.endDate && item.endDate !== item.startDate
      ? `${formatISOToDisplay(item.startDate)} → ${formatISOToDisplay(item.endDate)}`
      : item.startDate
        ? formatISOToDisplay(item.startDate)
        : '';
  const when = [period, item.time].filter(Boolean).join(' · ');

  switch (item.type) {
    case 'seguro':
      if (item.title) rows.push(item.title);
      if (when) rows.push(`Vigência: ${when}`);
      if (item.referenceCode) rows.push(`Apólice ${item.referenceCode}`);
      if (item.emergencyPhone) rows.push(`Central 24h: ${item.emergencyPhone}`);
      break;
    case 'passeio':
    case 'ingresso':
      if (item.provider && item.type === 'passeio') rows.push(item.provider);
      if (when) rows.push(when);
      if (item.location) rows.push(item.type === 'passeio' ? `Encontro: ${item.location}` : item.location);
      if (item.referenceCode) rows.push(`Código ${item.referenceCode}`);
      break;
  }
  if (item.notes) rows.push(item.notes);
  return rows.length ? rows : ['Detalhes a preencher'];
}
