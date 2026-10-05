import { useMemo, useState } from 'react';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { searchHotels, type HotelEntry } from '../../data';
import { SearchCombobox, comboboxItemClass } from '../inputs/SearchCombobox';
import { HotelInfo } from './HotelInfo';

interface HotelSearchFieldProps {
  id: string;
  cityId: string;
  cityName: string;
  value: string;
  onChange: (value: string) => void;
  onSelectHotel: (hotel: HotelEntry) => void;
}

/**
 * Busca de hospedagem (Combobox do shadcn, docs/ajustes-71-...md) nos 15 hotéis
 * reais de hotels.json, com a lista rica (foto, estrelas, preço, distância).
 * Nome livre continua valendo: o Enter só escolhe da lista depois que a pessoa
 * navega nela (setas ou mouse) — sem isso, ele não troca o que foi digitado
 * pela primeira sugestão.
 */
export function HotelSearchField({ id, cityId, cityName, value, onChange, onSelectHotel }: HotelSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => searchHotels(cityId, value), [cityId, value]);
  const hintId = `${id}-hint`;

  function selectHotel(hotel: HotelEntry) {
    onSelectHotel(hotel);
    setOpen(false);
    document.getElementById(id)?.focus();
  }

  const showListbox = open && (suggestions.length > 0 || value.trim().length >= 2);
  const items = suggestions.map((hotel) => (
    <CommandItem
      key={hotel.id}
      value={hotel.id}
      onSelect={() => selectHotel(hotel)}
      className={cn(comboboxItemClass, 'items-start border-b border-border py-3 last:border-b-0')}
    >
      <HotelInfo hotel={hotel} variant="compact" />
    </CommandItem>
  ));

  return (
    <div className="flex flex-col gap-(--space-label)">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        Nome da hospedagem
      </label>
      <SearchCombobox
        id={id}
        value={value}
        onValueChange={onChange}
        open={showListbox}
        onOpenChange={setOpen}
        placeholder="Ex.: Alvear Palace Hotel"
        listLabel={`Sugestões de hospedagem em ${cityName}`}
        emptyText="Nenhuma hospedagem da nossa lista. Pode continuar digitando e preencher o resto à mão."
        enterRequiresNavigation
        aria-describedby={hintId}
      >
        {value.trim().length < 2 ? (
          <CommandGroup heading={`Sugestões em ${cityName}`} className="p-0">
            {items}
          </CommandGroup>
        ) : (
          items
        )}
      </SearchCombobox>
      <p id={hintId} className="m-0 text-(length:--text-sm) text-muted-foreground">
        Toque no campo pra ver hotéis de {cityName}, ou digite o nome da sua hospedagem.
      </p>
    </div>
  );
}
