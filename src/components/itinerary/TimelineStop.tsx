import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../shell/Icon';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import styles from './TimelineStop.module.css';

interface TimelineStopProps {
  orderLabel: string;
  title: string;
  description?: string;
  /** chips de categoria (ícone + rótulo) logo abaixo do título */
  tags?: ReactNode;
  /** título de busca na Wikipedia (wikiTitle ?? name) — só quando é um lugar real, não texto livre */
  photoSearchTitle?: string;
  /** foto já conhecida da parada (1ª foto de exemplo da viagem passada, ajustes-78) — usada no lugar da busca na Wikipedia */
  photoUrl?: string;
  /** ilustração quando não há foto (ícone da categoria, lápis se adicionado à mão — ver placeIllustrationIcon) */
  fallbackIcon?: LucideIcon;
  skipped: boolean;
  isLast: boolean;
  /** fotos tiradas nessa parada (StopPhotos) — aparecem também se a parada foi pulada (ajustes-75) */
  photos?: ReactNode;
  /** ações da parada — omitido no roteiro só de leitura (viagem passada, ajustes-76) */
  actions?: ReactNode;
}

export function TimelineStop({
  orderLabel,
  title,
  tags,
  description,
  photoSearchTitle,
  photoUrl,
  fallbackIcon,
  skipped,
  isLast,
  photos,
  actions,
}: TimelineStopProps) {
  // com photoUrl, nem busca na Wikipedia (título vazio = o hook não faz nada)
  const wikiUrl = usePlaceThumbnail(photoUrl ? '' : (photoSearchTitle ?? ''));
  const thumbnailUrl = photoUrl ?? (photoSearchTitle ? wikiUrl : null);

  return (
    <li className={`${styles.stop} ${isLast ? styles.stopLast : ''}`}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.orderLabel}>{orderLabel}</span>
        <p className={`${styles.title} ${skipped ? styles.titleSkipped : ''}`}>
          {title}
          {skipped && <span className="visually-hidden"> (pulado)</span>}
        </p>
        {tags && !skipped && <div className={styles.tags}>{tags}</div>}
        {description && !skipped && <p className={styles.description}>{description}</p>}
        {!skipped &&
          (thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" loading="lazy" className={styles.photo} />
          ) : (
            fallbackIcon && (
              <span className={`${styles.photo} ${styles.photoFallback}`} aria-hidden="true">
                <Icon icon={fallbackIcon} />
              </span>
            )
          ))}
        {photos}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </li>
  );
}
