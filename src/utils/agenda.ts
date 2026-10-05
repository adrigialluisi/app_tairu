import { BedDouble, LogOut, type LucideIcon } from 'lucide-react';
import { getEventById } from '../data';
import type { TripContextValue } from '../context/TripContext';
import { EVENT_KIND_ICONS } from './categoryVisuals';
import { isValidCalendarDate, toISODate } from './dateMask';
import { otherItemTitle, otherTypeIcon } from './otherSummary';
import { stayItemTitle } from './staySummary';
import { transportItemTitle, transportTypeIcon } from './transportSummary';

/**
 * "Agenda do dia" do Roteiro (etapa 7 do fluxo, Linha do tempo) — tudo que
 * tem data/hora marcada, puxado da Central e dos eventos escolhidos. Nada é
 * digitado de novo: a fonte continua sendo onde a pessoa cadastrou. Ver
 * docs/ajustes-63-agenda-do-dia-no-roteiro.md.
 */

export type AgendaKind =
  | 'transporte'
  | 'checkin'
  | 'checkout'
  | 'retirada'
  | 'devolucao'
  | 'passeio'
  | 'ingresso'
  | 'evento';

export type AgendaLink =
  | { path: '/central'; tab: 'transporte' | 'estadia' | 'outros' }
  /** aba Sugestões do próprio Roteiro (valor interno 'lugares') — troca de aba, sem navegar */
  | { path: '/roteiro'; tab: 'lugares' };

export interface AgendaItem {
  /** `${kind}-${sourceId}` (carro e hospedagem geram 2 itens cada) */
  id: string;
  sourceId: string;
  kind: AgendaKind;
  /** yyyy-mm-dd */
  dateISO: string;
  /** "hh:mm" ou "" (sem hora vai pro fim do dia) */
  time: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  link: AgendaLink;
}

type TripForAgenda = Pick<TripContextValue, 'transportItems' | 'stayItems' | 'otherItems' | 'selectedEventIds'>;

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

/** "9:05" → "09:05"; qualquer coisa fora de hh:mm válido → "" */
function normalizeTime(value: string): string {
  const m = value.trim().match(TIME_RE);
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/** "22/11/2026 14:00" → { dateISO: '2026-11-22', time: '14:00' }; só data também vale; fora do formato → null */
export function parseDisplayDateTime(value: string): { dateISO: string; time: string } | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\S+))?$/);
  if (!m) return null;
  const date = { day: Number(m[1]), month: Number(m[2]), year: Number(m[3]) };
  if (!isValidCalendarDate(date)) return null;
  return { dateISO: toISODate(date), time: m[4] ? normalizeTime(m[4]) : '' };
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function buildAgenda(trip: TripForAgenda): AgendaItem[] {
  const items: AgendaItem[] = [];

  for (const t of trip.transportItems) {
    if (t.type === 'carro-locado') {
      const place = (location: string) => [t.company, location].filter(Boolean).join(' · ');
      const pickup = parseDisplayDateTime(t.pickupAt);
      if (pickup) {
        items.push({
          id: `retirada-${t.id}`,
          sourceId: t.id,
          kind: 'retirada',
          ...pickup,
          icon: transportTypeIcon('carro-locado'),
          title: 'Retirada do carro',
          subtitle: place(t.pickupLocation),
          link: { path: '/central', tab: 'transporte' },
        });
      }
      const dropoff = parseDisplayDateTime(t.dropoffAt);
      if (dropoff) {
        items.push({
          id: `devolucao-${t.id}`,
          sourceId: t.id,
          kind: 'devolucao',
          ...dropoff,
          icon: transportTypeIcon('carro-locado'),
          title: 'Devolução do carro',
          subtitle: place(t.dropoffLocation),
          link: { path: '/central', tab: 'transporte' },
        });
      }
      continue;
    }

    const departure = parseDisplayDateTime(t.departureAt);
    if (!departure) continue;
    const arrival = parseDisplayDateTime(t.arrivalAt);
    const route = [t.origin, t.destination].filter(Boolean).join(' → ');
    items.push({
      id: `transporte-${t.id}`,
      sourceId: t.id,
      kind: 'transporte',
      ...departure,
      icon: transportTypeIcon(t.type),
      title: transportItemTitle(t),
      subtitle: [route, arrival?.time ? `chega ${arrival.time}` : ''].filter(Boolean).join(' · '),
      link: { path: '/central', tab: 'transporte' },
    });
  }

  for (const s of trip.stayItems) {
    const name = stayItemTitle(s);
    const subtitle = s.address || s.locality;
    if (s.checkInDate && ISO_RE.test(s.checkInDate)) {
      items.push({
        id: `checkin-${s.id}`,
        sourceId: s.id,
        kind: 'checkin',
        dateISO: s.checkInDate,
        time: normalizeTime(s.checkInTime),
        icon: BedDouble,
        title: `Check-in: ${name}`,
        subtitle,
        link: { path: '/central', tab: 'estadia' },
      });
    }
    if (s.checkOutDate && ISO_RE.test(s.checkOutDate)) {
      items.push({
        id: `checkout-${s.id}`,
        sourceId: s.id,
        kind: 'checkout',
        dateISO: s.checkOutDate,
        time: normalizeTime(s.checkOutTime),
        icon: LogOut,
        title: `Check-out: ${name}`,
        subtitle,
        link: { path: '/central', tab: 'estadia' },
      });
    }
  }

  // seguro vale a viagem toda, não tem hora marcada: não entra
  for (const o of trip.otherItems) {
    if (o.type === 'seguro' || !o.startDate || !ISO_RE.test(o.startDate)) continue;
    items.push({
      id: `${o.type}-${o.id}`,
      sourceId: o.id,
      kind: o.type,
      dateISO: o.startDate,
      time: normalizeTime(o.time),
      icon: otherTypeIcon(o.type),
      title: otherItemTitle(o),
      subtitle: o.location,
      link: { path: '/central', tab: 'outros' },
    });
  }

  for (const id of trip.selectedEventIds) {
    const e = getEventById(id);
    if (!e) continue;
    // hora = primeiro hh:mm do texto ("a partir das 20:00 (aula às 18:00)" → 20:00);
    // se o texto diz mais que isso, ele vai inteiro pro subtítulo
    const found = e.time.match(/(\d{1,2}:\d{2})/);
    const time = found ? normalizeTime(found[1]) : '';
    items.push({
      id: `evento-${e.id}`,
      sourceId: e.id,
      kind: 'evento',
      dateISO: e.date,
      time,
      icon: EVENT_KIND_ICONS[e.kind],
      title: e.name,
      subtitle: [e.venue, e.time.trim() !== time ? e.time : ''].filter(Boolean).join(' · '),
      link: { path: '/roteiro', tab: 'lugares' },
    });
  }

  // por data; no mesmo dia, por hora, e sem hora por último (sort estável mantém a ordem de origem nos empates)
  return items.sort((a, b) => {
    if (a.dateISO !== b.dateISO) return a.dateISO.localeCompare(b.dateISO);
    if (a.time === b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}
