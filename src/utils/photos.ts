import { getEventById, getPlaceById } from '../data';
import type { TripContextValue, TripDestination, TripPhoto } from '../context/TripContext';
import {
  computeDestinationAssignments,
  daysBetween,
  getTripEndISO,
  getTripStartISO,
  globalDayToISO,
  splitDaysByDestination,
} from './itinerary';

/**
 * Memórias → Fotos (docs/ajustes-64-memorias-fotos.md). Tag automática =
 * dia da viagem + cidade, a partir da data do arquivo (`lastModified`, o
 * protótipo não lê EXIF). Nunca inventa o dia: fora da viagem → null, e a
 * tela pergunta.
 */

/** data local do arquivo (lastModified) em ISO yyyy-mm-dd */
export function fileDateToISO(lastModified: number): string {
  const d = new Date(lastModified);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** dayISO automático: a data do arquivo, se estiver dentro das datas da viagem; senão null */
export function autoDayForDate(
  fileDateISO: string,
  tripStartISO: string | null,
  tripEndISO: string | null,
): string | null {
  if (!tripStartISO || !tripEndISO) return null;
  return fileDateISO >= tripStartISO && fileDateISO <= tripEndISO ? fileDateISO : null;
}

/** Todos os dias da viagem, em ordem (ISO). Vazio se ainda não há datas. */
export function tripDays(destinations: TripDestination[]): string[] {
  const start = getTripStartISO(destinations);
  const end = getTripEndISO(destinations);
  if (!start || !end) return [];
  return Array.from({ length: daysBetween(start, end) }, (_, i) => globalDayToISO(start, i));
}

/** cidade daquele dia, usando splitDaysByDestination (quem chega fica com o dia de fronteira, mesma regra do Roteiro) */
export function cityForDay(dayISO: string, destinations: TripDestination[]): string | null {
  const start = getTripStartISO(destinations);
  if (!start || dayISO < start) return null;
  const globalDay = daysBetween(start, dayISO) - 1;
  const range = splitDaysByDestination(destinations).find((r) => r.globalDayIndexes.includes(globalDay));
  return range?.city ?? null;
}

/** destino dono daquele dia (mesma regra de fronteira do Roteiro) — id do TripDestination ou null */
export function destinationIdForDay(dayISO: string, destinations: TripDestination[]): string | null {
  const start = getTripStartISO(destinations);
  if (!start || dayISO < start) return null;
  const globalDay = daysBetween(start, dayISO) - 1;
  const range = splitDaysByDestination(destinations).find((r) => r.globalDayIndexes.includes(globalDay));
  return range?.destinationId ?? null;
}

/** grupos na ordem da viagem; "Sem dia da viagem" por último */
export function groupPhotosByDay(photos: TripPhoto[]): { dayISO: string | null; photos: TripPhoto[] }[] {
  const byDay = new Map<string | null, TripPhoto[]>();
  for (const p of photos) {
    byDay.set(p.dayISO, [...(byDay.get(p.dayISO) ?? []), p]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a.localeCompare(b);
    })
    .map(([dayISO, list]) => ({ dayISO, photos: list }));
}

/*
  Fotos por atração (docs/ajustes-75-fotos-por-atracao.md): a foto se liga à
  parada do roteiro (TripPlaceSelection.id) ou ao evento escolhido (EventEntry.id).
  O nome mostrado é sempre o ATUAL do lugar/evento; placeLabel guarda o texto de
  "Outro" e o nome pro caso de o vínculo cair.
*/

type TripForPhotos = Pick<TripContextValue, 'destinations' | 'selectedPlaces' | 'itineraryOverrides' | 'selectedEventIds'>;

/** um lugar ou evento a que a foto pode se ligar */
export interface PhotoTarget {
  /** "place:<id>" ou "event:<id>" */
  key: string;
  label: string;
  placeSelectionId: string | null;
  eventId: string | null;
  /** parada marcada como "Pulei" */
  skipped: boolean;
}

/** nome da parada: texto de quem adicionou à mão, ou o nome do lugar da base */
export function selectionLabel(place: { customLabel: string | null; placeId: string | null }): string | null {
  return place.customLabel ?? (place.placeId ? (getPlaceById(place.placeId)?.name ?? null) : null);
}

/**
 * Eventos escolhidos daquela data e paradas do roteiro naquele dia, na ordem do
 * cartão do dia no Roteiro (eventos da Agenda primeiro, depois os lugares — os
 * pulados por último).
 */
export function dayStops(dayISO: string, trip: TripForPhotos): PhotoTarget[] {
  const targets: PhotoTarget[] = [];
  const events = trip.selectedEventIds
    .map((id) => getEventById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e && e.date === dayISO))
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  for (const e of events) {
    targets.push({ key: `event:${e.id}`, label: e.name, placeSelectionId: null, eventId: e.id, skipped: false });
  }
  const start = getTripStartISO(trip.destinations);
  if (start && dayISO >= start) {
    const globalDay = daysBetween(start, dayISO) - 1;
    const range = splitDaysByDestination(trip.destinations).find((r) => r.globalDayIndexes.includes(globalDay));
    if (range) {
      const localDay = range.globalDayIndexes.indexOf(globalDay);
      const dayItems = computeDestinationAssignments(
        range.destinationId,
        range.globalDayIndexes.length,
        trip.selectedPlaces,
        trip.itineraryOverrides,
      ).filter((a) => a.localDayIndex === localDay);
      for (const a of [...dayItems.filter((d) => !d.skipped), ...dayItems.filter((d) => d.skipped)]) {
        const label = selectionLabel(a.place);
        if (label) {
          targets.push({ key: `place:${a.place.id}`, label, placeSelectionId: a.place.id, eventId: null, skipped: a.skipped });
        }
      }
    }
  }
  return targets;
}

