import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  className?: string;
}

/**
 * Ícone lucide da interface (docs/ajustes-72-virada-visual-shadcn.md, seção 5):
 * traço, cor herdada do texto, tamanho do texto ao lado (1em) e sempre
 * aria-hidden — o texto ao lado é que diz o que é (regra de acessibilidade).
 */
export function Icon({ icon: LucideComponent, className }: IconProps) {
  return (
    <LucideComponent
      aria-hidden="true"
      focusable="false"
      className={cn('inline-block size-[1em] shrink-0 align-[-0.125em]', className)}
    />
  );
}
