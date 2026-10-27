import type { ItineraryOverride, TripContextValue, TripDestination, TripPlaceSelection } from '../context/TripContext';
import { getHotel, getPlaceById } from '../data';
import { parseDisplayDateTime } from './agenda';
import { fromISODate, toISODate } from './dateMask';
import { computeProximityDays, type ProximityOptions } from './proximityDays';

export interface DestinationDayRange {
  destinationId: string;
  cityId: string;
  city: string;
  /** dias globais (0-based, relativos ao início da viagem) que pertencem a esse destino, em ordem */
  globalDayIndexes: number[];
}

function toMs(iso: string): number {
  const { day, month, year } = fromISODate(iso);
  return new Date(year, month - 1, day).getTime();
}

function msToISO(ms: number): string {
  const date = new Date(ms);
  return toISODate({ day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() });
}

/** Menor dateStart entre os destinos com data de início preenchida, ou null se nenhum tiver. */
export function getTripStartISO(destinations: TripDestination[]): string | null {
  const withStart = destinations.filter((d) => d.dateStart);
  if (withStart.length === 0) return null;
  return withStart.reduce(
    (earliest, d) => (toMs(d.dateStart!) < toMs(earliest) ? d.dateStart! : earliest),
    withStart[0].dateStart!,
  );
}

/** Maior dateEnd entre os destinos com data de fim preenchida, ou null se nenhum tiver. */
export function getTripEndISO(destinations: TripDestination[]): string | null {
  const withDates = destinations.filter((d) => d.dateEnd);
  if (withDates.length === 0) return null;
  return msToISO(Math.max(...withDates.map((d) => toMs(d.dateEnd as string))));
}

/**
 * Cada destino tem suas próprias datas (Tela 1) — em vez de calcular um
 * intervalo contíguo por destino, percorre dia a dia e decide de quem é
 * cada dia. Isso resolve datas se TOCANDO (fim de um destino == início do
 * outro, permitido — ver docs/tela-01-criar-viagem.md) sem duplicar nem
 * perder nenhum dia no Roteiro: um dia de fronteira pertence a quem CHEGA
 * (dateStart mais tardio entre os que bateram naquele dia), não a quem
 * está saindo.
 */
export function splitDaysByDestination(destinations: TripDestination[]): DestinationDayRange[] {
  const withDates = destinations.filter((d) => d.dateStart && d.dateEnd);
  if (withDates.length === 0) return [];

  const tripStartISO = getTripStartISO(destinations)!;
  const tripStartMs = toMs(tripStartISO);
  const tripEndMs = Math.max(...withDates.map((d) => toMs(d.dateEnd!)));
  const totalDays = Math.round((tripEndMs - tripStartMs) / 86_400_000) + 1;

  const byDestination = new Map<string, number[]>(withDates.map((d) => [d.id, []]));

  for (let globalDay = 0; globalDay < totalDays; globalDay++) {
    const dayMs = tripStartMs + globalDay * 86_400_000;
    // destinos cujo intervalo [dateStart, dateEnd] contém esse dia
    const matches = withDates.filter((d) => toMs(d.dateStart!) <= dayMs && dayMs <= toMs(d.dateEnd!));
    if (matches.length === 0) continue; // dia livre — nenhum destino reivindica, não entra em nenhuma lista

    const owner = matches.reduce((latest, d) => (toMs(d.dateStart!) > toMs(latest.dateStart!) ? d : latest));
    byDestination.get(owner.id)!.push(globalDay);
  }

  return withDates.map((d) => ({
    destinationId: d.id,
    cityId: d.cityId,
    city: d.city,
    globalDayIndexes: byDestination.get(d.id)!,
  }));
}

/** 0 = domingo … 6 = sábado */
export function weekdayOfISO(iso: string): number {
  return new Date(toMs(iso)).getDay();
}

/** Total de dias entre duas datas ISO, inclusive nas duas pontas. */
export function daysBetween(startISO: string, endISO: string): number {
  return Math.round((toMs(endISO) - toMs(startISO)) / 86_400_000) + 1;
}

export function globalDayToISO(tripStartISO: string, globalDayIndex: number): string {
  const start = fromISODate(tripStartISO);
  const date = new Date(start.year, start.month - 1, start.day);
  date.setDate(date.getDate() + globalDayIndex);
  return toISODate({ day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() });
}

export interface ItineraryItemAssignment {
  place: TripPlaceSelection;
  /** dia local (0-based) dentro do bloco de dias desse destino */
  localDayIndex: number;
  /**
   * true se o dia foi escolhido pela pessoa (ajustes-97: "Adicionar lugares" com dia, "Mudar de dia")
   * ou congelado pelo "Pulei" — a divisão por proximidade não mexe nele
   */
  pinned: boolean;
  skipped: boolean;
}

