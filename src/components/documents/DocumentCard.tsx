import { Download, Paperclip, TriangleAlert, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from '../central/TransportItemCard.module.css';
import stayStyles from '../central/StayItemCard.module.css';
import attachmentStyles from '../central/OtherItemCard.module.css';
import cardStyles from './DocumentCard.module.css';

interface DocumentCardProps {
  doc: PersonalDocument;
  tripEndISO: string | null;
  /** não usado em modo só leitura */
  onEdit?: () => void;
  /** Documentos do grupo, em Convidados: sem "Editar" (Mostrar do número e anexos continuam) */
  readOnly?: boolean;
  /** selos de acesso (ajustes-66) */
  shared?: boolean;
  /** linha "De: …" (Documentos do grupo) */
  fromLabel?: string;
}

export function DocumentCard({
  doc,
  tripEndISO,
  onEdit,
  readOnly = false,
  shared = false,
  fromLabel,
}: DocumentCardProps) {
  const [numberVisible, setNumberVisible] = useState(false);
  const status = expiryStatus(doc, tripEndISO);
  const badgeLabel = expiryStatusLabel(status);
  const isAlert = status.kind === 'expired' || status.kind === 'before-trip-end';
  const isInsurance = doc.type === 'seguro-anual';

  const visaRow =
    doc.type === 'visto'
      ? [
          doc.visaEntries === 'unica' ? 'Entrada única' : doc.visaEntries === 'multipla' ? 'Entradas múltiplas' : '',
          doc.maxStayDays ? `até ${doc.maxStayDays} dias` : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  let dateRow: string | null = null;
  if (doc.type === 'vacina') {
    const parts = [
      doc.issueDate ? `Vacinada em ${doc.issueDate}` : '',
      doc.expiryDate ? `${doc.issueDate ? 'válida' : 'Válida'} até ${doc.expiryDate}` : '',
    ].filter(Boolean);
    dateRow = parts.length ? parts.join(', ') : null;
  } else if (isInsurance && (doc.issueDate || doc.expiryDate)) {
    dateRow = `Vigência: ${doc.issueDate || '—'} – ${doc.expiryDate || '—'}`;
  } else if (doc.expiryDate) {
    dateRow = `Validade: ${doc.expiryDate}`;
  } else if (doc.issueDate) {
    dateRow = `Emissão: ${doc.issueDate}`;
  }

  return (
    <Card className={`px-4 ${styles.card}`}>
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={docTypeIcon(doc.type)} />
        </span>
        <span className={stayStyles.titleWrap}>
          <span className={cardStyles.titleRow}>
            <span className={styles.title}>{documentTitle(doc)}</span>
            {badgeLabel && (
              <Badge variant={isAlert ? 'alert' : 'neutral'}>
                <Icon icon={TriangleAlert} /> {badgeLabel}
              </Badge>
            )}
          </span>
          <span className={stayStyles.typeLabel}>
            {docTypeShort(doc.type)}
            {doc.holderName ? ` · ${doc.holderName}` : ''}
          </span>
          {(doc.availableOffline || shared) && (
            <span className={cardStyles.accessBadges}>
              {doc.availableOffline && (
                <Badge variant="neutral">
                  <Icon icon={Download} /> Offline
                </Badge>
              )}
              {shared && (
                <Badge variant="neutral">
                  <Icon icon={Users} /> Compartilhado
                </Badge>
              )}
            </span>
          )}
        </span>
        {!readOnly && onEdit && (
          <button type="button" className={styles.editButton} onClick={onEdit}>
            Editar
          </button>
        )}
      </div>

      <div className={styles.detailRows}>
        {fromLabel && <p className={styles.detail}>De: {fromLabel}</p>}
        {doc.type === 'passaporte' && doc.fullName && <p className={styles.detail}>{doc.fullName}</p>}
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
        {doc.issuer && <p className={styles.detail}>{isInsurance ? doc.issuer : `Emitido por ${doc.issuer}`}</p>}
        {visaRow && <p className={styles.detail}>{visaRow}</p>}
        {doc.type === 'vacina' && doc.vaccineDose && <p className={styles.detail}>{doc.vaccineDose}</p>}
        {dateRow && <p className={styles.detail}>{dateRow}</p>}
        {isInsurance && doc.emergencyPhone && (
          <p className={styles.detail}>
            Central 24h:{' '}
            <a
              href={`tel:${doc.emergencyPhone.replace(/[^\d+]/g, '')}`}
              className={`${attachmentStyles.phoneLink} ${cardStyles.phoneLink}`}
            >
              {doc.emergencyPhone}
            </a>
          </p>
        )}
        {doc.expiryDate && doc.remindBefore === 'off' && <p className={styles.detail}>Sem aviso de vencimento</p>}
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
              <Icon icon={Paperclip} />
              <span className={attachmentStyles.attachmentName}>{att.fileName}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className={styles.detail}>Nenhum arquivo anexado</p>
      )}
    </Card>
  );
}
