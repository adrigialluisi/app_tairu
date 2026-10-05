/**
 * SIMULAÇÃO — dados de convidados fictícios do cenário fixo de teste. Não há
 * backend; nada aqui vem de outra pessoa de verdade.
 *
 * Só estes dois e-mails "entram" na viagem e contribuem (lugares e gastos);
 * qualquer outro convite fica em "Convite enviado". Os lugares são ids reais
 * de places.json (nada inventado); os gastos têm valores plausíveis, marcados
 * aqui como simulação. A visão do convidado é outro protótipo. Ver
 * docs/ajustes-67-convidados-simulados-contribuem.md.
 */
import type { ExpenseCategory } from '../context/TripContext';

export interface MockCompanionProfile {
  /** comparação sem diferenciar maiúsculas */
  email: string;
  name: string;
  initials: string;
  /** placeIds de places.json; só entram os da cidade que existir na viagem */
  places: string[];
  expenses: {
    /** estável, pra não duplicar (vira o id `mock-${key}`) */
    key: string;
    description: string;
    amount: string;
    currencyCode: string;
    /** vira destinationId do destino com essa cidade (ou null se não existir) */
    cityId: string;
    category: ExpenseCategory;
    dateISO: string;
  }[];
}

export const MOCK_COMPANIONS: MockCompanionProfile[] = [
  {
    email: 'marina.duarte@email.com',
    name: 'Marina Duarte',
    initials: 'MD',
    places: ['ba-don-julio', 'ba-malba', 'ba-cafe-tortoni', 'sc-bocanariz', 'sc-cerro-san-cristobal', 'atc-laguna-cejar'],
    expenses: [
      {
        key: 'marina-tatio',
        description: 'Tour Géiseres del Tatio (3 pessoas)',
        amount: '135000',
        currencyCode: 'CLP',
        cityId: 'san-pedro-de-atacama-cl',
        category: 'passeios',
        dateISO: '2026-11-25',
      },
    ],
  },
  {
    email: 'rodrigo.antunes@email.com',
    name: 'Rodrigo Antunes',
    initials: 'RA',
    places: [
      'ba-la-bombonera',
      'ba-recoleta-cemiterio',
      'sc-mercado-central',
      'sc-barrio-lastarria',
      'atc-valle-de-la-luna',
      'atc-geiseres-del-tatio',
    ],
    expenses: [
      {
        key: 'rodrigo-transfer-eze',
        description: 'Transfer Ezeiza → hotel',
        amount: '45000',
        currencyCode: 'ARS',
        cityId: 'buenos-aires-ar',
        category: 'transporte',
        dateISO: '2026-11-20',
      },
    ],
  },
];

export function findMockCompanion(email: string): MockCompanionProfile | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_COMPANIONS.find((m) => m.email === normalized);
}
