import { Paperclip } from 'lucide-react';
import { transportItemDetailRows, transportItemTitle, transportTypeIcon } from '../../utils/transportSummary';
import type { TransportItem } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { OfflineBadge } from '../shell/OfflineBadge';
import { Card } from '@/components/ui/card';
import styles from './TransportItemCard.module.css';

interface TransportItemCardProps {
  item: TransportItem;
  onEdit: () => void;
}

export function TransportItemCard({ item, onEdit }: TransportItemCardProps) {
  return (
    <Card className={`px-4 ${styles.card}`}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={transportTypeIcon(item.type)} />
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
          <Icon icon={Paperclip} /> Voucher anexado
        </p>
      )}
      {/* item salvo abre sem internet (ajustes-82) */}
      <OfflineBadge />
    </Card>
  );
}
