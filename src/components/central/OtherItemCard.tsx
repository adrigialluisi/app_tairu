import {
  otherItemDetailRows,
  otherItemScope,
  otherItemTitle,
  otherTypeIcon,
  otherTypeLabel,
} from '../../utils/otherSummary';
import type { OtherItem, TripDestination } from '../../context/TripContext';
import styles from './TransportItemCard.module.css';
import stayStyles from './StayItemCard.module.css';
import cardStyles from './OtherItemCard.module.css';

interface OtherItemCardProps {
  item: OtherItem;
  destinations: TripDestination[];
  onEdit: () => void;
}

export function OtherItemCard({ item, destinations, onEdit }: OtherItemCardProps) {
  const rows = otherItemDetailRows(item);
  const phoneRow = item.type === 'seguro' && item.emergencyPhone ? `Central 24h: ${item.emergencyPhone}` : null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {otherTypeIcon(item.type)}
        </span>
        <span className={stayStyles.titleWrap}>
          <span className={styles.title}>{otherItemTitle(item)}</span>
          <span className={stayStyles.typeLabel}>
            {otherTypeLabel(item.type)} · {otherItemScope(item, destinations)}
          </span>
        </span>
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Editar
        </button>
      </div>
      <div className={styles.detailRows}>
        {rows.map((row, i) =>
          phoneRow && row === phoneRow ? (
            <p key={i} className={styles.detail}>
              Central 24h:{' '}
              <a href={`tel:${item.emergencyPhone.replace(/[^\d+]/g, '')}`} className={cardStyles.phoneLink}>
                {item.emergencyPhone}
              </a>
            </p>
          ) : (
            <p key={i} className={styles.detail}>
              {row}
            </p>
          ),
        )}
      </div>
      {item.attachments.length > 0 && (
        <div className={cardStyles.attachments}>
          {item.attachments.map((att) => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className={cardStyles.attachmentLink}
              title={att.fileName}
            >
              <span aria-hidden="true">📎</span>
              <span className={cardStyles.attachmentName}>{att.fileName}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
