/*
  Lugar que só funciona em alguns dias da semana (PlaceEntry.openDays, ajustes-95): o texto que o
  card de Sugestões e a parada do Roteiro mostram embaixo do bairro. 0 = domingo … 6 = sábado.
*/

const WEEKDAY_PLURAL = ['aos domingos', 'às segundas', 'às terças', 'às quartas', 'às quintas', 'às sextas', 'aos sábados'];

function joinDays(openDays: number[]): string {
  const names = [...openDays].sort((a, b) => a - b).map((d) => WEEKDAY_PLURAL[d]);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** "Só aos domingos" — null quando o lugar abre todo dia */
export function openDaysLabel(openDays: number[] | undefined): string | null {
  return openDays && openDays.length > 0 && openDays.length < 7 ? `Só ${joinDays(openDays)}` : null;
}

/** "Só abre aos domingos" — aviso na parada que caiu num dia em que o lugar não abre */
export function closedDayWarning(openDays: number[] | undefined): string | null {
  return openDays && openDays.length > 0 && openDays.length < 7 ? `Só abre ${joinDays(openDays)}` : null;
}
