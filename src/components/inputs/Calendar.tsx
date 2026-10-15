import { ptBR } from 'react-day-picker/locale';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { fromISODate, toISODate } from '../../utils/dateMask';

interface CalendarProps {
  startISO: string | null;
  endISO: string | null;
  onSelectRange: (startISO: string | null, endISO: string | null) => void;
  /** 'single' (DateField, ajustes-86): um dia só — onSelectRange(dia, null) */
  mode?: 'range' | 'single';
  /** mês em que o calendário abre quando ainda não há data (ex.: o mês da viagem) */
  defaultMonthISO?: string | null;
}

function toDate(iso: string): Date {
  const { day, month, year } = fromISODate(iso);
  return new Date(year, month - 1, day);
}

function isoOf(date: Date): string {
  return toISODate({ day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() });
}

/**
 * Calendário de intervalo (Calendar do shadcn = react-day-picker, docs/ajustes-71-...md),
 * em português: meses e dias da semana do pt-BR, semana começando no domingo,
 * cabeçalho "outubro de 2026" e letras D S T Q Q S S, como antes. Cada dia tem
 * 44px de toque.
 *
 * O clique segue a regra de sempre (não a do react-day-picker): sem início, ou
 * com o intervalo já completo, o dia vira o novo início; dia antes do início
 * também vira início; senão, vira o fim. Datas que se tocam entre destinos
 * continuam permitidas — quem valida sobreposição é a tela de Destinos.
 */
export function Calendar({ startISO, endISO, onSelectRange, mode = 'range', defaultMonthISO = null }: CalendarProps) {
  const from = startISO ? toDate(startISO) : undefined;
  const to = endISO ? toDate(endISO) : undefined;

  function handleDay(date: Date) {
    const iso = isoOf(date);
    if (!startISO || endISO || iso < startISO) onSelectRange(iso, null);
    else onSelectRange(startISO, iso);
  }

  const shared = {
    locale: ptBR,
    weekStartsOn: 0 as const,
    showOutsideDays: false,
    defaultMonth: from ?? (defaultMonthISO ? toDate(defaultMonthISO) : undefined),
    formatters: {
      formatCaption: (month: Date) =>
        `${month.toLocaleDateString('pt-BR', { month: 'long' })} de ${month.getFullYear()}`,
      formatWeekdayName: (weekday: Date) => weekday.toLocaleDateString('pt-BR', { weekday: 'narrow' }),
    },
    className: '[--cell-size:--spacing(11)]',
  };

  if (mode === 'single') {
    return (
      <UiCalendar
        {...shared}
        mode="single"
        // required: tocar de novo no dia escolhido não desmarca (apagar é no campo)
        required
        selected={from}
        onSelect={(date) => onSelectRange(isoOf(date), null)}
        aria-label="Selecionar data"
      />
    );
  }

  return (
    <UiCalendar
      {...shared}
      mode="range"
      selected={from ? { from, to } : undefined}
      onSelect={(_range, triggerDate) => handleDay(triggerDate)}
      aria-label="Selecionar datas da viagem"
    />
  );
}
