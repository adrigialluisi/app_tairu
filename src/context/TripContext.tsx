import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { computeUnpinnedLocalDay, splitDaysByDestination } from '../utils/itinerary';

export interface TripDestination {
  /** id único desta seleção (permite o mesmo destino em teoria, cada chip é independente) */
  id: string;
  cityId: string;
  city: string;
  country: string;
  currencyCode: string;
  /** estadia nesse destino específico — não existe mais data solta de nível viagem */
  dateStart: string | null;
  dateEnd: string | null;
}

export interface TripCompanion {
  id: string;
  email: string;
  /** único status real possível sem backend — nunca simular "aceito" */
  status: 'convite-enviado';
}

export interface TripPlaceSelection {
  id: string;
  /** TripDestination.id — por destino da viagem, não por cidade genérica */
  destinationId: string;
  /** referência a places.json, ou null se for customLabel */
  placeId: string | null;
  /** preenchido só quando placeId é null */
  customLabel: string | null;
  /** copiado do places.json no momento da seleção, ou [] se customLabel */
  categories: string[];
}

export interface ItineraryOverride {
  placeSelectionId: string;
  /** índice do dia dentro da cidade daquele lugar (0-based) */
  dayIndex: number;
  skipped: boolean;
}

export type TransportType = 'voo' | 'onibus' | 'carro-locado';

interface TransportItemBase {
  id: string;
  /** TripDestination.id — a qual trecho da viagem esse transporte pertence */
  destinationId: string;
  /** nunca exibido no card/resumo — só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  /** preparado pra Fase 3 (upload de voucher) — sempre null nessa fase */
  voucherFileName: string | null;
}

export interface FlightTransportItem extends TransportItemBase {
  type: 'voo';
  company: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
}

export interface BusTransportItem extends TransportItemBase {
  type: 'onibus';
  company: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
}

export interface CarRentalTransportItem extends TransportItemBase {
  type: 'carro-locado';
  company: string;
  vehicleCategory: string;
  pickupLocation: string;
  pickupAt: string;
  dropoffLocation: string;
  dropoffAt: string;
}

export type TransportItem = FlightTransportItem | BusTransportItem | CarRentalTransportItem;

export type QuizDiscovery = 'turistico' | 'equilibrado' | 'fora-do-circuito';
export type QuizRhythm = 'tranquilo' | 'moderado' | 'corrido';
export type QuizBudget = 'economico' | 'moderado' | 'confortavel';
export type QuizInterest = 'gastronomia' | 'cultura' | 'natureza' | 'vida-noturna' | 'compras';
export type QuizKnowsDestination = 'sim' | 'nao';
export type QuizCompanionType = 'sozinho' | 'casal' | 'amigos' | 'familia-criancas';

export interface QuizAnswers {
  /** múltipla escolha desde 11/set/2026 — ver docs/ajustes-18-pace-multi-select.md */
  discovery: QuizDiscovery[];
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  companionType: QuizCompanionType | null;
  /** voltaram a ser gerais da viagem em 10/set/2026 — ver docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md */
  interests: QuizInterest[];
  knowsDestination: QuizKnowsDestination | null;
}

interface TripState {
  name: string;
  destinations: TripDestination[];
  companions: TripCompanion[];
  quiz: QuizAnswers;
  selectedPlaces: TripPlaceSelection[];
  itineraryOverrides: ItineraryOverride[];
  destinosSaved: boolean;
  perfilSaved: boolean;
  transportItems: TransportItem[];
}

export interface TripContextValue extends TripState {
  setName: (name: string) => void;
  addDestination: (destination: Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>) => void;
  removeDestination: (id: string) => void;
  setDestinationCurrency: (id: string, currencyCode: string) => void;
  setDestinationDateRange: (id: string, start: string | null, end: string | null) => void;
  addCompanion: (email: string) => void;
  removeCompanion: (id: string) => void;
  setQuizAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  toggleQuizDiscovery: (discovery: QuizDiscovery) => void;
  toggleQuizInterest: (interest: QuizInterest) => void;
  togglePlace: (destinationId: string, place: { placeId: string; categories: string[] }) => void;
  addCustomPlace: (destinationId: string, label: string) => void;
  removeSelectedPlace: (id: string) => void;
  moveItineraryItem: (placeSelectionId: string, newDayIndex: number) => void;
  toggleItinerarySkipped: (placeSelectionId: string) => void;
  setDestinosSaved: (value: boolean) => void;
  setPerfilSaved: (value: boolean) => void;
  saveTransportItem: (item: TransportItem) => void;
  removeTransportItem: (id: string) => void;
  resetTrip: () => void;
}