export { computeProximityDays, type ProximityItem, type ProximityOptions } from './proximityDays';

type TripForProximity = Pick<TripContextValue, 'destinations' | 'transportItems' | 'stayItems'>;

/**
 * Opções da divisão de um destino: as da proximidade + a data de cada dia local, pra converter o
 * `pinnedDayISO` do lugar fixado (ajustes-97) no dia do destino.
 */
export type ItineraryOptions = ProximityOptions & { dayISOs?: string[] };

/**
 * O que a divisão por proximidade precisa saber da Central pra um destino (ajustes-88):
 * - dias de deslocamento: dia (local) com voo, ônibus ou trem saindo ou chegando — fica mais leve;
 * - de onde o dia começa: o hotel do destino, quando é um da base com coordenada (hotels.json).
 */
export function proximityOptionsFor(trip: TripForProximity, destinationId: string): ItineraryOptions {
  const range = splitDaysByDestination(trip.destinations).find((r) => r.destinationId === destinationId);
  const tripStartISO = getTripStartISO(trip.destinations);
  const travelDates = new Set<string>();
  for (const t of trip.transportItems) {
    if (t.type === 'carro-locado') continue;
    for (const value of [t.departureAt, t.arrivalAt]) {
      const parsed = parseDisplayDateTime(value);
      if (parsed) travelDates.add(parsed.dateISO);
    }
  }
  const dayISOs = range && tripStartISO ? range.globalDayIndexes.map((g) => globalDayToISO(tripStartISO, g)) : [];
  const lightDays = dayISOs.map((iso, local) => (travelDates.has(iso) ? local : -1)).filter((d) => d >= 0);
  const hotel = trip.stayItems
    .filter((st) => st.destinationId === destinationId && st.hotelId)
    .map((st) => getHotel(st.hotelId))
    .find((h) => typeof h?.lat === 'number' && typeof h?.lng === 'number');
  // dia da semana de cada dia do destino, pros lugares que só abrem em alguns dias (ajustes-95)
  const weekdays = dayISOs.length > 0 ? dayISOs.map((iso) => weekdayOfISO(iso)) : undefined;
  return { lightDays, start: hotel ? { lat: hotel.lat!, lng: hotel.lng! } : null, weekdays, dayISOs };
}

/**
 * Parada da participante: ela adicionou ou tocou "+" / "Eu também" (ajustes-95b). Lugar escolhido
 * SÓ por convidado é "plano do grupo": não entra na divisão de dias, no mapa, na Agenda nem na
 * contagem dela — aparece no Roteiro só como referência (bloco "Planos do grupo", ver groupPlansByDay).
 */
export function isMyPlace(selection: TripPlaceSelection): boolean {
  return selection.addedBy === 'voce' || selection.alsoWantedBy.includes('voce');
}

/** coordenada da seleção: a do places.json ou, lugar do OpenStreetMap (ajustes-97), a dela */
export function selectionCoords(selection: TripPlaceSelection): { lat: number; lng: number } | null {
  const place = selection.placeId ? getPlaceById(selection.placeId) : undefined;
  if (place) return { lat: place.lat, lng: place.lng };
  if (typeof selection.lat === 'number' && typeof selection.lng === 'number') {
    return { lat: selection.lat, lng: selection.lng };
  }
  return null;
}

function toProximityItem(p: TripPlaceSelection, fixedDay?: number) {
  const place = p.placeId ? getPlaceById(p.placeId) : undefined;
  const coords = selectionCoords(p);
  return {
    id: p.id,
    lat: coords?.lat,
    lng: coords?.lng,
    meal: !!place?.categories.includes('gastronomia') || p.category === 'gastronomia',
    openDays: place?.openDays,
    ...(fixedDay !== undefined ? { fixedDay } : {}),
  };
}

/**
 * Dia que a PESSOA escolheu pra parada (ajustes-97), ou undefined (o app escolhe): o "Mudar de dia"
 * (override) vale mais que o dia escolhido ao adicionar (pinnedDayISO), por ser o mais recente.
 */
function chosenDay(
  p: TripPlaceSelection,
  override: ItineraryOverride | undefined,
  dayCount: number,
  dayISOs: string[] | undefined,
): number | undefined {
  if (dayCount <= 0) return undefined;
  if (override) return Math.min(Math.max(override.dayIndex, 0), dayCount - 1);
  if (p.pinnedDayISO && dayISOs) {
    const index = dayISOs.indexOf(p.pinnedDayISO);
    if (index >= 0) return index;
  }
  return undefined;
}

/**
 * Divisão dos dias de um destino: paradas da participante que não estão puladas, as fixadas com o
 * dia delas (`fixedDay`) e as outras por proximidade, em volta das fixadas.
 */
