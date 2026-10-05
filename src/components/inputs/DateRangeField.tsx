import { CalendarDays, TriangleAlert } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  digitsOnly,
  formatDateRangeDigits,
  fromISODate,
  parseDateRangeDigits,
} from '../../utils/dateMask';
import { Calendar } from './Calendar';
import { Icon } from '../shell/Icon';
import textFieldStyles from './TextField.module.css';

interface DateRangeFieldProps {
  label?: string;
  /** false = campo opcional, sem "*" nem texto "(obrigatório...)". Default true — não muda Destinos. */
  required?: boolean;
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

/**
 * Campo de intervalo de datas (Date Picker do shadcn = Popover + Calendar,
 * docs/ajustes-71-...md). A máscara de digitação dd/mm/aaaa – dd/mm/aaaa
 * continua sincronizada com o calendário nos dois sentidos (ajustes 08/09).
 * Focar o campo abre o calendário sem tirar o foco dele (pra continuar
 * digitando); abrir pelo botão leva o foco pro calendário (teclado).
 */
export function DateRangeField({ label = 'Datas', required = true, startISO, endISO, onChange }: DateRangeFieldProps) {
  const [digits, setDigits] = useState(() => isoRangeToDigits(startISO, endISO));
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [openedByButton, setOpenedByButton] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const inputId = `${baseId}-date-input`;
  const errorId = `${baseId}-date-error`;
  const hintId = `${baseId}-date-hint`;

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
    <div className="flex flex-col gap-(--space-label)">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label} {required && <span aria-hidden="true">*</span>}
        <span className="visually-hidden">
          {required ? ' (obrigatório, formato dia/mês/ano até dia/mês/ano)' : ' (formato dia/mês/ano até dia/mês/ano)'}
        </span>
      </label>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className={cn(
              'flex h-11 items-center rounded-md border border-input bg-background transition-[color,box-shadow]',
              'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
              error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
            )}
          >
            <input
              id={inputId}
              className={cn(
                textFieldStyles.input,
                'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-(length:--text-base) text-foreground outline-none placeholder:text-input placeholder:opacity-100',
              )}
              inputMode="numeric"
              placeholder="dd/mm/aaaa – dd/mm/aaaa"
              value={displayValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                setOpenedByButton(false);
                setCalendarOpen(true);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : hintId}
              autoComplete="off"
            />
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => {
                setOpenedByButton(true);
                setCalendarOpen((v) => !v);
              }}
              aria-label={calendarOpen ? 'Fechar calendário' : 'Abrir calendário'}
              aria-expanded={calendarOpen}
            >
              <Icon icon={CalendarDays} />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          ref={contentRef}
          align="start"
          collisionPadding={16}
          className="w-auto rounded-xl p-1"
          // aberto pelo campo: o foco fica nele, pra digitar; pelo botão: vai pro calendário
          onOpenAutoFocus={(e) => {
            if (!openedByButton) e.preventDefault();
          }}
          // fechou com o foco dentro do calendário: volta pro botão (não deixa o foco perdido)
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const active = document.activeElement;
            if (!active || active === document.body || contentRef.current?.contains(active)) {
              toggleRef.current?.focus();
            }
          }}
          // tocar no próprio campo ou no botão não conta como "fora"
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          <Calendar startISO={startISO} endISO={endISO} onSelectRange={handleCalendarSelect} />
        </PopoverContent>
      </Popover>
      {!error && (
        <p id={hintId} className="m-0 text-(length:--text-sm) text-muted-foreground">
          Toque no campo pra digitar ou abra o calendário.
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="m-0 flex items-start gap-1 text-(length:--text-sm) font-medium text-destructive"
        >
          <Icon icon={TriangleAlert} /> {error}
        </p>
      )}
    </div>
  );
}
