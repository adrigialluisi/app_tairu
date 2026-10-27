import { airportFromValue } from '../data';
import type { TransportItem, TripContextValue, TripDestination } from '../context/TripContext';
import { parseDisplayDateTime } from './agenda';

/*
  Atividade marcada quando o grupo já está (ou ainda está) viajando entre cidades (ajustes-94, item 6).
  Regra: no dia em que um voo, ônibus ou trem SAI da cidade A, evento, ingresso ou passeio da cidade
  A com horário DEPOIS da partida conflita; no dia em que ele CHEGA na cidade B, atividade de B com
  horário ANTES da chegada também. Atividade sem horário (e lugar pra visitar) não entra. É só aviso:
  a pessoa pode adicionar mesmo assim, e a Agenda do dia mostra o selo.
*/

type TripForConflicts = Pick<TripContextValue, 'transportItems' | 'destinations'>;

/** "voo" / "ônibus" / "trem" — todos masculinos: "o voo das 14:00" */
const MODE_NOUN: Record<Exclude<TransportItem['type'], 'carro-locado'>, string> = {
  voo: 'voo',
  onibus: 'ônibus',
  trem: 'trem',
};

interface Leg {
  mode: string;
  departure: { dateISO: string; time: string };
  arrival: { dateISO: string; time: string } | null;
  fromCityIds: string[];
  toCityIds: string[];
  /** cidade de destino como a pessoa conhece ("Santiago"): o destino da viagem, senão a do aeroporto */
  toLabel: string;
  fromLabel: string;
}

export interface ActivityConflict {
  /** texto do AlertDialog, sem a pergunta final */
  message: string;
  /** selo da Agenda do dia: "Conflita com o voo das 14:00" */
  agendaBadge: string;
  /** selo do cartão em "Eventos nas suas datas": "Depois do seu voo" */
  eventBadge: string;
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** cidades (ids) de onde sai/chega: o aeroporto escolhido na lista, senão o nome de um destino no texto */
function citiesOf(place: string, destinations: TripDestination[]): { ids: string[]; label: string } {
  const airport = airportFromValue(place);
  if (airport) {
    const ids = [airport.cityId, ...(airport.nearCityIds ?? [])].filter((id): id is string => Boolean(id));
    const tripCity = destinations.find((d) => ids.includes(d.cityId));
    return { ids, label: tripCity?.city ?? airport.city };
  }
  const text = normalize(place);
  const matches = destinations.filter((d) => text.includes(normalize(d.city)));
  return { ids: matches.map((d) => d.cityId), label: matches[0]?.city ?? place.split(/[–(-]/)[0].trim() };
}

function legsOf(trip: TripForConflicts): Leg[] {
  const legs: Leg[] = [];
  for (const t of trip.transportItems) {
    if (t.type === 'carro-locado') continue;
    const departure = parseDisplayDateTime(t.departureAt);
    if (!departure?.time) continue;
    const arrival = parseDisplayDateTime(t.arrivalAt);
    const from = citiesOf(t.origin, trip.destinations);
    const to = citiesOf(t.destination, trip.destinations);
    legs.push({
      mode: MODE_NOUN[t.type],
      departure,
      arrival: arrival?.time ? arrival : null,
      fromCityIds: from.ids,
      toCityIds: to.ids,
      fromLabel: from.label,
      toLabel: to.label,
    });
  }
  return legs;
}

/** null = sem conflito (ou atividade sem cidade, data ou horário) */
export function activityConflict(
  trip: TripForConflicts,
  activity: { cityId: string | null; dateISO: string | null; time: string },
): ActivityConflict | null {
  const { cityId, dateISO, time } = activity;
  if (!cityId || !dateISO || !/^\d{2}:\d{2}$/.test(time)) return null;
  for (const leg of legsOf(trip)) {
    if (leg.departure.dateISO === dateISO && leg.fromCityIds.includes(cityId) && time > leg.departure.time) {
      return {
        message: `Nesse horário vocês já vão estar a caminho de ${leg.toLabel} (${leg.mode} às ${leg.departure.time}).`,
        agendaBadge: `Conflita com o ${leg.mode} das ${leg.departure.time}`,
        eventBadge: `Depois do seu ${leg.mode}`,
      };
    }
    if (leg.arrival && leg.arrival.dateISO === dateISO && leg.toCityIds.includes(cityId) && time < leg.arrival.time) {
      return {
        message: `Nesse horário vocês ainda vão estar a caminho de ${leg.toLabel} (${leg.mode} chega às ${leg.arrival.time}).`,
        agendaBadge: `Conflita com o ${leg.mode} das ${leg.departure.time}`,
        eventBadge: `Antes do seu ${leg.mode} chegar`,
      };
    }
  }
  return null;
}

/** primeiro hh:mm de um texto de horário ("19:00–23:00" → "19:00"; "a partir das 20:00" → "20:00") */
export function firstTime(text: string): string {
  const m = text.match(/(\d{1,2}):(\d{2})/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return '';
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}
