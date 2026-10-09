import { TriangleAlert } from 'lucide-react';
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
import { OfflineBadge } from '../shell/OfflineBadge';
import { DocumentThumbs } from './DocumentFiles';
import { Card } from '@/components/ui/card';
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
    // sem validade preenchida = vale por toda a vida (ex.: febre amarela, ajustes-84)
    dateRow = parts.length ? `${parts.join(', ')}${doc.expiryDate ? '' : ' · Sem validade'}` : null;
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
            {/* o nome distingue, por ex., a vacina do filho da sua (ajustes-82, no lugar do "De quem é") */}
            {doc.fullName ? ` · ${doc.fullName}` : ''}
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
      </div>

      {/* imagem vira miniatura que abre em tela cheia; PDF continua com ícone (ajustes-84) */}
      {doc.attachments.length > 0 ? (
        <DocumentThumbs attachments={doc.attachments} docLabel={documentTitle(doc)} />
      ) : (
        <p className={styles.detail}>Nenhum arquivo anexado</p>
      )}

      {/* todo documento salvo abre sem internet (ajustes-82) */}
      <OfflineBadge />
    </Card>
  );
}
