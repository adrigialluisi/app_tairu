import { useId, useState } from 'react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { AttachmentList } from '../central/AttachmentList';
import { maskSingleDate } from '../../utils/dateMask';
import {
  DOC_TYPES,
  docTypeIcon,
  docTypeShort,
  expiryStatus,
  expiryStatusLabel,
  parseDisplayDate,
} from '../../utils/documentSummary';
import type { PersonalDocType, PersonalDocument } from '../../context/DocumentsContext';
import type { Attachment } from '../../context/TripContext';
import styles from '../central/TransportItemForm.module.css';
import formStyles from '../central/StayItemForm.module.css';
import cardStyles from './DocumentCard.module.css';
import ownStyles from './DocumentForm.module.css';

interface DocumentFormProps {
  initialDoc: PersonalDocument | null;
  tripEndISO: string | null;
  onSave: (doc: PersonalDocument) => void;
  /** só passado quando initialDoc existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: { value: PersonalDocType; label: string }[] = DOC_TYPES.map((t) => ({
  value: t,
  label: `${docTypeIcon(t)} ${docTypeShort(t)}`,
}));

interface DocFieldConfig {
  showTitle: boolean;
  titleLabel?: string;
  titlePlaceholder?: string;
  showNumber: boolean;
  numberLabel?: string;
  numberAutoCapitalize?: boolean;
  showIssuer: boolean;
  issuerLabel?: string;
  issuerPlaceholder?: string;
  dateMode: 'both' | 'issue-only' | 'vaccine';
  hint: string;
}

const RG_CNH_HINT = 'Anexe foto da frente e do verso.';
const PASSPORT_HINT = 'Anexe a página com sua foto e seus dados.';
const GENERIC_HINT = 'Anexe uma foto ou PDF do documento.';

const FIELD_CONFIG: Record<PersonalDocType, DocFieldConfig> = {
  passaporte: {
    showTitle: false,
    showNumber: true,
    numberLabel: 'Número do passaporte',
    numberAutoCapitalize: true,
    showIssuer: true,
    issuerLabel: 'País emissor',
    dateMode: 'both',
    hint: PASSPORT_HINT,
  },
  rg: {
    showTitle: false,
    showNumber: true,
    numberLabel: 'Número do RG',
    showIssuer: true,
    issuerLabel: 'Órgão emissor / UF',
    issuerPlaceholder: 'Ex.: SSP-SP',
    dateMode: 'issue-only',
    hint: RG_CNH_HINT,
  },
  cnh: {
    showTitle: false,
    showNumber: true,
    numberLabel: 'Nº de registro da CNH',
    showIssuer: true,
    issuerLabel: 'UF',
    issuerPlaceholder: 'Ex.: SP',
    dateMode: 'both',
    hint: RG_CNH_HINT,
  },
  pid: {
    showTitle: false,
    showNumber: true,
    numberLabel: 'Número (opcional)',
    showIssuer: true,
    issuerLabel: 'País emissor',
    dateMode: 'both',
    hint: GENERIC_HINT,
  },
  visto: {
    showTitle: true,
    titleLabel: 'Qual visto (opcional)',
    titlePlaceholder: 'Ex.: Visto americano B1/B2',
    showNumber: true,
    numberLabel: 'Número do visto (opcional)',
    showIssuer: true,
    issuerLabel: 'País do visto',
    issuerPlaceholder: 'Ex.: Estados Unidos',
    dateMode: 'both',
    hint: GENERIC_HINT,
  },
  vacina: {
    showTitle: true,
    titleLabel: 'Qual vacina (opcional)',
    titlePlaceholder: 'Ex.: Febre amarela',
    showNumber: false,
    showIssuer: false,
    dateMode: 'vaccine',
    hint: GENERIC_HINT,
  },
  outro: {
    showTitle: true,
    titleLabel: 'Nome do documento',
    titlePlaceholder: 'Ex.: Carteira de estudante',
    showNumber: true,
    numberLabel: 'Número (opcional)',
    showIssuer: true,
    issuerLabel: 'Emitido por (opcional)',
    dateMode: 'both',
    hint: GENERIC_HINT,
  },
};

export function DocumentForm({ initialDoc, tripEndISO, onSave, onRemove }: DocumentFormProps) {
  const baseId = useId();

  const [type, setType] = useState<PersonalDocType | null>(initialDoc?.type ?? null);
  const [title, setTitle] = useState(initialDoc?.title ?? '');
  const [holderName, setHolderName] = useState(initialDoc?.holderName ?? '');
  const [number, setNumber] = useState(initialDoc?.number ?? '');
  const [issuer, setIssuer] = useState(initialDoc?.issuer ?? '');
  const [issueDate, setIssueDate] = useState(initialDoc?.issueDate ?? '');
  const [expiryDate, setExpiryDate] = useState(initialDoc?.expiryDate ?? '');
  const [notes, setNotes] = useState(initialDoc?.notes ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialDoc?.attachments ?? []);

  function handleTypeChange(newType: PersonalDocType) {
    setType(newType);
    if ((newType === 'passaporte' || newType === 'pid') && issuer.trim() === '') {
      setIssuer('Brasil');
    }
  }

  function handleSave() {
    if (!type) return;
    const id = initialDoc?.id ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onSave({
      id,
      type,
      title,
      holderName,
      number,
      issuer,
      issueDate,
      expiryDate,
      notes,
      attachments,
    });
  }

  const cfg = type ? FIELD_CONFIG[type] : null;

  const expiryError = expiryDate.length === 10 && !parseDisplayDate(expiryDate) ? 'Data inválida.' : null;
  const issueError = issueDate.length === 10 && !parseDisplayDate(issueDate) ? 'Data inválida.' : null;

  const previewStatus = expiryStatus({ expiryDate } as PersonalDocument, tripEndISO);
  const previewLabel = expiryStatusLabel(previewStatus);
  const previewIsAlert = previewStatus.kind === 'expired' || previewStatus.kind === 'before-trip-end';

  return (
    <div className={styles.form}>
      <OptionChipGroup legend="Qual documento?" options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />

      <AttachmentList attachments={attachments} onChange={setAttachments} hint={cfg?.hint ?? GENERIC_HINT} />

      {type && cfg && (
        <>
          {cfg.showTitle && (
            <TextField
              id={`${baseId}-title`}
              label={cfg.titleLabel as string}
              placeholder={cfg.titlePlaceholder}
              value={title}
              onChange={setTitle}
              autoComplete="off"
            />
          )}

          {cfg.showNumber && (
            <TextField
              id={`${baseId}-number`}
              label={cfg.numberLabel as string}
              value={number}
              onChange={setNumber}
              autoComplete="off"
              autoCapitalize={cfg.numberAutoCapitalize ? 'characters' : undefined}
            />
          )}

          {cfg.showIssuer && (
            <TextField
              id={`${baseId}-issuer`}
              label={cfg.issuerLabel as string}
              placeholder={cfg.issuerPlaceholder}
              value={issuer}
              onChange={setIssuer}
              autoComplete="off"
            />
          )}

          {cfg.dateMode === 'vaccine' && (
            <TextField
              id={`${baseId}-issue-date`}
              label="Data da vacina"
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              value={issueDate}
              onChange={(v) => setIssueDate(maskSingleDate(v))}
              error={issueError}
              autoComplete="off"
            />
          )}

          {cfg.dateMode === 'issue-only' && (
            <TextField
              id={`${baseId}-issue-date`}
              label="Emissão"
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              value={issueDate}
              onChange={(v) => setIssueDate(maskSingleDate(v))}
              error={issueError}
              autoComplete="off"
            />
          )}

          {cfg.dateMode === 'both' && (
            <div className={formStyles.timeRow}>
              <TextField
                id={`${baseId}-issue-date`}
                label="Emissão"
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                value={issueDate}
                onChange={(v) => setIssueDate(maskSingleDate(v))}
                error={issueError}
                autoComplete="off"
              />
              <TextField
                id={`${baseId}-expiry-date`}
                label="Validade"
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                value={expiryDate}
                onChange={(v) => setExpiryDate(maskSingleDate(v))}
                error={expiryError}
                autoComplete="off"
              />
            </div>
          )}

          {previewLabel && (
            <span className={`${cardStyles.badge} ${previewIsAlert ? cardStyles.badgeAlert : cardStyles.badgeSoon}`}>
              <span aria-hidden="true">⚠</span> {previewLabel}
            </span>
          )}

          <div className={ownStyles.holderField}>
            <TextField
              id={`${baseId}-holder-name`}
              label="Nome no documento (opcional)"
              value={holderName}
              onChange={setHolderName}
              autoComplete="off"
            />
            <p className={ownStyles.holderHint}>Deixe em branco se for seu.</p>
          </div>

          <TextField
            id={`${baseId}-notes`}
            label="Observações (opcional)"
            value={notes}
            onChange={setNotes}
            autoComplete="off"
          />
        </>
      )}

      <div className={styles.actions}>
        <Button fullWidth disabled={!type} onClick={handleSave}>
          Salvar documento
        </Button>
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${formStyles.removeOnly}`}
              onClick={onRemove}
            >
              Remover documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
