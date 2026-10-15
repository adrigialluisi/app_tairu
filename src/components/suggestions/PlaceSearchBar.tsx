import { Check, Plus, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { SearchCombobox, comboboxItemClass } from '../inputs/SearchCombobox';
import { Icon } from '../shell/Icon';
import { searchPlacesInCity, type PlaceEntry } from '../../data';
import { useTrip, type TripDestination } from '../../context/TripContext';
import { addedCardId, focusCard, placeCardId } from '../../utils/focusCard';

interface PlaceSearchBarProps {
  destination: TripDestination;
  /** dispara o toast da tela (useSaveToast do Itinerary) */
  onToast: (message: string) => void;
}

const MAX_RESULTS = 6;

/**
 * "Buscar ou adicionar um lugar" (ajustes-87): fica preso no topo da aba Sugestões, junto das abas
 * de cidade (o Itinerary põe os dois na mesma faixa sticky). Substitui o "Não achou? Adicione um
 * lugar por conta própria", recolhido no meio da tela, que passava despercebido.
 * Digitando, aparecem primeiro os lugares da cidade que batem (tocar rola até o cartão dele) e,
 * por último, sempre "+ Adicionar '{texto}' como lugar seu" (vai pra seção "Adicionados").
 */
export function PlaceSearchBar({ destination, onToast }: PlaceSearchBarProps) {
  const trip = useTrip();
  const inputId = `${useId()}-busca-lugar`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const text = query.trim();
  const results = searchPlacesInCity(destination.cityId, text).slice(0, MAX_RESULTS);
  const chosen = new Set(
    trip.selectedPlaces.filter((s) => s.destinationId === destination.id && s.placeId).map((s) => s.placeId),
  );

  function reset() {
    setQuery('');
    setOpen(false);
  }

  function goToPlace(place: PlaceEntry) {
    reset();
    const cardId = placeCardId(destination.id, place.id);
    if (document.getElementById(cardId)) {
      focusCard(cardId);
      return;
    }
    // lugar fora das seções do perfil: não tem cartão na tela, então a escolha já adiciona
    if (!chosen.has(place.id)) {
      trip.togglePlace(destination.id, { placeId: place.id, categories: place.categories });
      onToast('Lugar adicionado');
    }
  }

  function addOwn() {
    if (!text) return;
    const id = trip.addCustomPlace(destination.id, text);
    reset();
    onToast('Lugar adicionado');
    focusCard(addedCardId(id));
  }

  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="visually-hidden">
        {`Buscar ou adicionar um lugar em ${destination.city}`}
      </label>
      <SearchCombobox
        id={inputId}
        value={query}
        onValueChange={setQuery}
        open={open && text.length > 0}
        onOpenChange={setOpen}
        // a cidade já está nas abas logo acima; com ela o texto não cabia em 375px
        placeholder="Buscar ou adicionar um lugar"
        listLabel={`Lugares em ${destination.city}`}
        emptyText={null}
        appearance="prominent"
        startAdornment={<Search className="ml-3 size-5 flex-none text-primary" aria-hidden="true" />}
      >
        {results.length > 0 && (
          <CommandGroup heading={`Em ${destination.city}`}>
            {results.map((place) => (
              <CommandItem
                key={place.id}
                value={place.id}
                onSelect={() => goToPlace(place)}
                className={comboboxItemClass}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{place.name}</span>
                  <span className="truncate text-(length:--text-sm) text-muted-foreground">{place.neighborhood}</span>
                </span>
                {chosen.has(place.id) && (
                  <span className="flex flex-none items-center gap-1 text-(length:--text-sm) font-semibold text-(--accent-dark)">
                    <Icon icon={Check} /> No roteiro
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup>
          <CommandItem value="__adicionar__" onSelect={addOwn} className={comboboxItemClass}>
            <Icon icon={Plus} className="text-primary" />
            <span className="min-w-0 flex-1">
              Adicionar <span className="font-semibold">“{text}”</span> como lugar seu
            </span>
          </CommandItem>
        </CommandGroup>
      </SearchCombobox>
    </div>
  );
}
