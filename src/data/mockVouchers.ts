import type { OtherItem, OtherItemType, StayItem, TransportItem, TripDestination } from '../context/TripContext';
import { formatISOToDisplay } from '../utils/dateMask';
import { airportValue, getAirport } from './index';

/** aeroporto do voucher pelo código (ajustes-86): o campo recebe o aeroporto da base, não texto solto */
function airport(iata: string): string {
  const a = getAirport(iata);
  return a ? airportValue(a) : iata;
}

/*
  Leitura SIMULADA de voucher/documento (docs/ajustes-84-tudo-que-sobe-preenche-sozinho.md):
  não existe OCR, backend nem IA. O app "lê" pelo nome do arquivo, em 2 níveis:
  1. arquivo de exemplo conhecido (public/mock-vouchers/, nome exato, sem diferenciar maiúsculas,
     em PDF ou na imagem .jpg do kit — ajustes-96) → os dados daquele arquivo;
  2. qualquer outro arquivo → preenchimento pelo CONTEXTO (destino, tipo). É o caso do teste no
     celular (ajustes-96): a imagem do kit chega pela galeria com outro nome (IMG_1234.jpg) e
     comprimida pelo WhatsApp — no Transporte de Buenos Aires vira o voo LA 4550, na Hospedagem de
     Buenos Aires o Magnolia, nos outros destinos o voucher de exemplo da cidade. Nunca deixa de
     preencher.
  `source` só serve pro código/moderador — a tela mostra a mesma mensagem nos dois casos.
*/
export type ReadSource = 'reconhecido' | 'exemplo';
export interface ReadResult<T> {
  fields: T;
  source: ReadSource;
}

/**
 * `Omit` sobre uma união discriminada colapsa pras chaves em comum (perde
 * os campos específicos de cada tipo) — precisa distribuir a omissão sobre
 * cada variante da união primeiro, senão os literais de voo/carro locado
 * abaixo não batem com o tipo.
 */
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

export type MockVoucherFields = DistributiveOmit<
  TransportItem,
  'id' | 'destinationId' | 'costAmount' | 'costCurrencyCode' | 'voucherFileName'
>;

export const MOCK_TRANSPORT_VOUCHERS: Record<string, MockVoucherFields> = {
  'voucher-voo-buenosaires-santiago.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 4550',
    origin: airport('EZE'),
    destination: airport('SCL'),
    departureAt: '19/11/2026 14:00',
    arrivalAt: '19/11/2026 16:20',
    // localizador, classe e bagagem: os mesmos impressos no PDF de exemplo (public/mock-vouchers/)
    locator: 'EEPMS7',
    travelClass: 'Econômica',
    baggage: '1 despachada + 1 de mão',
  },
  'voucher-carro-santiago-vinadelmar.pdf': {
    type: 'carro-locado',
    company: 'Hertz',
    vehicleCategory: 'Compacto',
    pickupLocation: 'Aeroporto de Santiago (SCL)',
    pickupAt: '21/11/2026 09:00',
    dropoffLocation: 'Aeroporto de Santiago (SCL)',
    dropoffAt: '21/11/2026 20:00',
  },
  'voucher-voo-santiago-calama.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 250',
    origin: airport('SCL'),
    destination: airport('CJC'),
    departureAt: '23/11/2026 08:00',
    arrivalAt: '23/11/2026 09:45',
    locator: 'ZBWG7P',
    travelClass: 'Econômica',
    baggage: '1 despachada + 1 de mão',
  },
  'voucher-transfer-calama-sanpedro.pdf': {
    type: 'onibus',
    company: 'Transvip',
    origin: 'Calama (CJC)',
    destination: 'San Pedro de Atacama',
    departureAt: '23/11/2026 10:15',
    arrivalAt: '23/11/2026 11:45',
  },
  'voucher-trem-buenosaires-tigre.pdf': {
    type: 'trem',
    company: 'Tren de la Costa',
    trainNumber: 'Ramal Maipú–Delta',
    origin: 'Estación Maipú (Olivos)',
    destination: 'Estación Delta (Tigre)',
    departureAt: '16/11/2026 10:00',
    arrivalAt: '16/11/2026 10:30',
    travelClass: 'Turista',
    seat: 'Vagão 2 · assento livre',
    bookingCode: 'TDC-48217',
  },
  // voo de volta (ajustes-92): 2 trechos no mesmo voucher — aqui o 1º; o 2º em MOCK_TRANSPORT_EXTRA_LEGS
  'voucher-voo-volta-calama-saopaulo.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 341',
    origin: airport('CJC'),
    destination: airport('SCL'),
    departureAt: '27/11/2026 12:30',
    arrivalAt: '27/11/2026 14:25',
    locator: 'QXRT4M',
    travelClass: 'Econômica',
    baggage: '1 despachada + 1 de mão',
  },
};

