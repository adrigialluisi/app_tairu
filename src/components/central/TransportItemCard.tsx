import { transportItemDetailRows, transportItemTitle, transportTypeIcon } from '../../utils/transportSummary';
import type { TransportItem } from '../../context/TripContext';
import styles from './TransportItemCard.module.css';

interface TransportItemCardProps {
  item: TransportItem;
  onEdit: () => void;
}

export function TransportItemCard({ item, onEdit }: TransportItemCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {transportTypeIcon(item.type)}
        </span>
        <span className={styles.title}>{transportItemTitle(item)}</span>
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Editar
        </button>
      </div>
      <div className={styles.detailRows}>
        {transportItemDetailRows(item).map((row, i) => (
          <p key={i} className={styles.detail}>
            {row}
          </p>
        ))}
      </div>
      {item.voucherFileName && (
        <p className={styles.voucherNote}>
          <span aria-hidden="true">📎</span> Voucher anexado
        </p>
      )}
    </div>
  );
}
