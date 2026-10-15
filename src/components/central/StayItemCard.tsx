import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { getHotel } from '../../data';
import { hotelPhotoUrl, stayItemDetailRows, stayItemTitle, stayTypeIcon, stayTypeLabel } from '../../utils/staySummary';
import type { StayItem } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './TransportItemCard.module.css';
import stayStyles from './StayItemCard.module.css';

export function StayItemCard({ item, onEdit }: { item: StayItem; onEdit: () => void }) {
  const hotel = getHotel(item.hotelId);
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = photoFailed ? null : hotel ? hotelPhotoUrl(hotel) : null;

  return (
    <Card className={`px-4 ${styles.card}`}>
      <div className={styles.header}>
        {photo ? (
          <img
            src={photo}
            alt=""
            className={stayStyles.thumb}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <span className={styles.icon} aria-hidden="true">
            <Icon icon={stayTypeIcon(item.type)} />
          </span>
        )}
        <span className={stayStyles.titleWrap}>
          <span className={styles.title}>{stayItemTitle(item)}</span>
          <span className={stayStyles.typeLabel}>
            {stayTypeLabel(item.type)}
            {hotel?.stars ? (
              <>
                {' · '}
                <span aria-label={`${hotel.stars} estrelas`}>{'★'.repeat(hotel.stars)}</span>
              </>
            ) : null}
          </span>
        </span>
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Editar
        </button>
      </div>
      <div className={styles.detailRows}>
        {stayItemDetailRows(item).map((row, i) => (
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
    </Card>
  );
}
