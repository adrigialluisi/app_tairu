import { formatISOToDisplay } from './dateMask';
import type { TripDestination } from '../context/TripContext';

export function formatDestinationsLabel(destinations: TripDestination[]): string {
  if (destinations.length === 0) return 'Nenhum destino ainda';
  return destinations.map((d) => d.city).join(', ');
}

/** Menor dateStart até maior dateEnd entre os destinos que já têm as duas datas — ignora os que não têm. */
export function formatDatesLabel(destinations: TripDestination[]): string {
  const withDates = destinations.filter((d) => d.dateStart && d.dateEnd);
  if (withDates.length === 0) return 'Datas a definir';
  const earliest = [...withDates].sort((a, b) => (a.dateStart as string).localeCompare(b.dateStart as string))[0]
    .dateStart as string;
  const latest = [...withDates].sort((a, b) => (b.dateEnd as string).localeCompare(a.dateEnd as string))[0]
    .dateEnd as string;
  return `${formatISOToDisplay(earliest).slice(0, 5)} – ${formatISOToDisplay(latest).slice(0, 5)}`;
}

export function formatCompanionsLabel(count: number): string {
  if (count === 0) return 'Só você, por enquanto';
  return count === 1 ? '1 convidado' : `${count} convidados`;
}
