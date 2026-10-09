import type { LucideIcon } from 'lucide-react';
import { getEventById, getPlaceById } from '../data';
import type { RetroCard, Retrospective, TripContextValue, TripPhoto } from '../context/TripContext';
import { activeMembers, buildCostEntries, CATEGORY_META, EXPENSE_CATEGORIES, getMembers } from './costs';
import { formatISOToDisplay } from './dateMask';
import { formatMoney } from './money';
import {
  computeDestinationAssignments,
  daysBetween,
  getTripEndISO,
  getTripStartISO,
  splitDaysByDestination,
} from './itinerary';
import { destinationIdForDay, photoTargetKey } from './photos';

/**
 * Retrospectiva (docs/ajustes-65-memorias-retrospectiva.md) — SEM IA
 * generativa: frases-modelo preenchidas só com dados reais da viagem. Sem
 * dado, o card não é gerado. A versão gerada é ponto de partida; a pessoa
 * edita depois (ordem, foto, título, texto, ocultar).
 */

type TripForRetro = Pick<
  TripContextValue,
  | 'name'
  | 'destinations'
  | 'companions'
  | 'formerCompanions'
  | 'selectedPlaces'
  | 'itineraryOverrides'
  | 'selectedEventIds'
  | 'photos'
  | 'expenses'
  | 'transportItems'
  | 'stayItems'
  | 'otherItems'
  | 'centralCostOverrides'
>;

/** "A", "A e B", "A, B e C" */
export function joinPt(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/**
 * Lugares escolhidos que NÃO foram marcados como "Pulei", por destino, na ordem
 * do Roteiro — mas os que têm foto vêm primeiro (são os que a pessoa de fato
 * viveu, ajustes-75).
 */
function visitedPlaceLabels(trip: TripForRetro, destinationId: string, dayCount: number): string[] {
  const withPhoto = new Set(trip.photos.map((p) => p.placeSelectionId).filter(Boolean));
  const visited = computeDestinationAssignments(destinationId, dayCount, trip.selectedPlaces, trip.itineraryOverrides)
    .filter((a) => !a.skipped)
    .sort((a, b) => a.localDayIndex - b.localDayIndex)
    .map((a) => ({
      label: a.place.customLabel ?? (a.place.placeId ? getPlaceById(a.place.placeId)?.name : undefined),
      hasPhoto: withPhoto.has(a.place.id),
    }))
    .filter((v): v is { label: string; hasPhoto: boolean } => Boolean(v.label));
  return [...visited.filter((v) => v.hasPhoto), ...visited.filter((v) => !v.hasPhoto)].map((v) => v.label);
}

export function retroStats(trip: TripForRetro): {
  days: number;
  cities: string[];
  visitedPlaces: number;
  events: number;
  photos: number;
  /** paradas e eventos com pelo menos 1 foto ligada (ajustes-75) */
  placesWithPhotos: number;
  favorites: number;
  totalBRL: number | null;
  topCategory: { label: string; icon: LucideIcon } | null;
} {
  const start = getTripStartISO(trip.destinations);
  const end = getTripEndISO(trip.destinations);
  const ranges = splitDaysByDestination(trip.destinations);
  const visitedPlaces = ranges.reduce(
    (sum, r) => sum + visitedPlaceLabels(trip, r.destinationId, r.globalDayIndexes.length).length,
    0,
  );

  const entries = buildCostEntries(trip).filter((e) => e.amountBRL !== null);
  const totalBRL = entries.length > 0 ? entries.reduce((s, e) => s + (e.amountBRL as number), 0) : null;
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    c,
    v: entries.filter((e) => e.category === c).reduce((s, e) => s + (e.amountBRL as number), 0),
  })).sort((a, b) => b.v - a.v);
  const top = byCategory[0] && byCategory[0].v > 0 ? CATEGORY_META[byCategory[0].c] : null;

  return {
    days: start && end ? daysBetween(start, end) : 0,
    cities: [...new Set(ranges.filter((r) => r.globalDayIndexes.length > 0).map((r) => r.city))],
    visitedPlaces,
    events: trip.selectedEventIds.filter((id) => getEventById(id)).length,
    photos: trip.photos.length,
    placesWithPhotos: new Set(trip.photos.map(photoTargetKey).filter(Boolean)).size,
    favorites: trip.photos.filter((p) => p.favorite).length,
    totalBRL,
    topCategory: top ? { label: top.label, icon: top.icon } : null,
  };
}

/** 1º destaque ⭐; senão a 1ª foto; senão null (a tela usa a foto da cidade). */
function pickPhoto(photos: TripPhoto[]): string | null {
  return (photos.find((p) => p.favorite) ?? photos[0])?.id ?? null;
}

/**
 * Card de cidade (ajustes-75): 1º destaque ⭐ da cidade; senão a 1ª foto tirada
 * numa parada/evento (foto de quem esteve lá); senão null — aí a tela usa a foto
 * da cidade da Wikipedia.
 */
