import { useId, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ChipOption } from './OptionChipGroup';
import { chipFieldsetClass, chipGroupClass, chipItemClass, chipLegendClass } from './chipClasses';

interface MultiOptionChipGroupProps<T extends string> {
  legend: string;
  options: ChipOption<T>[];
  values: T[];
  onToggle: (value: T) => void;
  /** texto auxiliar logo abaixo do legend (ex.: pra que serve a pergunta) */
  hint?: string;
  /** chips com "×" pra tirar da lista (ex.: pessoa de fora no "Dividir com", ajustes-95c) */
  removableValues?: T[];
  onRemove?: (value: T) => void;
  /** algo no fim da fileira de chips, depois do último (ex.: "+ Outra pessoa") */
  trailing?: ReactNode;
}

/**
 * Mesmo visual de chip do OptionChipGroup (mesmas classes, chipClasses.ts) —
 * mas aqui vários chips podem ficar marcados ao mesmo tempo: ToggleGroup
 * `type="multiple"` do shadcn, em que cada chip é um botão liga/desliga
 * (aria-pressed).
 */
export function MultiOptionChipGroup<T extends string>({
  legend,
  options,
  values,
  onToggle,
  hint,
  removableValues = [],
  onRemove,
  trailing,
}: MultiOptionChipGroupProps<T>) {
  const hintId = useId();

  // o ToggleGroup devolve a lista nova inteira; a API daqui avisa só qual chip mudou
  function handleValueChange(next: string[]) {
    const changed =
      next.find((v) => !values.includes(v as T)) ?? values.find((v) => !next.includes(v));
    if (changed) onToggle(changed as T);
  }

  return (
    <FieldSet className={chipFieldsetClass}>
      <FieldLegend className={chipLegendClass}>
        {legend}
        <span className="visually-hidden"> (pode marcar mais de uma opção)</span>
      </FieldLegend>
      {hint && (
        <p id={hintId} className="mt-1 mb-0 text-(length:--text-sm) leading-[1.4] text-muted-foreground">
          {hint}
        </p>
      )}
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={2}
        className={chipGroupClass}
        aria-label={legend}
        aria-describedby={hint ? hintId : undefined}
        value={values}
        onValueChange={handleValueChange}
      >
        {options.map((option) => {
          const selected = values.includes(option.value);
          const removable = !!onRemove && removableValues.includes(option.value);
          const chip = (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className={cn(chipItemClass, removable && 'pr-10')}
            >
              {selected ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                option.icon && <option.icon className="size-4" aria-hidden="true" />
              )}
              {option.label}
            </ToggleGroupItem>
          );
          if (!removable) return chip;
          /*
            "×" por cima da ponta direita do chip (irmão, não filho: botão dentro de botão não vale).
            28px visíveis + ::before até 44px de toque; texto stone-900 no branco e no --accent-soft.
          */
          return (
            <span key={option.value} className="relative inline-flex">
              {chip}
              <button
                type="button"
                className="absolute top-1/2 right-1.5 z-10 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground before:absolute before:-inset-2 before:content-[''] hover:bg-muted"
                aria-label={`Remover ${option.label}`}
                onClick={() => onRemove(option.value)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </span>
          );
        })}
        {trailing}
      </ToggleGroup>
    </FieldSet>
  );
}
