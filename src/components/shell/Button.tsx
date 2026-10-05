import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button as UiButton } from '@/components/ui/button';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** link: ação discreta em texto (ex.: "Adicionar foto" na parada do Roteiro), 44px de toque */
  variant?: 'primary' | 'secondary' | 'link';
  iconOnly?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/*
  Button do shadcn (ui/button.tsx) com o tema do Tairu (docs/ajustes-72-...md,
  seção 4): altura 44px, rounded-md, peso 500, sem sombra.
  - primary → default: fundo bordô, texto branco (6.08:1), hover --accent-dark (9.67:1);
  - secondary (ajuste 73b): fundo branco, borda 1px bordô (6.08:1), texto --accent-dark
    peso 500 (9.67:1); hover --accent-soft (8.62:1). O outline branco de borda clara do
    ajuste 72 sumia no miolo cinza.
  - link (ajustes-75): texto --accent-dark (9.67:1) sem fundo nem borda, sublinha no hover; 44px de toque.
  O foco é o anel global (global.css); o ring do shadcn fica desligado pra não aparecer em dobro.
*/
export function Button({
  variant = 'primary',
  iconOnly = false,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <UiButton
      variant={variant === 'primary' ? 'default' : variant === 'link' ? 'link' : 'outline'}
      size={iconOnly ? 'icon' : 'default'}
      className={cn(
        'h-auto min-h-11 gap-2 rounded-md px-4 text-(length:--text-base) font-medium',
        'focus-visible:ring-0 disabled:pointer-events-auto disabled:cursor-not-allowed',
        variant === 'secondary' &&
          'border-primary bg-background text-(--accent-dark) hover:bg-accent-soft aria-expanded:bg-accent-soft aria-expanded:text-(--accent-dark)',
        variant === 'link' &&
          'h-11 min-h-11 px-1 text-(length:--text-sm) font-medium text-(--accent-dark) hover:underline hover:underline-offset-4',
        iconOnly && 'size-11 flex-none p-0',
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </UiButton>
  );
}
