import { useId } from 'react';
import { Check } from 'lucide-react';
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
          return (
            <ToggleGroupItem key={option.value} value={option.value} className={chipItemClass}>
              {selected ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                option.icon && <option.icon className="size-4" aria-hidden="true" />
              )}
              {option.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </FieldSet>
  );
}
