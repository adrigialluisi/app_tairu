import { getPlaceById } from '../data';
import { findMockCompanion } from '../data/mockCompanions';
import type { Expense, TripCompanion, TripDestination, TripPlaceSelection } from '../context/TripContext';

/**
 * SIMULAÇÃO (docs/ajustes-67-convidados-simulados-contribuem.md): aplica as
 * contribuições dos convidados do cenário fixo que já "entraram". É
 * idempotente — roda na entrada e sempre que destinos/convidados mudam, sem
 * duplicar nada e sem recriar o que a pessoa removeu (`dismissedMockKeys`).
 */

export const mockPlaceKey = (companionId: string, placeId: string) => `place:${companionId}:${placeId}`;
export const mockExpenseKey = (key: string) => `expense:${key}`;
export const MOCK_EXPENSE_PREFIX = 'mock-';

interface ContributionState {
  destinations: TripDestination[];
  companions: TripCompanion[];
  selectedPlaces: TripPlaceSelection[];
  expenses: Expense[];
  dismissedMockKeys: string[];
}

export function applyMockContributions(state: ContributionState): {
  selectedPlaces: TripPlaceSelection[];
  expenses: Expense[];
  changed: boolean;
} {
  let selectedPlaces = state.selectedPlaces;
  let expenses = state.expenses;
  let changed = false;
  const dismissed = new Set(state.dismissedMockKeys);

  for (const companion of state.companions) {
    if (companion.status !== 'entrou') continue;
    const profile = findMockCompanion(companion.email);
    if (!profile) continue;

    for (const placeId of profile.places) {
      const place = getPlaceById(placeId);
      const destination = place && state.destinations.find((d) => d.cityId === place.cityId);
      if (!place || !destination || dismissed.has(mockPlaceKey(companion.id, placeId))) continue;

      const existing = selectedPlaces.find((s) => s.destinationId === destination.id && s.placeId === placeId);
      if (existing) {
        if (existing.addedBy === companion.id || existing.alsoWantedBy.includes(companion.id)) continue;
        selectedPlaces = selectedPlaces.map((s) =>
          s.id === existing.id ? { ...s, alsoWantedBy: [...s.alsoWantedBy, companion.id] } : s,
        );
      } else {
        selectedPlaces = [
          ...selectedPlaces,
          {
            id: `mock-place-${companion.id}-${placeId}`,
            destinationId: destination.id,
            placeId,
            customLabel: null,
            categories: place.categories,
            addedBy: companion.id,
            alsoWantedBy: [],
          },
        ];
      }
      changed = true;
    }

    for (const e of profile.expenses) {
      const id = `${MOCK_EXPENSE_PREFIX}${e.key}`;
      const cityDestinationId = state.destinations.find((d) => d.cityId === e.cityId)?.id ?? null;
      const current = expenses.find((x) => x.id === id);
      if (current) {
        // convidou antes de cadastrar a cidade: quando o destino aparece, o gasto passa a ser dele
        if (current.destinationId === null && cityDestinationId) {
          expenses = expenses.map((x) => (x.id === id ? { ...x, destinationId: cityDestinationId } : x));
          changed = true;
        }
        continue;
      }
      if (dismissed.has(mockExpenseKey(e.key))) continue;
      expenses = [
        ...expenses,
        {
          id,
          description: e.description,
          amount: e.amount,
          currencyCode: e.currencyCode,
          destinationId: cityDestinationId,
          category: e.category,
          paidBy: companion.id,
          splitWith: null,
          date: e.dateISO,
          attachments: [],
        },
      ];
      changed = true;
    }
  }

  return { selectedPlaces, expenses, changed };
}

/** Quantos lugares da viagem esse membro quer (adicionou ou também quer). */
export function placesWantedBy(selectedPlaces: TripPlaceSelection[], memberId: string): number {
  return selectedPlaces.filter((s) => s.addedBy === memberId || s.alsoWantedBy.includes(memberId)).length;
}