/** a imagem do kit (ajustes-96) vale o mesmo que o PDF de mesmo nome */
MOCK_TRANSPORT_VOUCHERS['voucher-voo-buenosaires-santiago.jpg'] = MOCK_TRANSPORT_VOUCHERS['voucher-voo-buenosaires-santiago.pdf'];

/**
 * Trechos a mais de um voucher com conexão (ajustes-92). O formulário de voo guarda um voo só, então
 * o voucher preenche o 1º trecho e os outros entram como voos separados quando a pessoa salva —
 * sem inventar um tipo de transporte novo.
 */
export const MOCK_TRANSPORT_EXTRA_LEGS: Record<string, MockVoucherFields[]> = {
  'voucher-voo-volta-calama-saopaulo.pdf': [
    {
      type: 'voo',
      company: 'LATAM Airlines',
      flightNumber: 'LA 8070',
      origin: airport('SCL'),
      destination: airport('GRU'),
      departureAt: '27/11/2026 16:30',
      arrivalAt: '27/11/2026 21:40',
      locator: 'QXRT4M',
      travelClass: 'Econômica',
      baggage: '1 despachada + 1 de mão',
    },
  ],
};

/** voucher de exemplo cuja ORIGEM é a cidade do destino (pra foto qualquer enviada naquele destino) */
const TRANSPORT_EXAMPLE_BY_CITY: Record<string, string> = {
  'buenos-aires-ar': 'voucher-voo-buenosaires-santiago.pdf',
  'santiago-cl': 'voucher-voo-santiago-calama.pdf',
  'san-pedro-de-atacama-cl': 'voucher-transfer-calama-sanpedro.pdf',
};

function isoToDisplay(iso: string | null | undefined): string {
  return iso ? formatISOToDisplay(iso) : '';
}

export function readTransportFile(
  file: Pick<File, 'name'>,
  destination: TripDestination | undefined,
): ReadResult<MockVoucherFields> & { extraLegs?: MockVoucherFields[] } {
  const known = MOCK_TRANSPORT_VOUCHERS[file.name.toLowerCase()];
  if (known) return { fields: known, source: 'reconhecido', extraLegs: MOCK_TRANSPORT_EXTRA_LEGS[file.name.toLowerCase()] };
  const byCity = destination && TRANSPORT_EXAMPLE_BY_CITY[destination.cityId];
  if (byCity) return { fields: MOCK_TRANSPORT_VOUCHERS[byCity], source: 'exemplo' };
  const day = isoToDisplay(destination?.dateStart);
  return {
    fields: {
      type: 'voo',
      company: 'Companhia aérea (exemplo)',
      flightNumber: 'EX-0000',
      origin: 'Origem (exemplo)',
      destination: destination?.city ?? 'Destino (exemplo)',
      departureAt: day ? `${day} 10:00` : '',
      arrivalAt: day ? `${day} 12:00` : '',
      // localizador fica vazio: um código de exemplo pareceria de verdade
      locator: '',
      travelClass: 'Econômica',
      baggage: '1 de mão',
    },
    source: 'exemplo',
  };
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
    checkInDate: '2026-11-14',
    checkInTime: '15:00',
    checkOutDate: '2026-11-19',
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
    checkInDate: '2026-11-19',
    checkInTime: '17:00',
    checkOutDate: '2026-11-23',
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
    checkInDate: '2026-11-23',
    checkInTime: '14:00',
    checkOutDate: '2026-11-27',
    checkOutTime: '11:00',
    confirmationCode: 'SOL-11846',
    roomType: 'Duplo',
  },
};

/** a imagem do kit (ajustes-96) vale o mesmo que o PDF de mesmo nome */
MOCK_STAY_VOUCHERS['voucher-hotel-buenosaires-magnolia.jpg'] = MOCK_STAY_VOUCHERS['voucher-hotel-buenosaires-magnolia.pdf'];

const STAY_EXAMPLE_BY_CITY: Record<string, string> = {
  'buenos-aires-ar': 'voucher-hotel-buenosaires-magnolia.pdf',
  'santiago-cl': 'voucher-hotel-santiago-cumbreslastarria.pdf',
  'san-pedro-de-atacama-cl': 'voucher-pousada-sanpedro-casasolcor.pdf',
};

export function readStayFile(file: Pick<File, 'name'>, destination: TripDestination): ReadResult<MockStayVoucherFields> {
  const known = MOCK_STAY_VOUCHERS[file.name.toLowerCase()];
  if (known) return { fields: known, source: 'reconhecido' };
  const byCity = STAY_EXAMPLE_BY_CITY[destination.cityId];
  if (byCity) return { fields: MOCK_STAY_VOUCHERS[byCity], source: 'exemplo' };
  return {
    fields: {
      type: 'hotel',
      hotelId: null,
      name: 'Hotel (exemplo)',
      address: '',
      locality: destination.city,
      checkInDate: destination.dateStart,
      checkInTime: '15:00',
      checkOutDate: destination.dateEnd,
      checkOutTime: '11:00',
      confirmationCode: 'EX-0000',
      roomType: '',
    },
    source: 'exemplo',
  };
}

