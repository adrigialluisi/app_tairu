import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

interface EmptyStateProps {
  /** ícone (decorativo — o texto é que explica) */
  icon: ReactNode;
  /** título opcional, 15px/500 */
  title?: string;
  children: ReactNode;
  /** botão/link de ação, opcional */
  action?: ReactNode;
  /** 'muted' pra estados vazios secundários dentro de uma seção (texto menor, stone-600) */
  tone?: 'default' | 'muted';
}

/**
 * Estado vazio padrão (Empty do shadcn), visual do docs/ajustes-72-...md
 * (seção 4): ícone num círculo branco com borda stone-200 (docs/ajustes-73-...md:
 * o miolo da tela agora é stone-100), título 15px/500, texto 13px stone-600,
 * tudo centralizado, sem cartão. O ícone é stone-500 (4.8:1 no branco —
 * decisão da Adriana em 05/out, no lugar do stone-400 do spec).
 * Sem título, o próprio texto faz o papel de título (15px, stone-900).
 * `border-0` explícito: sem o preflight, o `border-dashed` do Empty viria com
 * a borda de 3px padrão do navegador.
 */
export function EmptyState({ icon, title, children, action, tone = 'default' }: EmptyStateProps) {
  const asTitle = !title && tone === 'default';
  return (
    <Empty className="flex-none gap-4 rounded-none border-0 bg-transparent px-4 py-8">
      <EmptyHeader className="max-w-none gap-2">
        <EmptyMedia
          className="mb-1 size-14 rounded-full border border-border bg-background text-[28px] leading-none text-input [&_svg]:size-8"
          aria-hidden="true"
        >
          {icon}
        </EmptyMedia>
        {title && <EmptyTitle className="text-(length:--text-base) font-medium text-foreground">{title}</EmptyTitle>}
        <EmptyDescription
          className={cn(
            'text-pretty',
            asTitle
              ? 'text-(length:--text-base) text-foreground'
              : 'text-(length:--text-sm) text-muted-foreground',
          )}
        >
          {children}
        </EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent className="max-w-none">{action}</EmptyContent>}
    </Empty>
  );
}
