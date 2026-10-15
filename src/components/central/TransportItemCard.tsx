import { Check, Copy, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import { transportItemDetailRows, transportItemTitle, transportTypeIcon } from '../../utils/transportSummary';
import type { TransportItem } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './TransportItemCard.module.css';

interface TransportItemCardProps {
  item: TransportItem;
  onEdit: () => void;
}

/** Localizador em destaque com "Copiar" (ajustes-86) — é o que se procura na hora do check-in */
function LocatorRow({ locator }: { locator: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(locator);
      setCopied(true);
    } catch {
      // sem permissão de área de transferência (ex.: http fora do localhost): o código continua à mostra
    }
  }

  return (
    <div className={styles.locatorRow}>
      <span className={styles.locatorText}>
        Localizador <strong className={styles.locatorCode}>{locator}</strong>
      </span>
      <button type="button" className={styles.editButton} onClick={copy} aria-label={`Copiar localizador ${locator}`}>
        <Icon icon={copied ? Check : Copy} /> {copied ? 'Copiado' : 'Copiar'}
      </button>
      {/* anúncio pro leitor de tela, sem depender do ícone */}
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Localizador copiado' : ''}
      </span>
    </div>
  );
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
      {item.type === 'voo' && item.locator && <LocatorRow locator={item.locator} />}
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
    </Card>
  );
}
