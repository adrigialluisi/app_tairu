import type { ExpenseCategory } from '../context/TripContext';

/*
  Leitura SIMULADA da foto da nota em Custos (docs/ajustes-90-custos-nota-e-acertos.md, seção 1),
  no mesmo padrão dos vouchers (src/data/mockVouchers.ts, ajustes-84): não existe OCR, backend
  nem IA — o app "lê" pelo nome do arquivo (nome exato, sem diferenciar maiúsculas).
  1. nota de exemplo conhecida (public/mock-receipts/, também no kit do participante) → os dados
     impressos nela;
  2. qualquer outro arquivo, pelo CONTEXTO do cenário (ajustes-96, muda a regra do ajustes-90 de
     nunca preencher o valor): no teste pelo celular a nota do kit chega pela galeria com outro nome
     (IMG_1234.jpg), comprimida pelo WhatsApp. Em "Lançar gasto" (Custos), qualquer foto ou PDF vira
     a nota do Don Julio (ARS 120.000, 15/11) — ou a do Bocanáriz, se o "Onde foi?" já for Santiago.
  3. Aberto pela parada do Roteiro (`fromStop`): continua sem inventar — o formulário já vem com o
     lugar, a cidade e o dia da parada e só pede o total.
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

/** nota de exemplo por cidade do "Onde foi?"; sem cidade (ou sem nota da cidade), a do Don Julio */
const RECEIPT_BY_CITY: Record<string, string> = {
  'buenos-aires-ar': 'nota-don-julio-buenosaires.jpg',
  'santiago-cl': 'nota-bocanariz-santiago.jpg',
};
const DEFAULT_RECEIPT = 'nota-don-julio-buenosaires.jpg';

/**
 * A nota que o arquivo é: pelo nome (nota do kit) ou, se não bater, pelo contexto (ajustes-96).
 * null só quando o formulário foi aberto pela parada do Roteiro e o arquivo não é uma nota do kit.
 */
export function readReceiptFile(
  file: Pick<File, 'name'>,
  context: { cityId?: string | null; fromStop?: boolean } = {},
): ReceiptFields | null {
  const known = MOCK_RECEIPTS[file.name.toLowerCase()];
  if (known) return known;
  if (context.fromStop) return null;
  return MOCK_RECEIPTS[(context.cityId && RECEIPT_BY_CITY[context.cityId]) || DEFAULT_RECEIPT];
}
