import { CalendarDays, CircleAlert, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  digitsOnly,
  formatISOToDisplay,
  isoToDigits,
  maskSingleDate,
  parseSingleDate,
} from '../../utils/dateMask';
import { Calendar } from './Calendar';
import { Icon } from '../shell/Icon';
import textFieldStyles from './TextField.module.css';

export interface TripDateRange {
  startISO: string | null;
  endISO: string | null;
}

interface DateFieldProps {
  /** id do <input>; sem ele, um id gerado */
  id?: string;
  label: string;
  /** default false: quase toda data única do app é opcional */
  required?: boolean;
  valueISO: string | null;
  onChange: (iso: string | null) => void;
  /**
   * Datas da viagem: o calendário abre no mês do início e a data fora dela ganha um AVISO (não um
   * erro, não bloqueia). Documentos não passam — documento não é da viagem.
   */
  tripRange?: TripDateRange | null;
  /** acabou de ser preenchido pela leitura de um arquivo (ajustes-84) */
  highlight?: boolean;
  /** avisa quem usa quando a data digitada está completa mas não existe (ex.: 31/02), pra travar o salvar */
  onInvalidChange?: (invalid: boolean) => void;
}

/**
 * Data única (ajustes-86, "Campos de data e hora" no CLAUDE.md), derivada do DateRangeField: a
 * mesma máscara durante a digitação (só números, as barras entram sozinhas: "20112026" →
 * "20/11/2026") e o mesmo calendário em popover, sincronizados nos dois sentidos. Focar o campo
 * abre o calendário sem tirar o foco dele; abrir pelo botão leva o foco pro calendário.
 */
export function DateField({
  id,
  label,
  required = false,
  valueISO,
  onChange,
  tripRange = null,
  highlight = false,
  onInvalidChange,
}: DateFieldProps) {
  const [digits, setDigits] = useState(() => isoToDigits(valueISO));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [openedByButton, setOpenedByButton] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-date`;
  const messageId = `${inputId}-message`;

  const { error } = parseSingleDate(digits);

  // valor mudou de fora (leitura de voucher, data de chegada copiada da partida): o campo acompanha.
  // Digitação incompleta manda null, que bate com o que está digitado — aí não mexe.
  useEffect(() => {
    if (parseSingleDate(digits).iso !== valueISO && !(valueISO === null && digits.length < 8)) {
      setDigits(isoToDigits(valueISO));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueISO]);

  function handleInputChange(raw: string) {
    const next = digitsOnly(raw).slice(0, 8);
    setDigits(next);
    const parsed = parseSingleDate(next);
    onInvalidChange?.(!!parsed.error);
    onChange(parsed.iso);
  }

  function handleCalendarSelect(iso: string | null) {
    setDigits(isoToDigits(iso));
    onInvalidChange?.(false);
    onChange(iso);
    setCalendarOpen(false);
  }

  let warning: string | null = null;
  if (valueISO && tripRange?.startISO && valueISO < tripRange.startISO) {
    warning = `Essa data é antes do início da viagem (${formatISOToDisplay(tripRange.startISO).slice(0, 5)}). Confere?`;
  } else if (valueISO && tripRange?.endISO && valueISO > tripRange.endISO) {
    warning = `Essa data é depois do fim da viagem (${formatISOToDisplay(tripRange.endISO).slice(0, 5)}). Confere?`;
  }

  return (
    <div className="flex min-w-0 flex-col gap-(--space-label)">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
        {required && <span aria-hidden="true"> *</span>}
        <span className="visually-hidden">{required ? ' (obrigatório, formato dia/mês/ano)' : ' (formato dia/mês/ano)'}</span>
      </label>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className={cn(
              'flex h-11 items-center rounded-md border border-input bg-background transition-[color,box-shadow,background-color] duration-300 motion-reduce:transition-none',
              highlight && 'bg-accent-soft',
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
              placeholder="dd/mm/aaaa"
              value={maskSingleDate(digits)}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                setOpenedByButton(false);
                setCalendarOpen(true);
              }}
              aria-invalid={!!error}
              aria-describedby={error || warning ? messageId : undefined}
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
          onOpenAutoFocus={(e) => {
            if (!openedByButton) e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const active = document.activeElement;
            if (!active || active === document.body || contentRef.current?.contains(active)) {
              toggleRef.current?.focus();
            }
          }}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          <Calendar
            mode="single"
            startISO={valueISO}
            endISO={null}
            defaultMonthISO={tripRange?.startISO ?? null}
            onSelectRange={(iso) => handleCalendarSelect(iso)}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p id={messageId} role="alert" className="m-0 flex items-start gap-1 text-(length:--text-sm) font-medium text-destructive">
          <Icon icon={TriangleAlert} /> {error}
        </p>
      )}
      {/* aviso, não erro: cor de atenção, sem role="alert" e sem impedir salvar (ajustes-86) */}
      {!error && warning && (
        <p id={messageId} className="m-0 flex items-start gap-1 text-(length:--text-sm) font-medium text-warning">
          <Icon icon={CircleAlert} /> {warning}
        </p>
      )}
    </div>
  );
}
