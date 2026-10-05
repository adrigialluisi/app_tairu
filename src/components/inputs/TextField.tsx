import { TriangleAlert } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Icon } from '../shell/Icon';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'id'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  rightElement?: ReactNode;
}

/*
  Miolo do shadcn (Field + FieldLabel + Input + FieldError, ver
  docs/ajustes-69-...md), visual do docs/ajustes-72-...md (seção 4): fundo
  branco, borda 1px stone-500, rounded-md, 44px, texto 15px, rótulo 14px/500
  a 6px do campo. A caixa visível (borda, fundo, raio, foco) é o wrapper em
  volta do Input, e não o Input em si, pra caber o rightElement (ex.: sufixo)
  dentro da mesma borda — por isso o Input vai sem borda nem ring.
*/
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
    <Field className="gap-(--space-label)">
      <FieldLabel htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="visually-hidden"> (obrigatório)</span>}
      </FieldLabel>
      <div
        className={cn(
          'relative flex h-11 items-center rounded-md border border-input bg-background transition-[color,box-shadow]',
          // foco (ajustes-72, seção 4): borda bordô + anel de 2px bordô/20%
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
          error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        )}
      >
        <Input
          id={id}
          className={cn(
            styles.input,
            'h-full flex-1 rounded-none border-0 bg-transparent px-3 py-0 text-(length:--text-base) text-foreground shadow-none md:text-(length:--text-base)',
            'placeholder:text-input placeholder:opacity-100', // stone-500, 4.8:1
            'focus-visible:ring-0 aria-invalid:ring-0 disabled:bg-transparent',
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {rightElement}
      </div>
      {error && (
        <FieldError id={errorId} className="flex items-start gap-1 text-(length:--text-sm) font-medium">
          <Icon icon={TriangleAlert} /> {error}
        </FieldError>
      )}
    </Field>
  );
}
