import { Bus, Car, Plane, TrainFront, type LucideIcon } from 'lucide-react';
import type { TransportItem, TransportType } from '../context/TripContext';

const TYPE_LABELS: Record<TransportType, string> = {
  voo: 'Voo',
  onibus: 'Ônibus',
  trem: 'Trem',
  'carro-locado': 'Carro locado',
};

const TYPE_ICONS: Record<TransportType, LucideIcon> = {
  voo: Plane,
  onibus: Bus,
  trem: TrainFront,
  'carro-locado': Car,
};

export function transportTypeLabel(type: TransportType): string {
  return TYPE_LABELS[type];
}

export function transportTypeIcon(type: TransportType): LucideIcon {
  return TYPE_ICONS[type];
}

/** Linha de título do card — tipo + identificador principal (nunca custo). */
export function transportItemTitle(item: TransportItem): string {
  switch (item.type) {
    case 'voo':
      return [item.company, item.flightNumber].filter(Boolean).join(' ') || 'Voo';
    case 'onibus':
      return item.company || 'Ônibus';
    case 'trem':
      return [item.company, item.trainNumber].filter(Boolean).join(' · ') || 'Trem';
    case 'carro-locado':
      return [item.company, item.vehicleCategory].filter(Boolean).join(' — ') || 'Carro locado';
  }
}

/** Origem / destino / "data · hh:mm – hh:mm" — comum a voo, ônibus e trem. */
function routeRows(
  item: { origin: string; destination: string; departureAt: string; arrivalAt: string },
  originPrefix: string,
  destinationPrefix: string,
): string[] {
  const rows: string[] = [];
  if (item.origin) rows.push(`${originPrefix}${item.origin}`);
  if (item.destination) rows.push(`${destinationPrefix}${item.destination}`);
  const depParts = item.departureAt.trim().split(' ');
  const arrParts = item.arrivalAt.trim().split(' ');
  const date = depParts[0] || arrParts[0] || '';
  const depTime = depParts.slice(1).join(' ');
  // chegada em outro dia (pernoite — a data de chegada é editável desde o ajustes-86): mostra a data dela
  const arrDate = arrParts[0] && depParts[0] && arrParts[0] !== depParts[0] ? `${arrParts[0].slice(0, 5)} ` : '';
  const arrTime = arrParts.slice(1).join(' ') ? `${arrDate}${arrParts.slice(1).join(' ')}` : '';
  const timeRange = [depTime, arrTime].filter(Boolean).join(' – ');
  if (date || timeRange) rows.push([date, timeRange].filter(Boolean).join(' · '));
  return rows;
}

/**
 * Linhas de detalhe do card — nunca inclui custo. Partida e chegada ficam
 * numa linha só ("22/11/2026 · 14:00 – 16:20"); se a chegada for em outro
 * dia, a data dela entra antes da hora ("… – 23/11 06:10").
 */
export function transportItemDetailRows(item: TransportItem): string[] {
  switch (item.type) {
    case 'voo': {
      // o localizador tem linha própria, em destaque, no cartão (TransportItemCard)
      const rows = routeRows(item, 'Saída: ', 'Chegada: ');
      const classAndBaggage = [item.travelClass, item.baggage && `Bagagem: ${item.baggage}`].filter(Boolean).join(' · ');
      if (classAndBaggage) rows.push(classAndBaggage);
      return rows.length ? rows : ['Detalhes a preencher'];
    }
    case 'onibus': {
      const rows = routeRows(item, 'Saída: ', 'Chegada: ');
      return rows.length ? rows : ['Detalhes a preencher'];
    }
    case 'trem': {
      const rows = routeRows(item, 'Embarque: ', 'Desembarque: ');
      const classAndSeat = [item.travelClass, item.seat].filter(Boolean).join(' · ');
      if (classAndSeat) rows.push(classAndSeat);
      return rows.length ? rows : ['Detalhes a preencher'];
    }
    case 'carro-locado': {
      const rows: string[] = [];
      if (item.pickupLocation || item.pickupAt) {
        rows.push(`Retirada: ${[item.pickupLocation, item.pickupAt].filter(Boolean).join(' — ')}`);
      }
      if (item.dropoffLocation || item.dropoffAt) {
        rows.push(`Devolução: ${[item.dropoffLocation, item.dropoffAt].filter(Boolean).join(' — ')}`);
      }
      return rows.length ? rows : ['Detalhes a preencher'];
    }
  }
}
