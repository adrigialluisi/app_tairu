import { useState } from 'react';
import { fromISODate, toISODate } from '../../utils/dateMask';
import styles from './Calendar.module.css';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
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

interface CalendarProps {
  startISO: string | null;
  endISO: string | null;
  onSelectRange: (startISO: string | null, endISO: string | null) => void;
}

export function Calendar({ startISO, endISO, onSelectRange }: CalendarProps) {
  const initial = startISO ? fromISODate(startISO) : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(initial?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial ? initial.month - 1 : today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  function isoOf(date: Date): string {
    return toISODate({ day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() });
  }

  function handleClick(date: Date) {
    const iso = isoOf(date);
    if (!startISO || (startISO && endISO)) {
      onSelectRange(iso, null);
    } else if (iso < startISO) {
      onSelectRange(iso, null);
    } else {
      onSelectRange(startISO, iso);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className={styles.calendar} role="group" aria-label="Selecionar datas da viagem">
      <div className={styles.header}>
        <button type="button" className={styles.navButton} onClick={prevMonth} aria-label="Mês anterior">
          <span aria-hidden="true">‹</span>
        </button>
        <span className={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} de {viewYear}
        </span>
        <button type="button" className={styles.navButton} onClick={nextMonth} aria-label="Próximo mês">
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} className={styles.emptyCell} aria-hidden="true" />;
          const iso = isoOf(date);
          const isStart = iso === startISO;
          const isEnd = iso === endISO;
          const inRange = !!(startISO && endISO && iso > startISO && iso < endISO);
          const classes = [styles.day, isStart || isEnd ? styles.daySelected : '', inRange ? styles.dayInRange : '']
            .filter(Boolean)
            .join(' ');
          const stateLabel = isStart ? ', início selecionado' : isEnd ? ', fim selecionado' : '';
          return (
            <button
              key={iso}
              type="button"
              className={classes}
              aria-pressed={isStart || isEnd}
              aria-label={`${date.getDate()} de ${MONTH_NAMES[viewMonth]} de ${viewYear}${stateLabel}`}
              onClick={() => handleClick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
