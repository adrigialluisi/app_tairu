import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../shell/Icon';
import { NewBadge } from '../shell/NewBadge';
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
  /** faixa única de ações no rodapé da parada (ajustes-88) — omitida no roteiro só de leitura (viagem passada, ajustes-76) */
  actions?: ReactNode;
  /** à direita do nome, na mesma linha — o "Desfazer" da parada pulada (ajustes-88) */
  titleAction?: ReactNode;
  /** conteúdo extra antes das ações (ex.: gasto lançado pela parada, formulário de gasto aberto) */
  extra?: ReactNode;
  /** sugerida por convidado na simulação "2 dias depois" e ainda não vista (ajustes-89) */
  isNew?: boolean;
}

/*
  Parada pulada (ajustes-88): só o nome riscado e o "Desfazer" à direita — sem foto, tags,
  descrição, fotos do grupo nem ações. Entre uma parada e outra, divisória fina sob o conteúdo
  (a linha da timeline segue à esquerda).
*/

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
  titleAction,
  extra,
  isNew = false,
}: TimelineStopProps) {
  // com photoUrl, nem busca na Wikipedia (título vazio = o hook não faz nada)
  const wikiUrl = usePlaceThumbnail(photoUrl ? '' : (photoSearchTitle ?? ''));
  const thumbnailUrl = photoUrl ?? (photoSearchTitle ? wikiUrl : null);

  return (
    <li className={`${styles.stop} ${isLast ? styles.stopLast : ''}`}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.orderLabel}>{orderLabel}</span>
        <div className={styles.titleRow}>
          <p className={`${styles.title} ${skipped ? styles.titleSkipped : ''}`}>
            {title}
            {skipped && <span className="visually-hidden"> (pulado)</span>}
          </p>
          {isNew && !skipped && <NewBadge />}
          {titleAction}
        </div>
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
        {!skipped && photos}
        {!skipped && extra}
        {!skipped && actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </li>
  );
}
