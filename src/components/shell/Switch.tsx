import { useId, type ReactNode } from 'react';
import { Switch as UiSwitch } from '@/components/ui/switch';

interface SwitchProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** texto auxiliar abaixo (ligado ao switch via aria-describedby) */
  hint?: ReactNode;
}

/**
 * Liga/desliga (role="switch"), alvo de 44px (a linha toda) — usado em Retrospectiva ("Mostrar gastos") e Meus documentos ("Acesso").
 * Miolo: Switch do shadcn (Radix, ver docs/ajustes-70-...md). O <label> envolve o trilho e o texto, então tocar no
 * texto também liga/desliga, como antes. Trilho com borda funcional (--field-border, 3:1+) — o estado também vem do
 * aria-checked e da posição da bolinha, nunca só da cor. Visual shadcn (docs/ajustes-72-...md): trilho 44×24 sem borda,
 * stone-500 desligado (4.8:1 no branco) e bordô ligado, bolinha branca.
 */
export function Switch({ label, checked, onChange, hint }: SwitchProps) {
  const hintId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-(length:--text-base) font-medium text-foreground">
        <UiSwitch
          checked={checked}
          onCheckedChange={onChange}
          aria-describedby={hint ? hintId : undefined}
          className="border-0 focus-visible:ring-0 data-checked:bg-primary data-unchecked:bg-input data-[size=default]:h-6 data-[size=default]:w-11"
          thumbClassName="ml-0.5 bg-background shadow-sm group-data-[size=default]/switch:size-5 group-data-[size=default]/switch:data-checked:translate-x-5"
        />
        <span className="flex-1">{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="m-0 text-(length:--text-sm) text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
