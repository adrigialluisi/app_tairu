import { Clock } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isValidTime, maskTime } from '../../utils/dateMask';
import { TextField } from './TextField';
import { Icon } from '../shell/Icon';

interface TimeFieldProps {
  id: string;
  label: string;
  /** "hh:mm" (ou parcial enquanto digita) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** acabou de ser preenchido pela leitura de um arquivo (ajustes-84) */
  highlight?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const optionClass =
  'flex h-11 w-full flex-none cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-(length:--text-base) text-foreground hover:bg-muted aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-primary-foreground';

/**
 * Hora (ajustes-86, "Campos de data e hora" no CLAUDE.md): máscara hh:mm durante a digitação
 * ("0815" → "08:15"), teclado numérico, validação 00:00–23:59. O relógio abre um seletor simples:
 * horas e minutos de 5 em 5 (minuto quebrado, ex. 16:20 do voucher, continua digitável).
 * Reaproveita o TextField (mesma caixa, foco e destaque), com o botão no rightElement.
 */
export function TimeField({ id, label, value, onChange, placeholder = 'hh:mm', required, highlight }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  const [hh, mm] = value.split(':');
  let error: string | null = null;
  if (value.length === 5 && !isValidTime(value)) error = 'Hora inválida (00:00 a 23:59).';
  else if (touched && value.length > 0 && value.length < 5) error = 'Complete a hora (hh:mm).';

  function pickHour(h: string) {
    onChange(`${h}:${mm && mm.length === 2 ? mm : '00'}`);
  }

  function pickMinute(m: string) {
    onChange(`${hh && hh.length === 2 ? hh : '00'}:${m}`);
    setOpen(false);
  }

  return (
    <TextField
      id={id}
      label={label}
      placeholder={placeholder}
      inputMode="numeric"
      value={value}
      onChange={(v) => {
        setTouched(false);
        onChange(maskTime(v));
      }}
      onBlur={() => setTouched(true)}
      error={error}
      required={required}
      highlight={highlight}
      autoComplete="off"
      rightElement={
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={open ? 'Fechar seletor de horário' : 'Escolher horário'}
            >
              <Icon icon={Clock} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" collisionPadding={16} className="w-44 gap-1 rounded-xl p-2">
            <div className="grid grid-cols-2 gap-2">
              <div role="group" aria-label="Hora" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
                {HOURS.map((h) => (
                  <button key={h} type="button" className={optionClass} aria-pressed={h === hh} onClick={() => pickHour(h)}>
                    {h}
                  </button>
                ))}
              </div>
              <div role="group" aria-label="Minutos" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
                {MINUTES.map((m) => (
                  <button key={m} type="button" className={optionClass} aria-pressed={m === mm} onClick={() => pickMinute(m)}>
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      }
    />
  );
}
