import { YOU, buildCostEntries } from './costs';
import { MOCK_EXPENSE_PREFIX } from './mockContributions';
import type { TripContextValue } from '../context/TripContext';

/** Pelo menos 1 destino, e todos os destinos cadastrados já com datas preenchidas. */
export function isDestinosComplete(trip: Pick<TripContextValue, 'destinations'>): boolean {
  return trip.destinations.length > 0 && trip.destinations.every((d) => d.dateStart && d.dateEnd);
}

/**
 * Pelo menos 1 lugar ou 1 evento escolhido PELA PRÓPRIA PESSOA (ajustes-89): lugar que ela
 * adicionou ou em que tocou "Eu também". Lugar só de convidado não acende o ✓ — vira número de
 * novidade no menu. Evento só a pessoa escolhe.
 */
export function isRoteiroComplete(trip: Pick<TripContextValue, 'selectedPlaces' | 'selectedEventIds'>): boolean {
  return (
    trip.selectedPlaces.some((s) => s.addedBy === YOU || s.alsoWantedBy.includes(YOU)) ||
    trip.selectedEventIds.length > 0
  );
}

/**
 * Pelo menos 1 gasto lançado à mão pela pessoa ou 1 custo (valor > 0) que ela cadastrou na
 * Central (ajustes-89): gasto de convidado simulado (id `mock-…`) não conta.
 */
export function isCustosComplete(
  trip: Pick<
    TripContextValue,
    'companions' | 'formerCompanions' | 'expenses' | 'transportItems' | 'stayItems' | 'otherItems' | 'centralCostOverrides'
  >,
): boolean {
  return buildCostEntries(trip).some((e) => e.origin === 'central' || !e.id.startsWith(MOCK_EXPENSE_PREFIX));
}
