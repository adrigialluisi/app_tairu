import { formatISOToDisplay, fromISODate } from './dateMask';
import type { HotelEntry } from '../data';
import type { StayItem, StayType } from '../context/TripContext';

const TYPE_LABELS: Record<StayType, string> = {
  hotel: 'Hotel',
  apartamento: 'Apartamento',
  hostel: 'Hostel',
  pousada: 'Pousada',
};

const TYPE_ICONS: Record<StayType, string> = {
  hotel: '🏨',
  apartamento: '🏠',
  hostel: '🛏️',
  pousada: '🏡',
};

export function stayTypeLabel(type: StayType): string {
  return TYPE_LABELS[type];
}

export function stayTypeIcon(type: StayType): string {
  return TYPE_ICONS[type];
}

export function stayItemTitle(item: StayItem): string {
  return item.name.trim() || stayTypeLabel(item.type);
}

function nightsBetween(startISO: string, endISO: string): number {
  const a = fromISODate(startISO);
  const b = fromISODate(endISO);
  const ms = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

/** Linhas de detalhe do card, uma informação por linha (mesmo critério do ajustes-48). Nunca inclui custo. */
export function stayItemDetailRows(item: StayItem): string[] {
  const rows: string[] = [];
  const place = [item.address, item.locality].filter(Boolean).join(' · ');
  if (place) rows.push(place);

  if (item.checkInDate && item.checkOutDate) {
    const n = nightsBetween(item.checkInDate, item.checkOutDate);
    rows.push(
      `${formatISOToDisplay(item.checkInDate)} → ${formatISOToDisplay(item.checkOutDate)} · ${n} ${n === 1 ? 'noite' : 'noites'}`,
    );
  } else if (item.checkInDate) {
    rows.push(`Check-in: ${formatISOToDisplay(item.checkInDate)}`);
  }
  const times = [item.checkInTime && `Check-in ${item.checkInTime}`, item.checkOutTime && `Check-out ${item.checkOutTime}`]
    .filter(Boolean)
    .join(' · ');
  if (times) rows.push(times);

  const extra = [item.roomType, item.confirmationCode && `Reserva ${item.confirmationCode}`].filter(Boolean).join(' · ');
  if (extra) rows.push(extra);
  return rows.length ? rows : ['Detalhes a preencher'];
}

/** "$$" até "$$$$". Sempre acompanhado de texto acessível (ver HotelInfo). */
export function priceLevelLabel(level: HotelEntry['priceLevel']): string {
  return '$'.repeat(level);
}

export function priceLevelA11y(level: HotelEntry['priceLevel']): string {
  return ['', 'Econômico', 'Preço médio', 'Preço alto', 'Luxo'][level];
}

export function hotelPhotoUrl(hotel: Pick<HotelEntry, 'photo'>): string | null {
  return hotel.photo ? `${import.meta.env.BASE_URL}${hotel.photo}` : null;
}
