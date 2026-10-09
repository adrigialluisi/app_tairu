import type { OtherItem, OtherItemType, StayItem, TransportItem, TripDestination } from '../context/TripContext';
import type { PersonalDocType, PersonalDocument } from '../context/DocumentsContext';
import { formatISOToDisplay } from '../utils/dateMask';

/*
  Leitura SIMULADA de voucher/documento (docs/ajustes-84-tudo-que-sobe-preenche-sozinho.md):
  não existe OCR, backend nem IA. O app "lê" pelo nome do arquivo, em 2 níveis:
  1. arquivo de exemplo conhecido (public/mock-vouchers/, nome exato, sem diferenciar maiúsculas)
     → os dados daquele arquivo;
  2. qualquer outro arquivo (ex.: foto do celular do participante) → preenchimento de exemplo
     coerente com o contexto (destino, tipo). Nunca deixa de preencher.
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
  'voucher-trem-buenosaires-tigre.pdf': {
    type: 'trem',
    company: 'Tren de la Costa',
    trainNumber: 'Ramal Maipú–Delta',
    origin: 'Estación Maipú (Olivos)',
    destination: 'Estación Delta (Tigre)',
    departureAt: '21/11/2026 10:00',
    arrivalAt: '21/11/2026 10:30',
    travelClass: 'Turista',
    seat: 'Vagão 2 · assento livre',
    bookingCode: 'TDC-48217',
  },
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
): ReadResult<MockVoucherFields> {
  const known = MOCK_TRANSPORT_VOUCHERS[file.name.toLowerCase()];
  if (known) return { fields: known, source: 'reconhecido' };
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
      startDate: '2026-11-20',
      endDate: '2026-11-25',
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

export type DocumentReadFields = Partial<
  Pick<
    PersonalDocument,
    'title' | 'fullName' | 'number' | 'issuer' | 'issueDate' | 'expiryDate' | 'visaEntries' | 'maxStayDays' | 'vaccineDose' | 'emergencyPhone'
  >
>;

const TEST_NAME = 'PARTICIPANTE DO TESTE';

/** exemplo por tipo — passaporte igual ao arquivo de exemplo, pra tarefa do aviso de validade funcionar com qualquer foto */
const DOCUMENT_EXAMPLES: Record<Exclude<PersonalDocType, 'outro'>, DocumentReadFields> = {
  passaporte: { fullName: TEST_NAME, number: 'XX0000000', issuer: 'Brasil', issueDate: '10/03/2017', expiryDate: '10/03/2027' },
  rg: { fullName: TEST_NAME, number: '00.000.000-0', issuer: 'SSP-SP', issueDate: '01/01/2015' },
  cnh: { fullName: TEST_NAME, number: '00000000000', issuer: 'SP', expiryDate: '01/01/2030' },
  pid: { fullName: TEST_NAME, number: 'PID-0000', issuer: 'Brasil', expiryDate: '01/01/2027' },
  visto: {
    title: 'Visto (exemplo)',
    fullName: TEST_NAME,
    issuer: 'Estados Unidos',
    expiryDate: '01/01/2030',
    visaEntries: 'multipla',
    maxStayDays: '90',
  },
  vacina: { title: 'Febre amarela', fullName: TEST_NAME, vaccineDose: 'Dose única', issueDate: '15/08/2019', expiryDate: '' },
  'seguro-anual': {
    title: 'Seguro anual (exemplo)',
    issuer: 'Seguradora (exemplo)',
    number: 'EX-000000',
    expiryDate: '31/12/2026',
    emergencyPhone: '+55 11 0000-0000',
  },
};

const MOCK_DOCUMENT_FILES: Record<string, { type: PersonalDocType; fields: DocumentReadFields }> = {
  'passaporte-exemplo.png': { type: 'passaporte', fields: DOCUMENT_EXAMPLES.passaporte },
  // vale por toda a vida: validade em branco (o card mostra "Sem validade")
  'certificado-vacina-febre-amarela-exemplo.png': { type: 'vacina', fields: DOCUMENT_EXAMPLES.vacina },
};

export function readDocumentFile(file: Pick<File, 'name'>, docType: PersonalDocType): ReadResult<DocumentReadFields> {
  const known = MOCK_DOCUMENT_FILES[file.name.toLowerCase()];
  if (known && known.type === docType) return { fields: known.fields, source: 'reconhecido' };
  if (docType === 'outro') return { fields: { title: file.name.replace(/\.[^.]+$/, '') }, source: 'exemplo' };
  return { fields: DOCUMENT_EXAMPLES[docType], source: 'exemplo' };
}
