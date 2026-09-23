import type { ReactNode } from 'react';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import styles from './TimelineStop.module.css';

interface TimelineStopProps {
  orderLabel: string;
  title: string;
  description?: string;
  /** título de busca na Wikipedia (wikiTitle ?? name) — só quando é um lugar real, não texto livre */
  photoSearchTitle?: string;
  skipped: boolean;
  isLast: boolean;
  actions: ReactNode;
}

export function TimelineStop({ orderLabel, title, description, photoSearchTitle, skipped, isLast, actions }: TimelineStopProps) {
  const thumbnailUrl = usePlaceThumbnail(photoSearchTitle ?? '');

  return (
    <li className={`${styles.stop} ${isLast ? styles.stopLast : ''}`}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.orderLabel}>{orderLabel}</span>
        <p className={`${styles.title} ${skipped ? styles.titleSkipped : ''}`}>
          {title}
          {skipped && <span className="visually-hidden"> (pulado)</span>}
        </p>
        {description && !skipped && <p className={styles.description}>{description}</p>}
        {photoSearchTitle && thumbnailUrl && !skipped && (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.photo} />
        )}
        <div className={styles.actions}>{actions}</div>
      </div>
    </li>
  );
}
