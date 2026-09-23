import { currencies } from '../../data';
import styles from './CurrencySelect.module.css';

interface CurrencySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
}

export function CurrencySelect({ id, label, value, onChange }: CurrencySelectProps) {
  return (
    <div className={styles.wrap}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <select id={id} className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.name}
          </option>
        ))}
      </select>
      <svg
        className={styles.chevron}
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        aria-hidden="true"
      >
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
