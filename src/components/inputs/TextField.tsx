import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'id'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  rightElement?: ReactNode;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  rightElement,
  ...rest
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="visually-hidden"> (obrigatório)</span>}
      </label>
      <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''}`}>
        <input
          id={id}
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {rightElement}
      </div>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
