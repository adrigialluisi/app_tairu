import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { searchCities, type CityEntry } from '../../data';
import type { TripDestination } from '../../context/TripContext';
import { Chip } from './Chip';
import { CurrencySelect } from './CurrencySelect';
import { DateRangeField } from './DateRangeField';
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const inputId = `${baseId}-destination-input`;
  const listboxId = `${baseId}-destination-listbox`;
  const errorId = `${baseId}-destination-error`;

  const excludeIds = useMemo(() => new Set(destinations.map((d) => d.cityId)), [destinations]);
  const suggestions = useMemo(() => searchCities(query, excludeIds), [query, excludeIds]);

  function selectCity(city: CityEntry) {
    onAdd({ cityId: city.id, city: city.city, country: city.country, currencyCode: city.currencyCode });
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectCity(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
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
      <div className={styles.comboWrap}>
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.input}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showListbox}
            aria-controls={listboxId}
            aria-labelledby={`${baseId}-label`}
            aria-activedescendant={
              showListbox && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined
            }
            aria-describedby={error ? errorId : undefined}
            placeholder="Ex.: Buenos Aires"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        {showListbox && (
          <ul className={styles.listbox} id={listboxId} role="listbox" aria-label="Sugestões de destino">
            {suggestions.length === 0 ? (
              <li className={styles.empty}>Nenhuma cidade encontrada.</li>
            ) : (
              suggestions.map((city, index) => (
                <li key={city.id} role="presentation">
                  <button
                    type="button"
                    id={`${baseId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCity(city)}
                  >
                    <span>{city.city}</span>
                    <span className={styles.optionCountry}>{city.country}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

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
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}

      {destinations.length > 0 && (
        <div className={styles.detailsGroup}>
          <span className={styles.detailsGroupLabel}>Detalhes por destino</span>
          <ul className={styles.detailsList}>
            {destinations.map((d) => {
              const currencyId = `${baseId}-currency-${d.id}`;
              return (
                <li key={d.id} className={styles.detailsCard}>
                  {/* Sem repetir o nome da cidade solto aqui (já aparece no
                      chip acima e no label visível "Datas em X" abaixo) —
                      CurrencySelect carrega seu próprio label acessível
                      ("Moeda de X") pra diferenciar cada select pra quem
                      usa leitor de tela. */}
                  <CurrencySelect
                    id={currencyId}
                    label={`Moeda de ${d.city}`}
                    value={d.currencyCode}
                    onChange={(code) => onCurrencyChange(d.id, code)}
                  />
                  <DateRangeField
                    label={`Datas em ${d.city}`}
                    startISO={d.dateStart}
                    endISO={d.dateEnd}
                    onChange={(start, end) => onDateRangeChange(d.id, start, end)}
                  />
                </li>
              );
            })}
          </ul>
          {dateOverlapError && (
            <p role="alert" className={styles.error}>
              <span aria-hidden="true">⚠</span> {dateOverlapError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
