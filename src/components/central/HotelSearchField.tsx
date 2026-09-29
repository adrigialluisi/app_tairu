import { useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { searchHotels, type HotelEntry } from '../../data';
import { HotelInfo } from './HotelInfo';
import fieldStyles from '../inputs/TextField.module.css';
import styles from '../inputs/DestinationField.module.css';
import hintStyles from './HotelSearchField.module.css';

interface HotelSearchFieldProps {
  id: string;
  cityId: string;
  cityName: string;
  value: string;
  onChange: (value: string) => void;
  onSelectHotel: (hotel: HotelEntry) => void;
}

export function HotelSearchField({ id, cityId, cityName, value, onChange, onSelectHotel }: HotelSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-hotel-listbox`;

  const suggestions = useMemo(() => searchHotels(cityId, value), [cityId, value]);

  function selectHotel(hotel: HotelEntry) {
    onSelectHotel(hotel);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
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
        selectHotel(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showListbox = open && (suggestions.length > 0 || value.trim().length >= 2);

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        Nome da hospedagem
      </label>
      <div className={styles.comboWrap}>
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            id={id}
            className={styles.input}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showListbox}
            aria-controls={listboxId}
            aria-activedescendant={showListbox && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            placeholder="Ex.: Alvear Palace Hotel"
            value={value}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        {showListbox && (
          <ul
            className={`${styles.listbox} ${hintStyles.listbox}`}
            id={listboxId}
            role="listbox"
            aria-label={`Sugestões de hospedagem em ${cityName}`}
          >
            {suggestions.length === 0 ? (
              <li className={styles.empty}>
                Nenhuma hospedagem da nossa lista. Pode continuar digitando e preencher o resto à mão.
              </li>
            ) : (
              <>
                {value.trim().length < 2 && (
                  <li role="presentation" className={hintStyles.listHeader}>
                    Sugestões em {cityName}
                  </li>
                )}
                {suggestions.map((hotel, index) => (
                  <li key={hotel.id} role="presentation">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`${styles.option} ${hintStyles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectHotel(hotel)}
                    >
                      <HotelInfo hotel={hotel} variant="compact" />
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        )}
      </div>
      <p className={hintStyles.hint}>
        Toque no campo pra ver hotéis de {cityName}, ou digite o nome da sua hospedagem.
      </p>
    </div>
  );
}
