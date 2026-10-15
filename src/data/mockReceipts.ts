import type { ExpenseCategory } from '../context/TripContext';

/*
  Leitura SIMULADA da foto da nota em Custos (docs/ajustes-90-custos-nota-e-acertos.md, seção 1),
  no mesmo padrão dos vouchers (src/data/mockVouchers.ts, ajustes-84): não existe OCR, backend
  nem IA — o app "lê" pelo nome do arquivo (nome exato, sem diferenciar maiúsculas).
  1. nota de exemplo conhecida (public/mock-receipts/, também no kit do participante) → os dados
     impressos nela;
  2. qualquer outro arquivo → NADA da nota: o valor nunca é inventado. O formulário só reaproveita
     o que já sabe do contexto (a parada do Roteiro, se foi aberto por ela) e pede o total.
*/

export interface ReceiptFields {
  description: string;
  /** vira o destino da viagem com essa cidade ("Onde foi?") */
  cityId: string;
  amount: string;
  currencyCode: string;
  category: ExpenseCategory;
  /** yyyy-mm-dd */
  dateISO: string;
}

/** valores conferidos nas imagens de public/mock-receipts/ (documentos de exemplo, não notas reais) */
const MOCK_RECEIPTS: Record<string, ReceiptFields> = {
  'nota-don-julio-buenosaires.jpg': {
    description: 'Don Julio',
    cityId: 'buenos-aires-ar',
    amount: '120000',
    currencyCode: 'ARS',
    category: 'alimentacao',
    dateISO: '2026-11-15',
  },
  'nota-bocanariz-santiago.jpg': {
    description: 'Bocanáriz',
    cityId: 'santiago-cl',
    amount: '89900',
    currencyCode: 'CLP',
    category: 'alimentacao',
    dateISO: '2026-11-21',
  },
};

/** a nota de exemplo que o arquivo é, ou null (qualquer outro arquivo: não dá pra ler o valor) */
export function readReceiptFile(file: Pick<File, 'name'>): ReceiptFields | null {
  return MOCK_RECEIPTS[file.name.toLowerCase()] ?? null;
}
