import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import styles from './PlaceRow.module.css';

interface PlaceRowProps {
  name: string;
  neighborhood?: string;
  categoriesLabel?: string;
  wikiTitle?: string;
  selected: boolean;
  onToggle: () => void;
}

export function PlaceRow({ name, neighborhood, categoriesLabel, wikiTitle, selected, onToggle }: PlaceRowProps) {
  const thumbnailUrl = usePlaceThumbnail(wikiTitle ?? name);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
      onClick={onToggle}
    >
      <span className={styles.thumbnail}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.thumbnailImg} />
        ) : (
          <span className={styles.thumbnailFallback} aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className={`${styles.checkbox} ${selected ? styles.checkboxSelected : ''}`} aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        {neighborhood && <span className={styles.neighborhood}>{neighborhood}</span>}
      </span>
      {categoriesLabel && <span className={styles.categories}>{categoriesLabel}</span>}
    </button>
  );
}
