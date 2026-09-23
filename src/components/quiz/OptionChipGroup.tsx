import type { KeyboardEvent } from 'react';
import styles from './OptionChipGroup.module.css';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
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
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + options.length) % options.length;
    const nextOption = options[nextIndex];
    onChange(nextOption.value);
    const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
    (buttons?.[nextIndex] as HTMLButtonElement | undefined)?.focus();
  }

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options} role="radiogroup" aria-label={legend}>
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (!value && index === 0) ? 0 : -1}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
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
