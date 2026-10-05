import { buildCostEntries } from './costs';
import type { TripContextValue } from '../context/TripContext';

/** Pelo menos 1 destino, e todos os destinos cadastrados já com datas preenchidas. */
export function isDestinosComplete(trip: Pick<TripContextValue, 'destinations'>): boolean {
  return trip.destinations.length > 0 && trip.destinations.every((d) => d.dateStart && d.dateEnd);
}

/** Pelo menos 1 lugar ou 1 evento escolhido (de qualquer destino). */
export function isRoteiroComplete(trip: Pick<TripContextValue, 'selectedPlaces' | 'selectedEventIds'>): boolean {
  return trip.selectedPlaces.length > 0 || trip.selectedEventIds.length > 0;
}

/** Pelo menos 1 gasto lançado à mão ou 1 custo (valor > 0) vindo da Central. */
export function isCustosComplete(
  trip: Pick<
    TripContextValue,
    'companions' | 'expenses' | 'transportItems' | 'stayItems' | 'otherItems' | 'centralCostOverrides'
  >,
): boolean {
  return buildCostEntries(trip).length > 0;
}
