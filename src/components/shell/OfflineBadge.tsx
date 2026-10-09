import { CloudCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineBadgeProps {
  /** padrão "Disponível offline"; ex.: "Viagem disponível offline", "Roteiro disponível offline" */
  label?: string;
  className?: string;
}

/**
 * Indicador padrão de "o que foi salvo abre sem internet" (docs/ajustes-82-...md,
 * seção 2) — simulado no protótipo, só visual, e não clicável. Ícone sempre com
 * texto (nunca só ícone): texto --muted 13px (7.63:1 no branco, 6.99:1 no
 * stone-100), ícone --success (6.29:1). É <span> pra caber também dentro de
 * botão/cartão clicável (card da viagem na Início). Não usar em estado vazio:
 * nada salvo = nada offline.
 */
export function OfflineBadge({ label = 'Disponível offline', className }: OfflineBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-(length:--text-sm) text-muted-foreground', className)}>
      <CloudCheck className="size-4 flex-none text-success" aria-hidden="true" />
      {label}
    </span>
  );
}
