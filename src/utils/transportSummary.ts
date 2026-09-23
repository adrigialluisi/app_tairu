import type { TransportItem, TransportType } from '../context/TripContext';

const TYPE_LABELS: Record<TransportType, string> = {
  voo: 'Voo',
  onibus: 'Ônibus',
  'carro-locado': 'Carro locado',
};

const TYPE_ICONS: Record<TransportType, string> = {
  voo: '✈️',
  onibus: '🚌',
  'carro-locado': '🚗',
};

export function transportTypeLabel(type: TransportType): string {
  return TYPE_LABELS[type];
}

export function transportTypeIcon(type: TransportType): string {
  return TYPE_ICONS[type];
}

/** Linha de título do card — tipo + identificador principal (nunca custo). */
export function transportItemTitle(item: TransportItem): string {
  switch (item.type) {
    case 'voo':
      return [item.company, item.flightNumber].filter(Boolean).join(' ') || 'Voo';
    case 'onibus':
      return item.company || 'Ônibus';
    case 'carro-locado':
      return [item.company, item.vehicleCategory].filter(Boolean).join(' — ') || 'Carro locado';
  }
}

/**
 * Linhas de detalhe do card — nunca inclui custo. Assume que data de
 * partida e chegada é a mesma (formato "dd/mm/aaaa hh:mm" nos dois campos,
 * como o app já pede) pra juntar as duas horas numa linha só — é uma
 * simplificação aceitável pro cenário de teste (trechos curtos, mesmo
 * dia); se algum dia precisar cobrir voos com pernoite, essa função é o
 * único lugar a ajustar.
 */
export function transportItemDetailRows(item: TransportItem): string[] {
  switch (item.type) {
    case 'voo':
    case 'onibus': {
      const rows: string[] = [];
      if (item.origin) rows.push(`Saída: ${item.origin}`);
      if (item.destination) rows.push(`Chegada: ${item.destination}`);
      const depParts = item.departureAt.trim().split(' ');
      const arrParts = item.arrivalAt.trim().split(' ');
      const date = depParts[0] || arrParts[0] || '';
      const depTime = depParts.slice(1).join(' ');
      const arrTime = arrParts.slice(1).join(' ');
      const timeRange = [depTime, arrTime].filter(Boolean).join(' – ');
      if (date || timeRange) rows.push([date, timeRange].filter(Boolean).join(' · '));
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
