import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { getCurrency, searchCurrencies, type CurrencyEntry } from '../../data';
import { useTrip } from '../../context/TripContext';
import { SearchCombobox, comboboxItemClass } from './SearchCombobox';

interface CurrencySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
  /** mostra o rótulo visível acima (padrão: só pra leitor de tela, como no campo de custo) */
  showLabel?: boolean;
  /** ocupa a largura do container (ex.: De/Para do conversor) */
  fullWidth?: boolean;
  /** acabou de ser preenchido pela leitura de um arquivo (nota em Custos, ajustes-90) */
  highlight?: boolean;
}

const REFERENCE_CURRENCY = 'BRL';
/** abaixo disso o campo fechado mostra só o código (mesmo corte do container query de antes, docs/ajustes-70-...md, 2.1) */
const SHORT_NAME_MIN_WIDTH = 150;

/*
  Seletor de moeda com busca (ajustes-86): o miolo deixou de ser um <select> nativo (rolar uma lista
  de 36 moedas) e passou a ser o SearchCombobox de Destinos/Hospedagem — mesmas props de antes, pra
  nenhuma tela mudar. Busca por código, nome ou país ("peso", "chile", "clp" → Peso chileno).
  Lista: "Da viagem" primeiro (moedas dos destinos + BRL), depois "Todas".
  Campo fechado: código + nome curto ("CLP · Peso"), só o código quando o campo é estreito; ao focar,
  o campo esvazia pra buscar e, se ninguém escolher nada, volta a mostrar a moeda atual. 44px e foco
  iguais ao TextField.
*/
export function CurrencySelect({
  id,
  label,
  value,
  onChange,
  showLabel = false,
  fullWidth = false,
  highlight = false,
}: CurrencySelectProps) {
  const trip = useTrip();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= SHORT_NAME_MIN_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tripCodes = useMemo(() => {
    const codes = trip.destinations.map((d) => d.currencyCode);
    return [...new Set([...codes, REFERENCE_CURRENCY])];
  }, [trip.destinations]);

  const results = searchCurrencies(query);
  const fromTrip = tripCodes
    .map((code) => results.find((c) => c.code === code))
    .filter((c): c is CurrencyEntry => !!c);
  const others = results.filter((c) => !tripCodes.includes(c.code));

  const current = getCurrency(value);
  const closedText = current && wide ? `${current.code} · ${current.name.split(' ')[0]}` : value;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery('');
  }

  function choose(code: string) {
    onChange(code);
    handleOpenChange(false);
  }

  const item = (c: CurrencyEntry) => (
    <CommandItem key={c.code} value={c.code} onSelect={() => choose(c.code)} className={comboboxItemClass}>
      <span className="font-semibold">{c.code}</span>
      <span className="min-w-0 truncate text-muted-foreground">{c.name}</span>
    </CommandItem>
  );

  const field = (
    <div ref={wrapRef} className={cn('min-w-22', fullWidth ? 'w-full' : 'inline-block')}>
      {!showLabel && (
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
      )}
      <SearchCombobox
        id={id}
        value={open ? query : closedText}
        onValueChange={setQuery}
        open={open}
        onOpenChange={handleOpenChange}
        placeholder="Buscar moeda"
        listLabel={`${label}: moedas`}
        emptyText="Nenhuma moeda encontrada."
        enterRequiresNavigation={false}
        highlight={highlight}
        // campo estreito (custo): a lista abre mais larga que ele, sem passar da tela
        contentClassName="w-72 max-w-[calc(100vw-2rem)]"
        endAdornment={
          <ChevronDown className="pointer-events-none mr-3 size-4 flex-none text-muted-foreground" aria-hidden="true" />
        }
      >
        {fromTrip.length > 0 && <CommandGroup heading="Da viagem">{fromTrip.map(item)}</CommandGroup>}
        {others.length > 0 && <CommandGroup heading="Todas">{others.map(item)}</CommandGroup>}
      </SearchCombobox>
    </div>
  );

  if (!showLabel) return field;
  return (
    <div className="flex min-w-0 flex-col gap-(--space-label)">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {field}
    </div>
  );
}
