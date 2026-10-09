import type { ItineraryOverride, TripDestination, TripPlaceSelection } from '../context/TripContext';
import { getPlaceById } from '../data';
import { fromISODate, toISODate } from './dateMask';
import { haversineKm } from './geo';

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

export interface ProximityItem {
  id: string;
  lat?: number | null;
  lng?: number | null;
}

type Located = ProximityItem & { lat: number; lng: number };

function hasCoords(item: ProximityItem): item is Located {
  return typeof item.lat === 'number' && typeof item.lng === 'number';
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Distribui itens nos dias por PROXIMIDADE (docs/ajustes-80-...md, seção 1),
 * de forma determinística (mesma entrada → mesmo resultado):
 * 1. monta uma rota pelo vizinho mais próximo, começando pelo lugar mais ao
 *    norte (empate: mais a oeste); item sem coordenada vai pro fim;
 * 2. corta a rota em `dayCount` pedaços seguidos, do tamanho mais igual
 *    possível (os primeiros dias ficam com 1 a mais quando não divide certinho);
 * 3. se perto de um corte (±1 item) houver um salto > 2× a mediana dos saltos
 *    da rota, corta ali — assim um bairro não é partido no meio só pra equilibrar.
 * A ordem dentro do dia é a ordem da rota.
 */
export function computeProximityDays(items: ProximityItem[], dayCount: number): Map<string, { day: number; order: number }> {
  const result = new Map<string, { day: number; order: number }>();
  if (items.length === 0) return result;

  // 1. rota pelo vizinho mais próximo
  const remaining = items.filter(hasCoords);
  const route: ProximityItem[] = [];
  if (remaining.length > 0) {
    let current = remaining.reduce((best, p) =>
      p.lat > best.lat || (p.lat === best.lat && p.lng < best.lng) ? p : best,
    );
    remaining.splice(remaining.indexOf(current), 1);
    route.push(current);
    while (remaining.length > 0) {
      const from = current;
      // empate de distância: o que veio primeiro na lista (reduce mantém o primeiro)
      current = remaining.reduce((best, p) => (haversineKm(from, p) < haversineKm(from, best) ? p : best));
      remaining.splice(remaining.indexOf(current), 1);
      route.push(current);
    }
  }
  route.push(...items.filter((p) => !hasCoords(p)));

  // 2. pontos de corte com tamanhos iguais (corte em c = entre route[c-1] e route[c])
  const days = Math.max(1, dayCount);
  const n = route.length;
  const cuts: number[] = [];
  let acc = 0;
  for (let d = 0; d < days - 1; d++) {
    acc += Math.floor(n / days) + (d < n % days ? 1 : 0);
    cuts.push(acc);
  }

  // 3. ajuste ±1 pra cortar num salto grande (só quando todo dia tem pelo menos 2 itens)
  const gap = (c: number): number | null => {
    const a = route[c - 1];
    const b = route[c];
    return a && b && hasCoords(a) && hasCoords(b) ? haversineKm(a, b) : null;
  };
  const gaps = Array.from({ length: n - 1 }, (_, i) => gap(i + 1)).filter((g): g is number => g !== null);
  const threshold = 2 * median(gaps);
  if (n >= days * 2 && threshold > 0) {
    for (let k = 0; k < cuts.length; k++) {
      const min = (k === 0 ? 0 : cuts[k - 1]) + 1;
      const max = (k === cuts.length - 1 ? n : cuts[k + 1]) - 1;
      let best = cuts[k];
      let bestGap = threshold;
      for (const c of [cuts[k], cuts[k] - 1, cuts[k] + 1]) {
        const g = c >= min && c <= max ? gap(c) : null;
        if (g !== null && g > bestGap) {
          best = c;
          bestGap = g;
        }
      }
      cuts[k] = best;
    }
  }

  let day = 0;
  let order = 0;
  route.forEach((item, i) => {
    while (day < cuts.length && i >= cuts[day]) {
      day++;
      order = 0;
    }
    result.set(item.id, { day, order: order++ });
  });
  return result;
}

/** Itens sem override do destino, com a coordenada do lugar (lugar adicionado à mão não tem). */
function unpinnedProximityDays(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrideIds: Set<string>,
): { unpinned: TripPlaceSelection[]; days: Map<string, { day: number; order: number }> } {
  const unpinned = selectedPlaces.filter((p) => p.destinationId === destinationId && !overrideIds.has(p.id));
  const days = computeProximityDays(
    unpinned.map((p) => {
      const place = p.placeId ? getPlaceById(p.placeId) : undefined;
      return { id: p.id, lat: place?.lat, lng: place?.lng };
    }),
    dayCount,
  );
  return { unpinned, days };
}

/**
 * Itens sem override (nunca movidos nem pulados) são distribuídos nos dias do
 * destino por PROXIMIDADE (`computeProximityDays`, ajustes-80 — substitui o
 * round-robin na ordem em que foram marcados): o que fica perto cai no mesmo
 * dia, e a ordem dentro do dia segue a rota. As assignments saem nessa ordem
 * (dia → ordem da rota), então "Parada 1, 2…" segue a rota. Itens com override
 * ficam fixos no dia que o override diz — isso inclui itens pulados, cujo dia
 * foi "congelado" no momento em que a pessoa marcou "pulei" (ver
 * TripContext.toggleItinerarySkipped) — e entram depois dos da rota. Como saem
 * do cálculo, os outros são redistribuídos sozinhos.
 */
export function computeDestinationAssignments(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
): ItineraryItemAssignment[] {
  const items = selectedPlaces.filter((p) => p.destinationId === destinationId);
  const overrideMap = new Map(overrides.map((o) => [o.placeSelectionId, o]));
  const { unpinned, days } = unpinnedProximityDays(destinationId, dayCount, selectedPlaces, new Set(overrideMap.keys()));
  const pinned = items.filter((p) => overrideMap.has(p.id));

  const assignments: ItineraryItemAssignment[] = [...unpinned]
    .sort((a, b) => {
      const da = days.get(a.id)!;
      const db = days.get(b.id)!;
      return da.day - db.day || da.order - db.order;
    })
    .map((place) => ({
      place,
      localDayIndex: dayCount > 0 ? days.get(place.id)!.day : 0,
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
 * pulado (sem nunca ter sido movido manualmente antes). Usa a MESMA
 * distribuição por proximidade de computeDestinationAssignments, senão o
 * "pulei" congelaria o dia errado.
 */
export function computeUnpinnedLocalDay(
  destinationId: string,
  dayCount: number,
  selectedPlaces: TripPlaceSelection[],
  overrides: ItineraryOverride[],
  placeSelectionId: string,
): number {
  const overrideIds = new Set(overrides.map((o) => o.placeSelectionId));
  const { days } = unpinnedProximityDays(destinationId, dayCount, selectedPlaces, overrideIds);
  const entry = days.get(placeSelectionId);
  if (!entry) return 0;
  return dayCount > 0 ? entry.day : 0;
}
