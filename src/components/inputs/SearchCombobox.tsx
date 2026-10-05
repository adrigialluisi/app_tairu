import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandList } from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import textFieldStyles from './TextField.module.css';

interface SearchComboboxProps {
  /** id do <input> (o rótulo de quem usa aponta pra ele) */
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  /** nome acessível da lista de sugestões */
  listLabel: string;
  /** texto quando não há nenhum item */
  emptyText: ReactNode;
  /** true: Enter só escolhe da lista depois de navegar nela (setas ou mouse) — protege o texto livre */
  enterRequiresNavigation?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  invalid?: boolean;
  /** CommandItem / CommandGroup */
  children: ReactNode;
}

/**
 * Campo com busca (Combobox do shadcn = Popover + Command, docs/ajustes-71-...md),
 * usado em Destinos (cidades) e Hospedagem (hotéis). Quem usa filtra os itens
 * (busca sem acento/caixa, base local) — o Command só cuida da lista: setas,
 * Enter escolhe o item destacado, Esc fecha (Popover). O texto digitado é
 * controlado por quem usa, então nunca se perde ao abrir/fechar a lista.
 *
 * O campo é um <input> nosso, não o Command.Input: o do cmdk força o próprio id
 * (quebraria o <label htmlFor>) e deixa aria-expanded sempre true.
 */
export function SearchCombobox({
  id,
  value,
  onValueChange,
  open,
  onOpenChange,
  placeholder,
  listLabel,
  emptyText,
  enterRequiresNavigation = false,
  invalid = false,
  children,
  ...aria
}: SearchComboboxProps) {
  const listId = `${useId()}-list`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('');
  const [navigated, setNavigated] = useState(false);
  const [activeDescendant, setActiveDescendant] = useState<string | undefined>();

  // texto novo = lista nova: volta a não ter navegado
  useEffect(() => setNavigated(false), [value]);

  const highlightOn = open && (!enterRequiresNavigation || navigated);

  // id do item destacado, pro leitor de tela acompanhar as setas sem sair do campo
  useEffect(() => {
    if (!highlightOn) {
      setActiveDescendant(undefined);
      return;
    }
    const item = listRef.current?.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]');
    setActiveDescendant(item?.id || undefined);
  }, [active, highlightOn, open]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!open) onOpenChange(true);
      setNavigated(true);
    } else if (e.key === 'Enter' && enterRequiresNavigation && !navigated) {
      // o Command não age em evento já tratado: Enter não troca o texto livre pela 1ª sugestão
      e.preventDefault();
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Command
        shouldFilter={false}
        loop
        value={active}
        onValueChange={setActive}
        className="overflow-visible rounded-none! bg-transparent p-0"
      >
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className={cn(
              'relative flex h-11 items-center rounded-md border border-input bg-background transition-[color,box-shadow]',
              'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
              invalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
            )}
          >
            <input
              id={id}
              className={cn(
                textFieldStyles.input,
                'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-(length:--text-base) text-foreground outline-none placeholder:text-input placeholder:opacity-100',
              )}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={open ? listId : undefined}
              aria-activedescendant={activeDescendant}
              aria-invalid={invalid || undefined}
              {...aria}
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                onValueChange(e.target.value);
                onOpenChange(true);
              }}
              onFocus={() => onOpenChange(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          collisionPadding={16}
          // o foco fica no campo, pra continuar digitando
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // tocar no próprio campo não conta como "fora"
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className="w-(--radix-popover-trigger-width) gap-0 rounded-md p-1"
        >
          <CommandList
            ref={listRef}
            id={listId}
            aria-label={listLabel}
            onPointerMove={() => setNavigated(true)}
            className={cn(
              'max-h-80',
              // destaque escondido enquanto o Enter não escolhe (ver enterRequiresNavigation)
              !highlightOn && '**:data-[selected=true]:bg-transparent',
            )}
          >
            <CommandEmpty className="px-3 py-4 text-left text-(length:--text-sm) text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            {children}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}

/** Classes do item da lista (44px de toque, destaque stone-100). */
export const comboboxItemClass =
  'min-h-11 cursor-pointer gap-2 rounded-md px-3 py-2 text-(length:--text-base) data-selected:bg-muted';
