import { useEffect, useId, useRef, useState } from 'react';
import {
  digitsOnly,
  formatDateRangeDigits,
  fromISODate,
  parseDateRangeDigits,
} from '../../utils/dateMask';
import { Calendar } from './Calendar';
import styles from './DateRangeField.module.css';

interface DateRangeFieldProps {
  label?: string;
  startISO: string | null;
  endISO: string | null;
  onChange: (startISO: string | null, endISO: string | null) => void;
}

function isoRangeToDigits(startISO: string | null, endISO: string | null): string {
  let out = '';
  if (startISO) {
    const { day, month, year } = fromISODate(startISO);
    out += `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
  }
  if (endISO) {
    const { day, month, year } = fromISODate(endISO);
    out += `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
  }
  return out;
}

export function DateRangeField({ label = 'Datas', startISO, endISO, onChange }: DateRangeFieldProps) {
  const [digits, setDigits] = useState(() => isoRangeToDigits(startISO, endISO));
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const inputId = `${baseId}-date-input`;
  const errorId = `${baseId}-date-error`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  function handleInputChange(rawValue: string) {
    const nextDigits = digitsOnly(rawValue);
    setDigits(nextDigits);

    if (nextDigits.length === 0) {
      setError(null);
      onChange(null, null);
      return;
    }

    const parsed = parseDateRangeDigits(nextDigits);
    setError(parsed.error);
    // Propaga assim que a data de início já é válida (mesmo com a data
    // final ainda incompleta), pra manter o calendário sincronizado com o
    // que já foi digitado — não só quando o intervalo inteiro fecha.
    if (!parsed.error) {
      onChange(parsed.startISO, parsed.endISO);
    }
  }

  function handleCalendarSelect(nextStart: string | null, nextEnd: string | null) {
    setDigits(isoRangeToDigits(nextStart, nextEnd));
    setError(null);
    onChange(nextStart, nextEnd);
    if (nextStart && nextEnd) setCalendarOpen(false);
  }

  const displayValue = digits.length > 0 ? formatDateRangeDigits(digits) : '';

  return (
    <div className={styles.field} ref={wrapRef}>
      <label htmlFor={inputId} className={styles.label}>
        {label} <span aria-hidden="true">*</span>
        <span className="visually-hidden"> (obrigatório, formato dia/mês/ano até dia/mês/ano)</span>
      </label>
      <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''}`}>
        <input
          id={inputId}
          className={styles.input}
          inputMode="numeric"
          placeholder="dd/mm/aaaa – dd/mm/aaaa"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setCalendarOpen(true)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.calendarToggle}
          onClick={() => setCalendarOpen((v) => !v)}
          aria-label={calendarOpen ? 'Fechar calendário' : 'Abrir calendário'}
          aria-expanded={calendarOpen}
        >
          <span aria-hidden="true">📅</span>
        </button>
      </div>
      {!error && <p className={styles.hint}>Toque no campo pra digitar ou abra o calendário.</p>}
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
      {calendarOpen && (
        <div className={styles.popover}>
          <Calendar startISO={startISO} endISO={endISO} onSelectRange={handleCalendarSelect} />
        </div>
      )}
    </div>
  );
}
