import type { TripContextValue } from '../context/TripContext';

/** Pelo menos 1 destino, e todos os destinos cadastrados já com datas preenchidas. */
export function isDestinosComplete(trip: Pick<TripContextValue, 'destinations'>): boolean {
  return trip.destinations.length > 0 && trip.destinations.every((d) => d.dateStart && d.dateEnd);
}

/** Pelo menos 1 lugar escolhido (de qualquer destino). */
export function isRoteiroComplete(trip: Pick<TripContextValue, 'selectedPlaces'>): boolean {
  return trip.selectedPlaces.length > 0;
}
