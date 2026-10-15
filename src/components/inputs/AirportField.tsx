import { useEffect, useState } from 'react';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import {
  airportFromValue,
  airportLabel,
  airportValue,
  airportsForCity,
  searchAirports,
  type AirportEntry,
} from '../../data';
import { SearchCombobox, comboboxItemClass } from './SearchCombobox';

interface AirportFieldProps {
  id: string;
  label: string;
  /** "São Paulo – Guarulhos (GRU)" quando escolhido da lista; texto livre antigo continua valendo */
  value: string;
  onChange: (value: string) => void;
  /** cidade do destino do voo: sem digitar nada, a lista abre com os aeroportos dela (Buenos Aires → EZE, AEP) */
  suggestCityId?: string;
  suggestCityName?: string;
  /** acabou de ser preenchido pela leitura do voucher (ajustes-84) */
  highlight?: boolean;
}

/**
 * Origem/Destino do voo (ajustes-86): busca de aeroporto real (src/data/airports.json) no mesmo
 * SearchCombobox de Destinos e Hospedagem. Busca por cidade, nome do aeroporto ou código ("guaru",
 * "são paulo", "gru" → São Paulo – Guarulhos). O valor salvo é o texto de exibição com o código no
 * fim, "(GRU)" — de onde o app tira o aeroporto depois (airportFromValue). Texto que não veio da
 * lista (item antigo, aeroporto fora da base) é aceito e só exibido.
 */
export function AirportField({ id, label, value, onChange, suggestCityId, suggestCityName, highlight }: AirportFieldProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  // valor mudou de fora (leitura do voucher): o campo acompanha
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const cityAirports = suggestCityId ? airportsForCity(suggestCityId) : [];
  const showingSuggestions = query.trim() === '' || !!airportFromValue(query);
  const results = showingSuggestions ? cityAirports : searchAirports(query);
  const hasList = showingSuggestions ? cityAirports.length > 0 : query.trim().length >= 2;

  function choose(airport: AirportEntry) {
    const next = airportValue(airport);
    setQuery(next);
    onChange(next);
    setOpen(false);
  }

  const item = (a: AirportEntry) => (
    <CommandItem key={a.iata} value={a.iata} onSelect={() => choose(a)} className={comboboxItemClass}>
      <span className="min-w-0">
        <span className="font-semibold">{a.iata}</span> · {airportLabel(a)}
        <span className="text-muted-foreground">, {a.country}</span>
      </span>
    </CommandItem>
  );

  return (
    <div className="flex min-w-0 flex-col gap-(--space-label)">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <SearchCombobox
        id={id}
        value={query}
        onValueChange={(text) => {
          setQuery(text);
          onChange(text);
        }}
        open={open && hasList}
        onOpenChange={setOpen}
        placeholder="Cidade, aeroporto ou código"
        listLabel={`${label}: aeroportos`}
        emptyText="Nenhum aeroporto encontrado. Pode escrever o nome mesmo assim."
        enterRequiresNavigation
        highlight={highlight}
      >
        {showingSuggestions ? (
          <CommandGroup heading={suggestCityName ? `Aeroportos de ${suggestCityName}` : 'Sugestões'}>
            {results.map(item)}
          </CommandGroup>
        ) : (
          results.map(item)
        )}
      </SearchCombobox>
    </div>
  );
}
