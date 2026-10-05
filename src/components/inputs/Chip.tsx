import { Badge } from '@/components/ui/badge';

interface ChipProps {
  label: string;
  onRemove: () => void;
  removeLabel: string;
}

/* Miolo: Badge do shadcn (ver docs/ajustes-70-...md). Visual do ajustes-72: pílula branca com borda stone-200; o × tem 32px visíveis e 44px de toque (::before). */
export function Chip({ label, onRemove, removeLabel }: ChipProps) {
  return (
    <Badge
      variant="neutral"
      className="h-9 max-w-full gap-1 overflow-visible border-border bg-background py-0 pr-0.5 pl-3"
    >
      <span className="truncate text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        className="relative inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-lg leading-none text-muted-foreground before:absolute before:-inset-1.5 before:content-[''] hover:bg-muted hover:text-foreground"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <span aria-hidden="true">×</span>
      </button>
    </Badge>
  );
}
