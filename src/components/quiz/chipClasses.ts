import { cn } from '@/lib/utils';

/*
  Classes compartilhadas por OptionChipGroup e MultiOptionChipGroup (ToggleGroup
  do shadcn), visual do docs/ajustes-72-virada-visual-shadcn.md, seção 4:
  - não selecionado: fundo branco, borda 1px stone-500 (4.8:1, mesma borda de
    campo — decisão da Adriana em 05/out, no lugar do stone-300 do spec, que
    ficava em 1.49:1), texto stone-900;
  - selecionado: fundo bordô suave (--accent-soft), borda bordô, texto
    --accent-dark (8.62:1) e ✓ — nunca bordô cheio (fica pesado com vários);
  - pílula de 40px de altura, com área de toque de 44px (o ::before estende 2px
    pra cima e pra baixo, dentro do vão de 8px entre as linhas).
  SEM flex no fieldset de propósito: gap entre <legend> e o resto é
  inconsistente entre navegadores, então o espaçamento legend → chips é o
  margin-top do grupo (6px, rótulo → campo).
*/
export const chipFieldsetClass = 'm-0 block min-w-0 gap-0 border-0 p-0';
export const chipLegendClass = 'm-0 block p-0 text-sm font-medium text-foreground';
export const chipGroupClass = 'mt-(--space-label) w-full flex-wrap rounded-none';
export const chipItemClass = cn(
  'relative h-10 gap-1.5 rounded-full border border-input bg-background px-4 text-sm font-medium whitespace-normal text-foreground',
  "before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-['']",
  'hover:bg-muted hover:text-foreground focus-visible:ring-0',
  'data-[state=on]:border-primary data-[state=on]:bg-accent-soft data-[state=on]:text-(--accent-dark)',
  'data-[state=on]:hover:bg-accent-soft data-[state=on]:hover:text-(--accent-dark)',
);
