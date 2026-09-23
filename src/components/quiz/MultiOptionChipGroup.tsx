import type { ChipOption } from './OptionChipGroup';
import styles from './OptionChipGroup.module.css';

interface MultiOptionChipGroupProps<T extends string> {
  legend: string;
  options: ChipOption<T>[];
  values: T[];
  onToggle: (value: T) => void;
}

/**
 * Mesmo padrão visual de chip do OptionChipGroup (reaproveita o mesmo CSS
 * Module) — mas aqui vários chips podem ficar marcados ao mesmo tempo, por
 * isso os botões são role="checkbox" dentro de um role="group", não
 * role="radio" dentro de um role="radiogroup".
 */
export function MultiOptionChipGroup<T extends string>({
  legend,
  options,
  values,
  onToggle,
}: MultiOptionChipGroupProps<T>) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        {legend}
        <span className="visually-hidden"> (pode marcar mais de uma opção)</span>
      </legend>
      <div className={styles.options} role="group" aria-label={legend}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={selected}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
              onClick={() => onToggle(option.value)}
            >
              {selected && (
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