// ---------- Outros (Seguro, Passeio, Ingresso) ----------

/** campos que a leitura preenche num registro de Outros; `destinationCityId` vira o "Vale para" se a viagem tiver essa cidade */
export type OtherReadFields = Partial<
  Pick<
    OtherItem,
    'title' | 'provider' | 'referenceCode' | 'startDate' | 'endDate' | 'time' | 'location' | 'emergencyPhone' | 'costAmount' | 'costCurrencyCode'
  >
> & { scope?: 'viagem' | { cityId: string } };

const MOCK_OTHER_FILES: Record<string, { type: OtherItemType; fields: OtherReadFields }> = {
  'seguro-viagem-exemplo.pdf': {
    type: 'seguro',
    fields: {
      title: 'Mundo — cobertura médica USD 60.000',
      provider: 'Seguro Viagem (exemplo)',
      referenceCode: 'SV-2026-884120',
      startDate: '2026-11-14',
      endDate: '2026-11-27',
      emergencyPhone: '+55 11 0000-0000',
      scope: 'viagem',
    },
  },
  'ingresso-passeio-valle-de-la-luna-exemplo.pdf': {
    type: 'passeio',
    fields: {
      title: 'Valle de la Luna ao pôr do sol',
      provider: 'Atacama Tours (exemplo)',
      referenceCode: 'ATC-77310',
      startDate: '2026-11-24',
      endDate: null,
      time: '15:30',
      location: 'Agência — Caracoles 160, San Pedro de Atacama',
      scope: { cityId: 'san-pedro-de-atacama-cl' },
    },
  },
  'ingresso-festival-cerveja-santiago.pdf': {
    type: 'ingresso',
    fields: {
      title: 'Festival de cerveja artesanal',
      provider: 'EntradasYa (exemplo)',
      referenceCode: 'EYA-48213',
      startDate: '2026-11-22',
      endDate: null,
      time: '13:00',
      location: 'Parque Bicentenario, Vitacura',
      costAmount: '45000',
      costCurrencyCode: 'CLP',
      scope: { cityId: 'santiago-cl' },
    },
  },
};

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 2º dia do período (ou o 1º, se ele tiver um dia só) */
function secondDay(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const next = addDaysISO(start, 1);
  return end && next > end ? start : next;
}

/**
 * `destination`: o "Vale para" escolhido no formulário (undefined = viagem toda);
 * `destinations`: todos, pra vigência do seguro e 2º dia da viagem.
 */
export function readOtherFile(
  file: Pick<File, 'name'>,
  type: OtherItemType,
  destination: TripDestination | undefined,
  destinations: TripDestination[],
): ReadResult<OtherReadFields> {
  const known = MOCK_OTHER_FILES[file.name.toLowerCase()];
  // arquivo conhecido no formulário "errado" (ex.: seguro num Ingresso): vale o exemplo do tipo atual
  if (known && known.type === type) return { fields: known.fields, source: 'reconhecido' };

  const starts = destinations.map((d) => d.dateStart).filter((d): d is string => !!d).sort();
  const ends = destinations.map((d) => d.dateEnd).filter((d): d is string => !!d).sort();
  const tripStart = starts[0] ?? null;
  const tripEnd = ends[ends.length - 1] ?? null;
  if (type === 'seguro') {
    return {
      fields: {
        title: 'Plano viagem (exemplo)',
        provider: 'Seguradora (exemplo)',
        referenceCode: 'EX-000000',
        startDate: tripStart,
        endDate: tripEnd,
        emergencyPhone: '+55 11 0000-0000',
      },
      source: 'exemplo',
    };
  }
  const day = destination ? secondDay(destination.dateStart, destination.dateEnd) : secondDay(tripStart, tripEnd);
  return {
    fields:
      type === 'passeio'
        ? { title: 'Passeio guiado (exemplo)', provider: 'Agência (exemplo)', referenceCode: 'EX-0000', startDate: day, endDate: null, time: '09:00' }
        : { title: 'Ingresso (exemplo)', provider: 'Bilheteria (exemplo)', referenceCode: 'EX-0000', startDate: day, endDate: null, time: '20:00' },
    source: 'exemplo',
  };
}

// ---------- Documentos pessoais ----------
// módulo puro, testado no `npm test` (ajustes-99b)
export { readDocumentFile, type DocumentReadFields } from './mockDocuments';
