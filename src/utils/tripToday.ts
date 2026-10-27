import type { TripDestination } from '../context/TripContext';
import { daysBetween, getTripEndISO, getTripStartISO, splitDaysByDestination } from './itinerary';

/**
 * Onde a viagem está "hoje" (ajustes-94, "Simular: durante a viagem"): cidade e número do dia,
 * pela mesma divisão de dias do Roteiro (o dia de fronteira é da cidade de chegada). null quando
 * não há data simulada ou ela cai fora da viagem.
 */
export interface TripToday {
  dateISO: string;
  /** índice do dia na viagem toda (0 = 1º dia) */
  globalDay: number;
  totalDays: number;
  destinationId: string;
  city: string;
  /** índice do dia dentro da cidade (pílula do Mapa) */
  localDay: number;
}

export function getTripToday(destinations: TripDestination[], todayISO: string | null): TripToday | null {
  const startISO = getTripStartISO(destinations);
  const endISO = getTripEndISO(destinations);
  if (!todayISO || !startISO || !endISO || todayISO < startISO || todayISO > endISO) return null;
  const globalDay = daysBetween(startISO, todayISO) - 1;
  const range = splitDaysByDestination(destinations).find((r) => r.globalDayIndexes.includes(globalDay));
  if (!range) return null;
  return {
    dateISO: todayISO,
    globalDay,
    totalDays: daysBetween(startISO, endISO),
    destinationId: range.destinationId,
    city: range.city,
    localDay: range.globalDayIndexes.indexOf(globalDay),
  };
}
