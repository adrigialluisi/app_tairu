import { useState } from 'react';
import type { HotelEntry } from '../../data';
import { hotelPhotoUrl, priceLevelA11y, priceLevelLabel, stayTypeIcon } from '../../utils/staySummary';
import styles from './HotelInfo.module.css';

interface HotelInfoProps {
  hotel: HotelEntry;
  /** 'compact' = linha da busca (foto 64px); 'preview' = hotel escolhido (foto larga no topo) */
  variant: 'compact' | 'preview';
}

export function HotelInfo({ hotel, variant }: HotelInfoProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = photoFailed ? null : hotelPhotoUrl(hotel);

  return (
    <span className={`${styles.wrap} ${styles[variant]}`}>
      <span className={styles.photo}>
        {photo ? (
          <img src={photo} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
        ) : (
          <span className={styles.photoFallback} aria-hidden="true">
            {stayTypeIcon(hotel.type)}
          </span>
        )}
      </span>
      <span className={styles.info}>
        <span className={styles.nameRow}>
          <span className={styles.name}>{hotel.name}</span>
          <span className={styles.price} aria-label={priceLevelA11y(hotel.priceLevel)}>
            {priceLevelLabel(hotel.priceLevel)}
          </span>
        </span>
        <span className={styles.category}>
          {hotel.stars ? (
            <span aria-label={`${hotel.stars} estrelas`}>{'★'.repeat(hotel.stars)}</span>
          ) : null}
          {hotel.badge && <span className={styles.badge}>{hotel.badge}</span>}
        </span>
        <span className={styles.description}>{hotel.description}</span>
        <span className={styles.meta}>
          {hotel.neighborhood} · {hotel.distanceLabel}
        </span>
      </span>
    </span>
  );
}
