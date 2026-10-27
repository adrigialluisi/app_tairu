import { airportFromValue, getPlaceById } from '../data';
import { findMockCompanion, type MockRequirement } from '../data/mockCompanions';
import type {
  Expense,
  StayItem,
  TransportItem,
  TripCompanion,
  TripDestination,
  TripPlaceSelection,
} from '../context/TripContext';

/**
 * SIMULAÇÃO (docs/ajustes-89-convidados-em-dois-momentos.md, substitui a aplicação contínua do
 * ajustes-67): as contribuições dos convidados do cenário fixo entram UMA vez, quando o moderador
 * aciona "Simular: uma semana antes da viagem". Nada é recriado depois: gasto cuja condição (`requires`) não
 * existia naquele momento não aparece mais tarde sozinho.
 */

export const mockPlaceKey = (companionId: string, placeId: string) => `place:${companionId}:${placeId}`;
export const mockExpenseKey = (key: string) => `expense:${key}`;
export const MOCK_EXPENSE_PREFIX = 'mock-';

interface ContributionState {
  destinations: TripDestination[];
  /** quem acabou de "entrar" na simulação */
  joined: TripCompanion[];
  selectedPlaces: TripPlaceSelection[];
  expenses: Expense[];
  transportItems: TransportItem[];
  stayItems: StayItem[];
  dismissedMockKeys: string[];
}

export interface ContributionResult {
  selectedPlaces: TripPlaceSelection[];
  expenses: Expense[];
  /** ids das seleções novas dos convidados (planos do grupo) — selo "Novo" */
  newPlaceSelectionIds: string[];
  newExpenseIds: string[];
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** um voo/ônibus/trem chega na cidade: aeroporto da base (ou que a atende) ou o nome da cidade no destino */
function arrivesIn(t: TransportItem, cityId: string, cityName: string | undefined): boolean {
  if (t.type === 'carro-locado') return false;
  const airport = airportFromValue(t.destination);
  if (airport) return airport.cityId === cityId || !!airport.nearCityIds?.includes(cityId);
  return !!cityName && normalize(t.destination).includes(normalize(cityName));
}

function requirementMet(req: MockRequirement, state: ContributionState, selectedPlaces: TripPlaceSelection[]): boolean {
  if (req.type === 'place') return selectedPlaces.some((s) => s.placeId === req.placeId);
  const cityDestinations = state.destinations.filter((d) => d.cityId === req.cityId);
  if (req.type === 'stay') return state.stayItems.some((s) => cityDestinations.some((d) => d.id === s.destinationId));
  const cityName = cityDestinations[0]?.city;
  return state.transportItems.some((t) => arrivesIn(t, req.cityId, cityName));
}

export function applyMockContributions(state: ContributionState): ContributionResult {
  let selectedPlaces = state.selectedPlaces;
  let expenses = state.expenses;
  const newPlaceSelectionIds: string[] = [];
  const newExpenseIds: string[] = [];
  const dismissed = new Set(state.dismissedMockKeys);

  // 1º os lugares de todos (o gasto da Marina depende do lugar que ela mesma sugere)
  for (const companion of state.joined) {
    const profile = findMockCompanion(companion.email);
    if (!profile) continue;
    for (const { placeId: first, reserves } of profile.places) {
      /*
        Plano do grupo (ajustes-95b): o convidado sugere um lugar que ainda não está no roteiro —
        nem da participante nem do outro convidado. Se o principal já está, o primeiro livre da
        reserva (mesma cidade). Entra como plano provisório dele: addedBy = convidado, sem 'voce'.
      */
      const placeId = [first, ...reserves].find((id) => {
        const candidate = getPlaceById(id);
        const dest = candidate && state.destinations.find((d) => d.cityId === candidate.cityId);
        return (
          !!dest &&
          !dismissed.has(mockPlaceKey(companion.id, id)) &&
          !selectedPlaces.some((s) => s.destinationId === dest.id && s.placeId === id)
        );
      });
      const place = placeId ? getPlaceById(placeId) : undefined;
      const destination = place && state.destinations.find((d) => d.cityId === place.cityId);
      if (!placeId || !place || !destination) continue;

      const id = `mock-place-${companion.id}-${placeId}`;
      selectedPlaces = [
        ...selectedPlaces,
        {
          id,
          destinationId: destination.id,
          placeId,
          customLabel: null,
          categories: place.categories,
          addedBy: companion.id,
          alsoWantedBy: [],
        },
      ];
      newPlaceSelectionIds.push(id);
    }
  }

  for (const companion of state.joined) {
    const profile = findMockCompanion(companion.email);
    if (!profile) continue;
    for (const e of profile.expenses) {
      const id = `${MOCK_EXPENSE_PREFIX}${e.key}`;
      if (expenses.some((x) => x.id === id) || dismissed.has(mockExpenseKey(e.key))) continue;
      if (!e.requires.some((req) => requirementMet(req, state, selectedPlaces))) continue;
      const destination = state.destinations.find((d) => d.cityId === e.cityId);
      expenses = [
        ...expenses,
        {
          id,
          description: e.description,
          amount: e.amount,
          currencyCode: e.currencyCode,
          destinationId: destination?.id ?? null,
          category: e.category,
          paidBy: companion.id,
          splitWith: null,
          date: e.dateISO,
          attachments: [],
        },
      ];
      newExpenseIds.push(id);
    }
  }

  return { selectedPlaces, expenses, newPlaceSelectionIds: [...new Set(newPlaceSelectionIds)], newExpenseIds };
}

/** Quantos lugares da viagem esse membro quer (adicionou ou também quer). */
export function placesWantedBy(selectedPlaces: TripPlaceSelection[], memberId: string): number {
  return selectedPlaces.filter((s) => s.addedBy === memberId || s.alsoWantedBy.includes(memberId)).length;
}
