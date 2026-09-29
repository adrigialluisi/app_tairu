import { useState } from 'react';
import {
  docTypeIcon,
  docTypeLabel,
  docTypeShort,
  documentTitle,
  expiryStatus,
  expiryStatusLabel,
  maskDocNumber,
} from '../../utils/documentSummary';
import type { PersonalDocument } from '../../context/DocumentsContext';
import styles from '../central/TransportItemCard.module.css';
import stayStyles from '../central/StayItemCard.module.css';
import attachmentStyles from '../central/OtherItemCard.module.css';
import cardStyles from './DocumentCard.module.css';

interface DocumentCardProps {
  doc: PersonalDocument;
  tripEndISO: string | null;
  onEdit: () => void;
}

export function DocumentCard({ doc, tripEndISO, onEdit }: DocumentCardProps) {
  const [numberVisible, setNumberVisible] = useState(false);
  const status = expiryStatus(doc, tripEndISO);
  const badgeLabel = expiryStatusLabel(status);
  const isAlert = status.kind === 'expired' || status.kind === 'before-trip-end';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {docTypeIcon(doc.type)}
        </span>
        <span className={stayStyles.titleWrap}>
          <span className={cardStyles.titleRow}>
            <span className={styles.title}>{documentTitle(doc)}</span>
            {badgeLabel && (
              <span className={`${cardStyles.badge} ${isAlert ? cardStyles.badgeAlert : cardStyles.badgeSoon}`}>
                <span aria-hidden="true">⚠</span> {badgeLabel}
              </span>
            )}
          </span>
          <span className={stayStyles.typeLabel}>
            {docTypeShort(doc.type)}
            {doc.holderName ? ` · ${doc.holderName}` : ''}
          </span>
        </span>
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Editar
        </button>
      </div>

      <div className={styles.detailRows}>
        {doc.number && (
          <p className={styles.detail}>
            Nº {numberVisible ? doc.number : maskDocNumber(doc.number)}{' '}
            <button
              type="button"
              className={cardStyles.showButton}
              aria-pressed={numberVisible}
              aria-label={`${numberVisible ? 'Ocultar' : 'Mostrar'} número de ${docTypeLabel(doc.type)}`}
              onClick={() => setNumberVisible((v) => !v)}
            >
              {numberVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          </p>
        )}
        {doc.issuer && <p className={styles.detail}>Emitido por {doc.issuer}</p>}
        {doc.expiryDate ? (
          <p className={styles.detail}>Validade: {doc.expiryDate}</p>
        ) : doc.issueDate ? (
          <p className={styles.detail}>Emissão: {doc.issueDate}</p>
        ) : null}
        {doc.notes && <p className={styles.detail}>{doc.notes}</p>}
      </div>

      {doc.attachments.length > 0 ? (
        <div className={attachmentStyles.attachments}>
          {doc.attachments.map((att) => (
            <a
              key={att.id}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className={attachmentStyles.attachmentLink}
              title={att.fileName}
            >
              <span aria-hidden="true">📎</span>
              <span className={attachmentStyles.attachmentName}>{att.fileName}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className={styles.detail}>Nenhum arquivo anexado</p>
      )}
    </div>
  );
}
