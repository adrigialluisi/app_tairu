/**
 * SIMULAÇÃO — dados de convidados fictícios do cenário fixo de teste. Não há
 * backend; nada aqui vem de outra pessoa de verdade.
 *
 * Desde o ajustes-89 (que substitui a entrada automática de 2,5 s do ajustes-67): todo convite
 * fica em "Convite enviado" e só estes dois e-mails "entram" quando o moderador aciona "Simular:
 * 2 dias depois" (toque longo no seletor iOS/Android). Aí trazem 1 lugar por cidade cada (ids
 * reais de places.json, nada inventado) e gastos que só existem se fizerem sentido na viagem
 * (`requires`). Os valores dos gastos são plausíveis e SIMULADOS. A visão do convidado é outro
 * protótipo.
 */
import type { ExpenseCategory } from '../context/TripContext';

/**
 * Condição pra um gasto simulado existir (ajustes-89): olhada uma vez, no momento da simulação.
 * - transport-arrival: um voo/ônibus/trem da Central chega na cidade;
 * - stay: uma hospedagem da Central fica na cidade;
 * - place: o lugar está no roteiro.
 */
export type MockRequirement =
  | { type: 'transport-arrival'; cityId: string }
  | { type: 'stay'; cityId: string }
  | { type: 'place'; placeId: string };

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
    /** vira destinationId do destino com essa cidade */
    cityId: string;
    category: ExpenseCategory;
    /** dia do gasto no cenário fixo (ajustes-92: 14 a 27/11/2026) */
    dateISO: string;
    /** basta UMA das condições existir na viagem */
    requires: MockRequirement[];
  }[];
}

export const MOCK_COMPANIONS: MockCompanionProfile[] = [
  {
    email: 'marina.duarte@email.com',
    name: 'Marina Duarte',
    initials: 'MD',
    places: ['ba-don-julio', 'sc-bocanariz', 'atc-laguna-cejar'],
    expenses: [
      {
        key: 'marina-laguna-cejar',
        description: 'Tour Laguna Cejar (3 pessoas)',
        // SIMULADO: CLP 35.000 por pessoa (tour de meio dia com a entrada), 3 pessoas
        amount: '105000',
        currencyCode: 'CLP',
        cityId: 'san-pedro-de-atacama-cl',
        category: 'passeios',
        dateISO: '2026-11-25',
        requires: [{ type: 'place', placeId: 'atc-laguna-cejar' }],
      },
    ],
  },
  {
    email: 'rodrigo.antunes@email.com',
    name: 'Rodrigo Antunes',
    initials: 'RA',
    places: ['ba-la-bombonera', 'sc-mercado-central', 'atc-valle-de-la-luna'],
    expenses: [
      {
        key: 'rodrigo-transfer-eze',
        description: 'Transfer Ezeiza → hotel',
        // SIMULADO
        amount: '45000',
        currencyCode: 'ARS',
        cityId: 'buenos-aires-ar',
        category: 'transporte',
        // dia da chegada em Buenos Aires
        dateISO: '2026-11-14',
        requires: [
          { type: 'transport-arrival', cityId: 'buenos-aires-ar' },
          { type: 'stay', cityId: 'buenos-aires-ar' },
        ],
      },
    ],
  },
];

export function findMockCompanion(email: string): MockCompanionProfile | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_COMPANIONS.find((m) => m.email === normalized);
}