function destinationProximityDays(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  options: ItineraryOptions,
  extra: TripPlaceSelection[] = [],
): Map<string, { day: number; order: number }> {
  const overrideMap = new Map(overrides.map((o) => [o.placeSelectionId, o]));
  const mine = selectedPlaces.filter(
    (p) => p.destinationId === destinationId && isMyPlace(p) && !overrideMap.get(p.id)?.skipped,
  );
  const items = [...mine, ...extra].map((p) =>
    toProximityItem(p, chosenDay(p, overrideMap.get(p.id), dayCount, options.dayISOs)),
  );
  return computeProximityDays(items, dayCount, options);
}

/**
 * Planos do grupo de um destino (ajustes-95b), cada um no dia sugerido: o dia em que ele cairia pela
 * proximidade se a participante tocasse "+" agora (as paradas dela + ele). Sem dia calculável, o
 * primeiro dia da cidade. Mapa dia local → planos, na ordem em que foram escolhidos.
 */
export function groupPlansByDay(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  options: ItineraryOptions = {},
): Map<number, TripPlaceSelection[]> {
  const byDay = new Map<number, TripPlaceSelection[]>();
  if (dayCount <= 0) return byDay;
  const plans = selectedPlaces.filter((p) => p.destinationId === destinationId && !isMyPlace(p));
  for (const plan of plans) {
    const days = destinationProximityDays(destinationId, dayCount, selectedPlaces, overrides, options, [plan]);
    const day = Math.min(Math.max(days.get(plan.id)?.day ?? 0, 0), dayCount - 1);
    byDay.set(day, [...(byDay.get(day) ?? []), plan]);
  }
  return byDay;
}

/**
 * Só as paradas da participante (isMyPlace, ajustes-95b): os planos do grupo ficam de fora.
 * Distribuídas nos dias do destino por PROXIMIDADE (`computeProximityDays`, ajustes-80, algoritmo
 * trocado no ajustes-88): o que fica perto cai no mesmo dia, e a ordem dentro do dia segue a rota.
 * Desde o ajustes-97, parada com dia escolhido pela pessoa (pinnedDayISO ao adicionar, ou "Mudar de
 * dia") entra FIXADA no dia dela e na rota desse dia; as outras se organizam em volta. Parada pulada
 * fica no dia "congelado" no momento do "Pulei" (TripContext.toggleItinerarySkipped), no fim do dia.
 * As assignments saem na ordem dia → rota, então "Parada 1, 2…" segue a rota.
 */
export function computeDestinationAssignments(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  /** dias de deslocamento, hotel e datas (proximityOptionsFor) — o mesmo em todo lugar que calcula, senão o "pulei" congela o dia errado */
  options: ItineraryOptions = {},
): ItineraryItemAssignment[] {
  const items = selectedPlaces.filter((p) => p.destinationId === destinationId && isMyPlace(p));
  const overrideMap = new Map(overrides.map((o) => [o.placeSelectionId, o]));
  const days = destinationProximityDays(destinationId, dayCount, selectedPlaces, overrides, options);
  const clamp = (d: number) => (dayCount > 0 ? Math.min(Math.max(d, 0), dayCount - 1) : 0);

  const active = items.filter((p) => !overrideMap.get(p.id)?.skipped);
  const assignments: ItineraryItemAssignment[] = [...active]
    .sort((a, b) => {
      const da = days.get(a.id)!;
      const db = days.get(b.id)!;
      return da.day - db.day || da.order - db.order;
    })
    .map((place) => ({
      place,
      localDayIndex: clamp(days.get(place.id)!.day),
      pinned: chosenDay(place, overrideMap.get(place.id), dayCount, options.dayISOs) !== undefined,
      skipped: false,
    }));

  for (const place of items.filter((p) => overrideMap.get(p.id)?.skipped)) {
    assignments.push({ place, localDayIndex: clamp(overrideMap.get(place.id)!.dayIndex), pinned: true, skipped: true });
  }

  return assignments;
}

/**
 * Dia local em que um item está agora pela divisão — usado pra "congelar" a posição de um item na
 * primeira vez que ele é marcado como pulado. Usa a MESMA divisão (e as mesmas opções) de
 * computeDestinationAssignments, senão o "pulei" congelaria o dia errado.
 */
export function computeUnpinnedLocalDay(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  placeSelectionId: string,
  options: ItineraryOptions = {},
): number {
  const days = destinationProximityDays(destinationId, dayCount, selectedPlaces, overrides, options);
  const entry = days.get(placeSelectionId);
  if (!entry) return 0;
  return dayCount > 0 ? entry.day : 0;
}