function pickCityPhoto(photos: TripPhoto[]): string | null {
  return (photos.find((p) => p.favorite) ?? photos.find((p) => photoTargetKey(p) !== null))?.id ?? null;
}

export function buildRetrospective(trip: TripForRetro): Retrospective {
  const stats = retroStats(trip);
  const start = getTripStartISO(trip.destinations);
  const end = getTripEndISO(trip.destinations);
  const ranges = splitDaysByDestination(trip.destinations).filter((r) => r.globalDayIndexes.length > 0);
  const solo = trip.companions.length === 0;
  const cards: RetroCard[] = [];
  const id = (suffix: string) => `retro-${suffix}`;

  if (start && end) {
    const period =
      start.slice(0, 4) === end.slice(0, 4)
        ? `${formatISOToDisplay(start).slice(0, 5)} a ${formatISOToDisplay(end)}`
        : `${formatISOToDisplay(start)} a ${formatISOToDisplay(end)}`;
    cards.push({
      id: id('capa'),
      kind: 'capa',
      title: trip.name.trim() || `Viagem pra ${joinPt(stats.cities)}`,
      text: [period, joinPt(stats.cities)].filter(Boolean).join(' · '),
      photoId: pickPhoto(trip.photos),
      hidden: false,
    });
  }

  if (stats.days > 0) {
    cards.push({
      id: id('numeros'),
      kind: 'numeros',
      title: 'A viagem em números',
      text: '',
      photoId: null,
      hidden: false,
    });
  }

  for (const r of ranges) {
    const n = r.globalDayIndexes.length;
    const places = visitedPlaceLabels(trip, r.destinationId, n).slice(0, 3);
    const destination = trip.destinations.find((d) => d.id === r.destinationId);
    const events = trip.selectedEventIds
      .map((eid) => getEventById(eid))
      .filter(
        (e) =>
          e &&
          destination?.dateStart &&
          destination.dateEnd &&
          e.cityId === r.cityId &&
          e.date >= destination.dateStart &&
          e.date <= destination.dateEnd,
      )
      .map((e) => e!.name);

    let text = `${plural(n, 'dia', 'dias')} em ${r.city}.`;
    if (places.length > 0) {
      const went = events.length > 0 ? `, e ${solo ? 'foi' : 'foram'} em ${joinPt(events)}` : '';
      text = `${plural(n, 'dia', 'dias')} em ${r.city}. ${solo ? 'Você passou' : 'Vocês passaram'} por ${joinPt(places)}${went}.`;
    } else if (events.length > 0) {
      text = `${plural(n, 'dia', 'dias')} em ${r.city}. ${solo ? 'Você foi' : 'Vocês foram'} em ${joinPt(events)}.`;
    }

    const cityPhotos = trip.photos.filter(
      (p) => p.dayISO && destinationIdForDay(p.dayISO, trip.destinations) === r.destinationId,
    );
    cards.push({
      id: id(`cidade-${r.destinationId}`),
      kind: 'cidade',
      title: r.city,
      text,
      photoId: pickCityPhoto(cityPhotos),
      destinationId: r.destinationId,
      hidden: false,
    });
  }

  if (stats.favorites >= 2) {
    cards.push({
      id: id('destaques'),
      kind: 'destaques',
      title: 'Os melhores momentos',
      text: '',
      photoId: null,
      hidden: false,
    });
  }

  if (cards.length > 0) {
    const people = activeMembers(getMembers(trip)).map((m) => (m.id === 'voce' ? 'você' : m.label));
    cards.push({
      id: id('fecho'),
      kind: 'fecho',
      title: 'Até a próxima!',
      text: solo ? 'Uma viagem sua.' : `Uma viagem de ${joinPt(people)}.`,
      photoId: null,
      hidden: false,
    });
  }

  return { generatedAtISO: new Date().toISOString(), showCosts: false, cards };
}

/** Texto-resumo pra compartilhar, só com os cards visíveis. */
export function retroShareText(retro: Retrospective, trip: TripForRetro): string {
  const stats = retroStats(trip);
  const lines: string[] = [];
  for (const card of retro.cards.filter((c) => !c.hidden)) {
    if (card.kind === 'numeros') {
      const numbers = [
        stats.days ? plural(stats.days, 'dia', 'dias') : '',
        stats.cities.length ? plural(stats.cities.length, 'cidade', 'cidades') : '',
        stats.visitedPlaces ? plural(stats.visitedPlaces, 'lugar visitado', 'lugares visitados') : '',
        stats.events ? plural(stats.events, 'evento', 'eventos') : '',
        stats.photos ? plural(stats.photos, 'foto', 'fotos') : '',
        // gastos são privados: só entram com "Mostrar gastos" ligado
        retro.showCosts && stats.totalBRL ? `${formatMoney(stats.totalBRL, 'BRL')} em gastos` : '',
      ].filter(Boolean);
      lines.push(`${card.title}: ${numbers.join(' · ')}`);
      if (card.text) lines.push(card.text);
    } else {
      lines.push([card.title, card.text].filter(Boolean).join(' — '));
    }
  }
  return lines.join('\n');
}
