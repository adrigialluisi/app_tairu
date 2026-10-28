const RANGE_SEPARATOR = ' – ';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16);
}

/** Só dígitos, no máximo 4, insere ":" depois do 2º ("1500" -> "15:00"). Quem valida é o TimeField (isValidTime). */
export function maskTime(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** "08:15" completo e dentro de 00:00–23:59 */
export function isValidTime(value: string): boolean {
  const m = value.match(/^(\d{2}):(\d{2})$/);
  return !!m && Number(m[1]) <= 23 && Number(m[2]) <= 59;
}

function formatSingleDateDigits(d: string): string {
  let out = '';
  if (d.length > 0) out += d.slice(0, 2);
  if (d.length > 2) out += '/' + d.slice(2, 4);
  if (d.length > 4) out += '/' + d.slice(4, 8);
  return out;
}

/** Máscara de digitação dd/mm/aaaa pra campos de data única (sem calendário — ver docs/ajustes-54-meus-documentos.md). */
export function maskSingleDate(value: string): string {
  return formatSingleDateDigits(digitsOnly(value).slice(0, 8));
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

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "Sábado, 21 de novembro" — cabeçalho de dia do Roteiro (mesma tabela fixa, sem toLocaleDateString). */
export function formatISOToLongWeekday(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  const weekday = WEEKDAYS_PT[new Date(year, month - 1, day).getDay()].replace('-feira', '');
  return `${weekday}, ${day} de ${MONTHS_PT[month - 1]}`;
}

/** "Sáb, 21/11" — rótulo curto de dia (Memórias, grupos e pills). */
export function formatISOToShortDay(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  const weekday = WEEKDAYS_PT[new Date(year, month - 1, day).getDay()].slice(0, 3);
  return `${weekday}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

/** "dom, 15/11" — toast "Adicionado a dom, 15/11" das Sugestões (ajustes-101) */
export function formatISOToAgendaDay(iso: string): string {
  return formatISOToShortDay(iso).toLowerCase();
}

/** "Sexta, 20/11" — rótulo de dia antes dos eventos daquele dia no carrossel (ajustes-80). */
export function formatISOToWeekdayShortDate(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  const weekday = WEEKDAYS_PT[new Date(year, month - 1, day).getDay()].replace('-feira', '');
  return `${weekday}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

/** "SÁB" — dia da semana abreviado, pro bloco de data do card de evento. */
export function formatISOToWeekdayAbbrev(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  return WEEKDAYS_PT[new Date(year, month - 1, day).getDay()].slice(0, 3).toUpperCase();
}

const MONTHS_ABBREV_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Mês abreviado (3 letras, PT) + número do dia — usado nos pills de data do Roteiro. */
const MONTHS_SHORT_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Mês e ano de uma viagem, pela data de início e de fim (ajustes-95, tag das viagens passadas):
 * "Mai 2026"; "Mai – Jun 2026"; "Dez 2025 – Jan 2026".
 */
export function formatMonthYearRange(startISO: string, endISO: string): string {
  const [startYear, startMonth] = startISO.split('-').map(Number);
  const [endYear, endMonth] = endISO.split('-').map(Number);
  const start = MONTHS_SHORT_PT[startMonth - 1];
  const end = MONTHS_SHORT_PT[endMonth - 1];
  if (startYear !== endYear) return `${start} ${startYear} – ${end} ${endYear}`;
  if (startMonth !== endMonth) return `${start} – ${end} ${endYear}`;
  return `${start} ${endYear}`;
}

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

/** ISO → só dígitos ddmmaaaa (estado de digitação do DateField) */
export function isoToDigits(iso: string | null): string {
  if (!iso) return '';
  const { day, month, year } = fromISODate(iso);
  return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
}

/** Data única digitada (só dígitos): ISO quando completa e válida; erro quando completa e inválida. */
export function parseSingleDate(digits: string): { iso: string | null; error: string | null } {
  const d = parseSingleDateDigits(digits.slice(0, 8));
  if (!d) return { iso: null, error: null };
  if (!isValidCalendarDate(d)) return { iso: null, error: 'Data inválida.' };
  return { iso: toISODate(d), error: null };
}

/** "dd/mm/aaaa" (como Documentos guarda) → ISO, ou null */
export function displayToISO(value: string): string | null {
  return parseSingleDate(digitsOnly(value)).iso;
}

/**
 * Transporte guarda data e hora juntas, "22/11/2026 14:00" (o formato que a Agenda do dia lê).
 * A tela mostra dois campos (DateField + TimeField, ajustes-86): estas duas funções fazem a ponte.
 */
export function splitDisplayDateTime(value: string): { dateISO: string | null; time: string } {
  const v = value.trim();
  const m = v.match(/^(\d{2}\/\d{2}\/\d{4})?\s*(\d{1,2}:?\d{0,2})?$/);
  if (!m) return { dateISO: null, time: '' };
  return { dateISO: m[1] ? displayToISO(m[1]) : null, time: m[2] ? maskTime(m[2]) : '' };
}

export function joinDisplayDateTime(dateISO: string | null, time: string): string {
  return [dateISO ? formatISOToDisplay(dateISO) : '', time].filter(Boolean).join(' ');
}
