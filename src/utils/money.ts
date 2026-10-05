import rates from '../data/exchangeRates.json';
import { formatISOToDisplay } from './dateMask';

/**
 * Conversão com cotação REAL e FIXA (src/data/exchangeRates.json, base BRL:
 * quanto 1 real vale em cada moeda). Nunca apresentar como câmbio "ao vivo":
 * a data (RATES_AS_OF) aparece sempre que houver conversão. Ver
 * docs/ajustes-61-custos-lancamentos-e-rateio.md.
 */
const RATES: Record<string, number> = rates.rates;

export const RATES_AS_OF: string = formatISOToDisplay(rates.asOf);
export const RATES_SOURCE_LABEL: string = rates.sourceLabel;

/** "1.234,56" | "1234,56" | "1234.56" | "450" → número; vazio/inválido → null */
export function parseAmount(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, '');
  if (!trimmed) return null;
  let normalized: string;
  if (trimmed.includes(',')) {
    // formato BR: ponto é milhar, vírgula é decimal
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+\.\d{1,2}$/.test(trimmed)) {
    normalized = trimmed;
  } else {
    normalized = trimmed.replace(/\./g, '');
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Moeda sem cotação → null (a interface mostra "sem conversão", nunca inventa). */
export function toBRL(amount: number, currencyCode: string): number | null {
  const rate = RATES[currencyCode];
  return rate ? amount / rate : null;
}

export function fromBRL(amountBRL: number, currencyCode: string): number | null {
  const rate = RATES[currencyCode];
  return rate ? amountBRL * rate : null;
}

/** amount em `from` → `to`, passando pela base BRL. null se faltar cotação. */
export function convert(amount: number, from: string, to: string): number | null {
  const rateFrom = RATES[from];
  const rateTo = RATES[to];
  return rateFrom && rateTo ? (amount / rateFrom) * rateTo : null;
}

export function hasRate(currencyCode: string): boolean {
  return Boolean(RATES[currencyCode]);
}

/** Quantas unidades da moeda valem 1 real (ex.: ARS → 293,56) — usado pra escolher a escala da tabela de referência. */
export function unitsPerBRL(currencyCode: string): number | null {
  return RATES[currencyCode] ?? null;
}

/**
 * Taxa unitária: abaixo de 1 mostra 2 algarismos significativos (0,0034;
 * 0,00029), senão 2 casas. `currencyCode` opcional → só o número.
 */
export function formatRate(value: number, currencyCode?: string): string {
  const digits: Intl.NumberFormatOptions =
    value < 1 ? { maximumSignificantDigits: 2 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (!currencyCode) return value.toLocaleString('pt-BR', digits);
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode, ...digits }).format(value);
  } catch {
    return `${currencyCode} ${value.toLocaleString('pt-BR', digits)}`;
  }
}

/** "R$ 1.234,56", "ARS 12.000,00" */
export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    // código fora do padrão ISO aceito pelo Intl — mostra o número com o código ao lado
    return `${currencyCode} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
