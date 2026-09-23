const RANGE_SEPARATOR = ' – ';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16);
}

function formatSingleDateDigits(d: string): string {
  let out = '';
  if (d.length > 0) out += d.slice(0, 2);
  if (d.length > 2) out += '/' + d.slice(2, 4);
  if (d.length > 4) out += '/' + d.slice(4, 8);
  return out;
}

/** Aplica a máscara dd/mm/aaaa – dd/mm/aaaa a partir de uma string só de dígitos. */
export function formatDateRangeDigits(digits: string): string {
  const first = digits.slice(0, 8);
  const second = digits.slice(8, 16);
  let out = formatSingleDateDigits(first);
  if (second.length > 0) out += RANGE_SEPARATOR + formatSingleDateDigits(second);
  return out;
}

export interface CalendarDate {
  day: number;
  month: number; // 1-12
  year: number;
}

/** Valida se dia/mês/ano formam uma data real (rejeita 31/02, 30/02 etc.). */
export function isValidCalendarDate({ day, month, year }: CalendarDate): boolean {
  if (month < 1 || month > 12) return false;
  if (year < 1000 || year > 9999) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseSingleDateDigits(d: string): CalendarDate | null {
  if (d.length !== 8) return null;
  const day = Number(d.slice(0, 2));
  const month = Number(d.slice(2, 4));
  const year = Number(d.slice(4, 8));
  return { day, month, year };
}

export function toISODate({ day, month, year }: CalendarDate): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const yyyy = String(year).padStart(4, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromISODate(iso: string): CalendarDate {
  const [year, month, day] = iso.split('-').map(Number);
  return { day, month, year };
}

export function formatISOToDisplay(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  return formatSingleDateDigits(`${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`);
}

const WEEKDAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/**
 * Dia da semana + data completa (ex.: "Terça-feira, 08/09/2026"). Não usa
 * Date.toLocaleDateString de propósito — já teve inconsistência de
 * timezone/locale entre navegador e SO em telas anteriores; tabela fixa
 * evita esse risco.
 */
export function formatISOToWeekdayDisplay(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  const weekday = WEEKDAYS_PT[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${formatISOToDisplay(iso)}`;
}

const MONTHS_ABBREV_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Mês abreviado (3 letras, PT) + número do dia — usado nos pills de data do Roteiro. */
export function formatISOToDayPill(iso: string): { monthAbbrev: string; day: string } {
  const { day, month } = fromISODate(iso);
  return { monthAbbrev: MONTHS_ABBREV_PT[month - 1], day: String(day) };
}

export interface DateRangeParseResult {
  startISO: string | null;
  endISO: string | null;
  /** null enquanto a digitação está incompleta (sem erro ainda a mostrar) */
  error: string | null;
  complete: boolean;
}

/** Interpreta a string mascarada digitada e retorna as datas (ou erro). */
export function parseDateRangeDigits(digits: string): DateRangeParseResult {
  const firstDigits = digits.slice(0, 8);
  const secondDigits = digits.slice(8, 16);

  if (firstDigits.length < 8) {
    return { startISO: null, endISO: null, error: null, complete: false };
  }

  const first = parseSingleDateDigits(firstDigits);
  if (!first || !isValidCalendarDate(first)) {
    return { startISO: null, endISO: null, error: 'Data de início inválida.', complete: false };
  }

  if (secondDigits.length < 8) {
    return { startISO: toISODate(first), endISO: null, error: null, complete: false };
  }

  const second = parseSingleDateDigits(secondDigits);
  if (!second || !isValidCalendarDate(second)) {
    return { startISO: toISODate(first), endISO: null, error: 'Data final inválida.', complete: false };
  }

  const startISO = toISODate(first);
  const endISO = toISODate(second);
  if (endISO < startISO) {
    return { startISO, endISO: null, error: 'A data final não pode ser antes da data de início.', complete: false };
  }

  return { startISO, endISO, error: null, complete: true };
}
