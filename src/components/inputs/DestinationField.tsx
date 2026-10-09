import { MapPin, Trash2, TriangleAlert } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { CommandItem } from '@/components/ui/command';
import { searchCities, type CityEntry } from '../../data';
import type { TripDestination } from '../../context/TripContext';
import { Chip } from './Chip';
import { CurrencySelect } from './CurrencySelect';
import { DateRangeField } from './DateRangeField';
import { SearchCombobox, comboboxItemClass } from './SearchCombobox';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './DestinationField.module.css';

interface DestinationFieldProps {
  destinations: TripDestination[];
  onAdd: (destination: Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>) => void;
  onRemove: (id: string) => void;
  onCurrencyChange: (id: string, currencyCode: string) => void;
  onDateRangeChange: (id: string, start: string | null, end: string | null) => void;
  dateOverlapError?: string | null;
  error?: string | null;
}

export function DestinationField({
  destinations,
  onAdd,
  onRemove,
  onCurrencyChange,
  onDateRangeChange,
  dateOverlapError,
  error,
}: DestinationFieldProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const inputId = `${baseId}-destination-input`;
  const errorId = `${baseId}-destination-error`;

  const excludeIds = useMemo(() => new Set(destinations.map((d) => d.cityId)), [destinations]);
  const suggestions = useMemo(() => searchCities(query, excludeIds), [query, excludeIds]);

  function selectCity(city: CityEntry) {
    onAdd({ cityId: city.id, city: city.city, country: city.country, currencyCode: city.currencyCode });
    setQuery('');
    setOpen(false);
    document.getElementById(inputId)?.focus();
  }

  const showListbox = open && query.trim().length >= 2;

  return (
    <div className={styles.wrap}>
      <span id={`${baseId}-label`} className={styles.label}>
        Destinos <span aria-hidden="true">*</span>
        <span className="visually-hidden"> (obrigatório, pelo menos 1)</span>
      </span>

      {/*
        Campo de busca sempre primeiro, em posição fixa — a lista de chips
        vem depois, abaixo dele, pra ele não "descer" na tela conforme a
        pessoa vai adicionando destinos.
      */}
      <SearchCombobox
        id={inputId}
        value={query}
        onValueChange={setQuery}
        open={showListbox}
        onOpenChange={setOpen}
        placeholder="Ex.: Buenos Aires"
        listLabel="Sugestões de destino"
        emptyText="Nenhuma cidade encontrada."
        aria-labelledby={`${baseId}-label`}
        aria-describedby={error ? errorId : undefined}
        invalid={!!error}
      >
        {suggestions.map((city) => (
          <CommandItem key={city.id} value={city.id} onSelect={() => selectCity(city)} className={comboboxItemClass}>
            <span>{city.city}</span>
            <span className="text-(length:--text-sm) text-muted-foreground">{city.country}</span>
          </CommandItem>
        ))}
      </SearchCombobox>

      {destinations.length > 0 && (
        <ul className={styles.chipList}>
          {destinations.map((d) => (
            <li key={d.id}>
              <Chip
                label={`${d.city}, ${d.country}`}
                removeLabel={`Remover destino ${d.city}, ${d.country}`}
                onRemove={() => onRemove(d.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          <Icon icon={TriangleAlert} /> {error}
        </p>
      )}

      {destinations.length > 0 && (
        <div className={styles.detailsGroup}>
          <span className={styles.detailsGroupLabel}>Detalhes por destino</span>
          <ul className={styles.detailsList}>
            {destinations.map((d, index) => {
              const currencyId = `${baseId}-currency-${d.id}`;
              const headingId = `${baseId}-details-${d.id}`;
              return (
                /*
                  Cada cartão diz de qual cidade é (cabeçalho com ordem, cidade e
                  país). O cartão é um grupo nomeado pelo cabeçalho, então o leitor
                  de tela anuncia "Buenos Aires, Argentina" antes de "Moeda" e
                  "Datas da estadia" — os rótulos visíveis não precisam repetir a cidade.
                */
                <Card asChild className="px-4">
                <li key={d.id} className={styles.detailsCard} role="group" aria-labelledby={headingId}>
                  <div className={styles.detailsHeader}>
                    <span className={styles.detailsOrder} aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className={styles.detailsPin} aria-hidden="true">
                      <Icon icon={MapPin} />
                    </span>
                    <div id={headingId} className={styles.detailsTitleWrap}>
                      <h4 className={styles.detailsCity}>{d.city}</h4>
                      <p className={styles.detailsCountry}>{d.country}</p>
                    </div>
                    {/* remover direto do cartão (08/out/2026): o × do chip lá em cima não era encontrado */}
                    <button
                      type="button"
                      className={styles.detailsRemove}
                      onClick={() => onRemove(d.id)}
                      aria-label={`Remover destino ${d.city}, ${d.country}`}
                    >
                      <Icon icon={Trash2} />
                      <span>Remover</span>
                    </button>
                  </div>
                  <CurrencySelect
                    id={currencyId}
                    label="Moeda"
                    showLabel
                    fullWidth
                    value={d.currencyCode}
                    onChange={(code) => onCurrencyChange(d.id, code)}
                  />
                  <DateRangeField
                    label="Datas da estadia"
                    startISO={d.dateStart}
                    endISO={d.dateEnd}
                    onChange={(start, end) => onDateRangeChange(d.id, start, end)}
                  />
                </li>
                </Card>
              );
            })}
          </ul>
          {dateOverlapError && (
            <p role="alert" className={styles.error}>
              <Icon icon={TriangleAlert} /> {dateOverlapError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
