import type { ItineraryOverride, TripDestination, TripPlaceSelection } from '../context/TripContext';
import { fromISODate, toISODate } from './dateMask';

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
  /** true se a posição veio de um override manual (mover ou pular) */
  pinned: boolean;
  skipped: boolean;
}

/**
 * Itens sem override (nunca movidos nem pulados) são distribuídos por
 * round-robin, na ordem em que foram marcados na Tela 4a, entre os dias do
 * destino. Itens com override ficam fixos no dia que o override diz — isso
 * inclui itens pulados, cujo dia foi "congelado" no momento em que a pessoa
 * marcou "pulei" (ver TripContext.toggleItinerarySkipped). Como itens com
 * override saem do cálculo de round-robin, os itens seguintes (ainda sem
 * override) naturalmente sobem uma posição — sem precisar de lógica extra
 * de "empurrar" nada.
 */
export function computeDestinationAssignments(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
): ItineraryItemAssignment[] {
  const items = selectedPlaces.filter((p) => p.destinationId === destinationId);
  const overrideMap = new Map(overrides.map((o) => [o.placeSelectionId, o]));

  const unpinned = items.filter((p) => !overrideMap.has(p.id));
  const pinned = items.filter((p) => overrideMap.has(p.id));

  const assignments: ItineraryItemAssignment[] = unpinned.map((place, index) => ({
    place,
    localDayIndex: dayCount > 0 ? index % dayCount : 0,
    pinned: false,
    skipped: false,
  }));

  for (const place of pinned) {
    const override = overrideMap.get(place.id)!;
    const localDayIndex = dayCount > 0 ? Math.min(Math.max(override.dayIndex, 0), dayCount - 1) : 0;
    assignments.push({ place, localDayIndex, pinned: true, skipped: override.skipped });
  }

  return assignments;
}

/**
 * Dia local que um item teria SE não tivesse override — usado só pra
 * "congelar" a posição de um item na primeira vez que ele é marcado como
 * pulado (sem nunca ter sido movido manualmente antes).
 */
export function computeUnpinnedLocalDay(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  placeSelectionId: string,
): number {
  const items = selectedPlaces.filter((p) => p.destinationId === destinationId);
  const overrideMap = new Map(overrides.map((o) => [o.placeSelectionId, o]));
  const unpinned = items.filter((p) => !overrideMap.has(p.id));
  const index = unpinned.findIndex((p) => p.id === placeSelectionId);
  if (index === -1) return 0;
  return dayCount > 0 ? index % dayCount : 0;
}
