import type { StayItem, TransportItem } from '../context/TripContext';

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

type MockStayVoucherFields = Omit<
  StayItem,
  'id' | 'destinationId' | 'costAmount' | 'costCurrencyCode' | 'voucherFileName'
>;

export const MOCK_STAY_VOUCHERS: Record<string, MockStayVoucherFields> = {
  'voucher-hotel-buenosaires-magnolia.pdf': {
    type: 'hotel',
    hotelId: 'ba-magnolia-boutique',
    name: 'Magnolia Hotel Boutique',
    address: 'Julián Álvarez 1746, Palermo Soho',
    locality: 'Buenos Aires',
    checkInDate: '2026-11-20',
    checkInTime: '15:00',
    checkOutDate: '2026-11-22',
    checkOutTime: '11:00',
    confirmationCode: 'MAG-58213',
    roomType: 'Duplo Standard',
  },
  'voucher-hotel-santiago-cumbreslastarria.pdf': {
    type: 'hotel',
    hotelId: 'scl-cumbres-lastarria',
    name: 'Hotel Cumbres Lastarria',
    address: 'José Victorino Lastarria 299, Barrio Lastarria',
    locality: 'Santiago',
    checkInDate: '2026-11-22',
    checkInTime: '17:00',
    checkOutDate: '2026-11-24',
    checkOutTime: '06:00',
    confirmationCode: 'CLT-40977',
    roomType: 'Superior Queen',
  },
  'voucher-pousada-sanpedro-casasolcor.pdf': {
    type: 'pousada',
    hotelId: 'atc-casa-solcor',
    name: 'Casa Solcor',
    address: 'Antonio León 74, Ayllú de Solcor',
    locality: 'San Pedro de Atacama',
    checkInDate: '2026-11-24',
    checkInTime: '14:00',
    checkOutDate: '2026-11-25',
    checkOutTime: '11:00',
    confirmationCode: 'SOL-11846',
    roomType: 'Duplo',
  },
};

export function lookupMockStayVoucher(fileName: string): MockStayVoucherFields | null {
  return MOCK_STAY_VOUCHERS[fileName.toLowerCase()] ?? null;
}