/** chave do lugar/evento ligado à foto, ou null */
export function photoTargetKey(photo: TripPhoto): string | null {
  if (photo.placeSelectionId) return `place:${photo.placeSelectionId}`;
  if (photo.eventId) return `event:${photo.eventId}`;
  return null;
}

/** nome a mostrar: o atual do lugar/evento ligado; senão o texto guardado */
export function photoPlaceName(photo: TripPhoto, trip: Pick<TripContextValue, 'selectedPlaces'>): string | null {
  if (photo.placeSelectionId) {
    const sel = trip.selectedPlaces.find((s) => s.id === photo.placeSelectionId);
    const label = sel ? selectionLabel(sel) : null;
    if (label) return label;
  }
  if (photo.eventId) {
    const event = getEventById(photo.eventId);
    if (event) return event.name;
  }
  return photo.placeLabel;
}

export interface DayPhotoGroups {
  /** fotos ligadas a uma parada/evento, um grupo por lugar, na ordem do dia */
  linked: { key: string; label: string; photos: TripPhoto[] }[];
  /** "Outras do dia": sem lugar ligado — com texto (Outro, ou lugar que saiu do roteiro) agrupadas pelo texto */
  others: { label: string | null; photos: TripPhoto[] }[];
}

/**
 * Fotos de UM dia agrupadas por lugar (Memórias, ajustes-75, 5). Lugar que foi
 * movido pra outro dia continua com as fotos deste dia (a foto é registro do que
 * aconteceu) — entra depois das paradas de hoje.
 */
export function groupDayPhotosByPlace(
  dayISO: string,
  photos: TripPhoto[],
  trip: TripForPhotos,
): DayPhotoGroups {
  const order = dayStops(dayISO, trip).map((t) => t.key);
  const linked = new Map<string, { key: string; label: string; photos: TripPhoto[] }>();
  const others = new Map<string | null, TripPhoto[]>();
  for (const p of photos) {
    const key = photoTargetKey(p);
    if (key) {
      const group = linked.get(key) ?? { key, label: photoPlaceName(p, trip) ?? 'Lugar', photos: [] };
      group.photos.push(p);
      linked.set(key, group);
    } else {
      const label = p.placeLabel?.trim() || null;
      others.set(label, [...(others.get(label) ?? []), p]);
    }
  }
  const rank = (key: string) => {
    const i = order.indexOf(key);
    return i === -1 ? order.length : i;
  };
  return {
    linked: [...linked.values()].sort((a, b) => rank(a.key) - rank(b.key)),
    // com texto primeiro (na ordem em que apareceram), sem texto por último
    others: [...others.entries()]
      .sort(([a], [b]) => (a === null ? 1 : 0) - (b === null ? 1 : 0))
      .map(([label, list]) => ({ label, photos: list })),
  };
}

/** fotos ligadas a uma parada/evento, na ordem em que foram adicionadas */
export function photosOfTarget(photos: TripPhoto[], key: string): TripPhoto[] {
  return photos.filter((p) => photoTargetKey(p) === key);
}
