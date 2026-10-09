import {
  EXAMPLE_TRAVELERS,
  photosOfStop,
  travelerById,
  type ExamplePastTrip,
  type ExamplePhoto,
  type PastTripCity,
  type PastTripStop,
  type PastTripStopKind,
} from '../data/examplePastTrips';
import { haversineKm } from './geo';
import { daysBetween } from './itinerary';

export { haversineKm };

/** Soma das distâncias em linha reta, na ordem do roteiro. */
export function pathKm(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

export function allStops(trip: ExamplePastTrip): PastTripStop[] {
  return (trip.cities ?? []).flatMap((c) => c.stops);
}

/** Dias da viagem, inclusive (10/05 a 18/05 = 9 dias). */
export function tripDayCount(trip: ExamplePastTrip): number {
  return daysBetween(trip.startISO, trip.endISO);
}

/** Número do dia (1-based) de uma data dentro da viagem. */
export function dayNumberOf(trip: ExamplePastTrip, dayISO: string): number {
  return daysBetween(trip.startISO, dayISO);
}

/** Dias (ISO, em ordem) em que houve parada nessa cidade. */
export function cityDays(city: PastTripCity): string[] {
  return [...new Set(city.stops.map((s) => s.dayISO))].sort();
}

export function stopsByDay(city: PastTripCity): { dayISO: string; stops: PastTripStop[] }[] {
  return cityDays(city).map((dayISO) => ({ dayISO, stops: city.stops.filter((s) => s.dayISO === dayISO) }));
}

/** Dia com mais paradas na viagem toda (empate: o primeiro). */
export function busiestDay(trip: ExamplePastTrip): { dayISO: string; city: string; count: number } | null {
  let best: { dayISO: string; city: string; count: number } | null = null;
  for (const city of trip.cities ?? []) {
    for (const { dayISO, stops } of stopsByDay(city)) {
      if (!best || stops.length > best.count) best = { dayISO, city: city.city, count: stops.length };
    }
  }
  return best;
}

/** "1.234 km" / "18 km" — arredondado, nunca casa decimal (é estimativa em linha reta). */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString('pt-BR')} km`;
}

// ---------- tipos de item e custos (docs/ajustes-77-memoria-restaurantes-eventos-precos.md) ----------

export const STOP_KIND_LABEL: Record<PastTripStopKind, string> = {
  lugar: 'Lugar',
  restaurante: 'Restaurante',
  evento: 'Evento',
};

/** Rótulo do custo por tipo, no plural, pro resumo "Quanto custou". */
export const STOP_KIND_COST_LABEL: Record<PastTripStopKind, string> = {
  lugar: 'Passeios e ingressos',
  restaurante: 'Restaurantes',
  evento: 'Eventos',
};

export const STOP_KINDS: PastTripStopKind[] = ['lugar', 'restaurante', 'evento'];

/**
 * A recordação (stories) usa só os LUGARES — restaurantes e eventos ficam na
 * memória (tela da viagem passada), não na história (pedido da Adriana, ajustes-77).
 */
export function withPlacesOnly<T extends ExamplePastTrip & { cities: PastTripCity[] }>(trip: T): T {
  return { ...trip, cities: trip.cities.map((c) => ({ ...c, stops: c.stops.filter((s) => s.kind === 'lugar') })) };
}

export function countKind(stops: PastTripStop[], kind: PastTripStopKind): number {
  return stops.filter((s) => s.kind === kind).length;
}

export interface CostSummary {
  /** em EUR */
  total: number;
  byKind: { kind: PastTripStopKind; total: number; count: number }[];
  perPerson: number;
}

export function costSummary(stops: PastTripStop[], travelers: number): CostSummary {
  const total = stops.reduce((sum, s) => sum + s.cost, 0);
  const byKind = STOP_KINDS.map((kind) => {
    const list = stops.filter((s) => s.kind === kind);
    return { kind, total: list.reduce((sum, s) => sum + s.cost, 0), count: list.length };
  }).filter((k) => k.count > 0);
  return { total, byKind, perPerson: travelers > 0 ? total / travelers : total };
}

export function sumCost(stops: PastTripStop[]): number {
  return stops.reduce((sum, s) => sum + s.cost, 0);
}

// ---------- fotos do grupo nas paradas (docs/ajustes-78-... e ajustes-79-fotos-do-grupo-na-recordacao.md) ----------

/** Fotos de exemplo de uma cidade, na ordem do roteiro (dia → parada → foto 1, 2). */
export function photosOfCity(city: PastTripCity): ExamplePhoto[] {
  return city.stops.flatMap((s) => photosOfStop(s.id));
}

/** Nome curto: "você" pra quem está usando o app, primeiro nome pros outros. */
export function shortName(travelerId: string): string {
  if (travelerId === 'voce') return 'você';
  return travelerById(travelerId)?.name.split(' ')[0] ?? '';
}

/** "Camila e você" / "você, Camila e Bruno" — sem repetir; "você" no fim, ou no começo com `youFirst`. */
export function peopleLabel(travelerIds: string[], youFirst = false): string {
  const unique = new Set(travelerIds);
  const others = EXAMPLE_TRAVELERS.filter((t) => t.id !== 'voce' && unique.has(t.id)).map((t) => shortName(t.id));
  const names = unique.has('voce') ? (youFirst ? ['você', ...others] : [...others, 'você']) : others;
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** "Fotos de Camila e você" (embaixo das fotos da parada) / "Fotos de você, Camila e Bruno" (fecho da história). */
export function photosByLabel(travelerIds: string[], youFirst = false): string {
  return `Fotos de ${peopleLabel(travelerIds, youFirst)}`;
}

/**
 * Seleção sugerida ao abrir "Gerar recordação" (ajustes-79): até `max` fotos,
 * na ordem do roteiro, pegando a próxima foto ainda não marcada de uma pessoa
 * diferente da anterior — e, quando dá, de um lugar que ainda não entrou —, pra
 * a história já mostrar o grupo todo e o máximo de lugares.
 */
export function suggestedSelection(photos: ExamplePhoto[], max: number): string[] {
  const picked: ExamplePhoto[] = [];
  const usedStops = new Set<string>();
  let last: string | null = null;
  while (picked.length < Math.min(max, photos.length)) {
    const rest = photos.filter((p) => !picked.includes(p));
    const next =
      rest.find((p) => p.addedBy !== last && !usedStops.has(p.stopId)) ??
      rest.find((p) => !usedStops.has(p.stopId)) ??
      rest.find((p) => p.addedBy !== last) ??
      rest[0];
    picked.push(next);
    usedStops.add(next.stopId);
    last = next.addedBy;
  }
  return photos.filter((p) => picked.includes(p)).map((p) => p.id);
}
