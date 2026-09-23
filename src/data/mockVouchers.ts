import type { TransportItem } from '../context/TripContext';

/**
 * `Omit` sobre uma união discriminada colapsa pras chaves em comum (perde
 * os campos específicos de cada tipo) — precisa distribuir a omissão sobre
 * cada variante da união primeiro, senão os literais de voo/carro locado
 * abaixo não batem com o tipo.
 */
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

type MockVoucherFields = DistributiveOmit<
  TransportItem,
  'id' | 'destinationId' | 'costAmount' | 'costCurrencyCode' | 'voucherFileName'
>;

export const MOCK_TRANSPORT_VOUCHERS: Record<string, MockVoucherFields> = {
  'voucher-voo-buenosaires-santiago.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 4550',
    origin: 'Buenos Aires (EZE)',
    destination: 'Santiago (SCL)',
    departureAt: '22/11/2026 14:00',
    arrivalAt: '22/11/2026 16:20',
  },
  'voucher-carro-santiago-vinadelmar.pdf': {
    type: 'carro-locado',
    company: 'Hertz',
    vehicleCategory: 'Compacto',
    pickupLocation: 'Aeroporto de Santiago (SCL)',
    pickupAt: '23/11/2026 09:00',
    dropoffLocation: 'Aeroporto de Santiago (SCL)',
    dropoffAt: '23/11/2026 20:00',
  },
  'voucher-voo-santiago-calama.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 250',
    origin: 'Santiago (SCL)',
    destination: 'Calama (CJC)',
    departureAt: '24/11/2026 08:00',
    arrivalAt: '24/11/2026 09:45',
  },
  'voucher-transfer-calama-sanpedro.pdf': {
    type: 'onibus',
    company: 'Transvip',
    origin: 'Calama (CJC)',
    destination: 'San Pedro de Atacama',
    departureAt: '24/11/2026 10:15',
    arrivalAt: '24/11/2026 11:45',
  },
};

/** Reconhecimento só por nome do arquivo (mock, sem OCR/backend) — case-insensitive. */
export function lookupMockTransportVoucher(fileName: string): MockVoucherFields | null {
  return MOCK_TRANSPORT_VOUCHERS[fileName.toLowerCase()] ?? null;
}
