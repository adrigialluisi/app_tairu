import { Check, type LucideIcon } from 'lucide-react';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { chipFieldsetClass, chipGroupClass, chipItemClass, chipLegendClass } from './chipClasses';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  /** ícone lucide opcional antes do rótulo (ex.: tipo de transporte) — decorativo, o rótulo é que diz o que é */
  icon?: LucideIcon;
}

interface OptionChipGroupProps<T extends string> {
  legend: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function OptionChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: OptionChipGroupProps<T>) {
  return (
    <FieldSet className={chipFieldsetClass}>
      <FieldLegend className={chipLegendClass}>{legend}</FieldLegend>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        className={chipGroupClass}
        aria-label={legend}
        value={value ?? ''}
        // o ToggleGroup single manda valor vazio ao tocar de novo no chip marcado;
        // aqui isso repete o valor atual, como antes da onda 1 (cada toque chamava
        // onChange com o chip tocado): quem não desmarca recebe o mesmo valor e nada
        // muda; quem desmarca (ex.: "Onde foi?" no visualizador de fotos) desmarca
        onValueChange={(next) => {
          if (next) onChange(next as T);
          else if (value) onChange(value);
        }}
      >
        {options.map((option) => {
          const selected = option.value === value;
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