const initialQuiz: QuizAnswers = {
  discovery: [],
  rhythm: null,
  budget: null,
  companionType: null,
  interests: [],
  knowsDestination: null,
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [companions, setCompanions] = useState<TripCompanion[]>([]);
  const [quiz, setQuiz] = useState<QuizAnswers>(initialQuiz);
  const [selectedPlaces, setSelectedPlaces] = useState<TripPlaceSelection[]>([]);
  const [itineraryOverrides, setItineraryOverrides] = useState<ItineraryOverride[]>([]);
  const [destinosSaved, setDestinosSaved] = useState(false);
  const [perfilSaved, setPerfilSaved] = useState(false);
  const [transportItems, setTransportItems] = useState<TransportItem[]>([]);

  const value = useMemo<TripContextValue>(
    () => ({
      name,
      destinations,
      companions,
      quiz,
      selectedPlaces,
      itineraryOverrides,
      destinosSaved,
      perfilSaved,
      transportItems,
      setName,
      addDestination: (destination) =>
        setDestinations((prev) => [
          ...prev,
          {
            ...destination,
            id: `${destination.cityId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dateStart: null,
            dateEnd: null,
          },
        ]),
      removeDestination: (id) => setDestinations((prev) => prev.filter((d) => d.id !== id)),
      setDestinationCurrency: (id, currencyCode) =>
        setDestinations((prev) => prev.map((d) => (d.id === id ? { ...d, currencyCode } : d))),
      setDestinationDateRange: (id, start, end) =>
        setDestinations((prev) => prev.map((d) => (d.id === id ? { ...d, dateStart: start, dateEnd: end } : d))),
      addCompanion: (email) =>
        setCompanions((prev) => [
          ...prev,
          { id: `${email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, email, status: 'convite-enviado' },
        ]),
      removeCompanion: (id) => setCompanions((prev) => prev.filter((c) => c.id !== id)),
      setQuizAnswer: (key, value) => setQuiz((prev) => ({ ...prev, [key]: value })),
      toggleQuizDiscovery: (discovery) =>
        setQuiz((prev) => ({
          ...prev,
          discovery: prev.discovery.includes(discovery)
            ? prev.discovery.filter((d) => d !== discovery)
            : [...prev.discovery, discovery],
        })),
      toggleQuizInterest: (interest) =>
        setQuiz((prev) => ({
          ...prev,
          interests: prev.interests.includes(interest)
            ? prev.interests.filter((i) => i !== interest)
            : [...prev.interests, interest],
        })),
      togglePlace: (destinationId, place) =>
        setSelectedPlaces((prev) => {
          const existing = prev.find((s) => s.destinationId === destinationId && s.placeId === place.placeId);
          if (existing) return prev.filter((s) => s.id !== existing.id);
          return [
            ...prev,
            {
              id: `${place.placeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              destinationId,
              placeId: place.placeId,
              customLabel: null,
              categories: place.categories,
            },
          ];
        }),
      addCustomPlace: (destinationId, label) =>
        setSelectedPlaces((prev) => [
          ...prev,
          {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            destinationId,
            placeId: null,
            customLabel: label,
            categories: [],
          },
        ]),
      removeSelectedPlace: (id) => setSelectedPlaces((prev) => prev.filter((s) => s.id !== id)),
      moveItineraryItem: (placeSelectionId, newDayIndex) =>
        setItineraryOverrides((prev) => {
          const existing = prev.find((o) => o.placeSelectionId === placeSelectionId);
          if (existing) {
            return prev.map((o) => (o.placeSelectionId === placeSelectionId ? { ...o, dayIndex: newDayIndex } : o));
          }
          return [...prev, { placeSelectionId, dayIndex: newDayIndex, skipped: false }];
        }),
      toggleItinerarySkipped: (placeSelectionId) =>
        setItineraryOverrides((prev) => {
          const existing = prev.find((o) => o.placeSelectionId === placeSelectionId);
          if (existing) {
            return prev.map((o) =>
              o.placeSelectionId === placeSelectionId ? { ...o, skipped: !o.skipped } : o,
            );
          }
          // Primeira vez mexendo nesse item (nunca foi movido manualmente):
          // "congela" o dia atual calculado por round-robin, pra marcar como
          // pulado sem o item pular de posição visualmente.
          const place = selectedPlaces.find((s) => s.id === placeSelectionId);
          if (!place) {
            return [...prev, { placeSelectionId, dayIndex: 0, skipped: true }];
          }
          const ranges = splitDaysByDestination(destinations);
          const range = ranges.find((r) => r.destinationId === place.destinationId);
          const dayCount = range?.globalDayIndexes.length ?? 1;
          const currentDay = computeUnpinnedLocalDay(place.destinationId, dayCount, selectedPlaces, prev, placeSelectionId);
          return [...prev, { placeSelectionId, dayIndex: currentDay, skipped: true }];
        }),
      setDestinosSaved,
      setPerfilSaved,
      saveTransportItem: (item) =>
        setTransportItems((prev) => {
          const exists = prev.some((t) => t.id === item.id);
          return exists ? prev.map((t) => (t.id === item.id ? item : t)) : [...prev, item];
        }),
      removeTransportItem: (id) => setTransportItems((prev) => prev.filter((t) => t.id !== id)),
      resetTrip: () => {
        setName('');
        setDestinations([]);
        setCompanions([]);
        setQuiz(initialQuiz);
        setSelectedPlaces([]);
        setItineraryOverrides([]);
        setDestinosSaved(false);
        setPerfilSaved(false);
        setTransportItems([]);
      },
    }),
    [
      name,
      destinations,
      companions,
      quiz,
      selectedPlaces,
      itineraryOverrides,
      destinosSaved,
      perfilSaved,
      transportItems,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip precisa estar dentro de <TripProvider>');
  return ctx;
}
