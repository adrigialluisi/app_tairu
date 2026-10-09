import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { ReadStatus } from '../central/VoucherUpload';
import { DocumentFilePicker, DocumentThumbs } from './DocumentFiles';
import { readDocumentFile } from '../../data/mockVouchers';
import { useAutofill } from '../../hooks/useAutofill';
import { maskSingleDate } from '../../utils/dateMask';
import {
  DOC_TYPES,
  docTypeIcon,
  docTypeShort,
  expiryStatus,
  expiryStatusLabel,
  parseDisplayDate,
} from '../../utils/documentSummary';
import type { PersonalDocType, PersonalDocument, ReminderLead } from '../../context/DocumentsContext';
import type { Attachment } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import styles from '../central/TransportItemForm.module.css';
import formStyles from '../central/StayItemForm.module.css';
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
  label: docTypeShort(t),
  icon: docTypeIcon(t),
}));

const REMINDER_OPTIONS: { value: ReminderLead; label: string }[] = [
  { value: '6m', label: '6 meses antes' },
  { value: '3m', label: '3 meses antes' },
  { value: '1m', label: '1 mês antes' },
  { value: 'off', label: 'Não avisar' },
];

const VISA_ENTRY_OPTIONS: { value: 'unica' | 'multipla'; label: string }[] = [
  { value: 'unica', label: 'Única' },
  { value: 'multipla', label: 'Múltiplas' },
];

interface DocFieldConfig {
  /** rótulo do campo de nome — todos os tipos têm (ajustes-82), opcional, no lugar do antigo "De quem é" */
  fullNameLabel: string;
  /** seguro anual: seguradora vem antes do plano e da apólice */
  issuerFirst?: boolean;
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
  issueLabel?: string;
  expiryLabel?: string;
  showVisaDetails?: boolean;
  showDose?: boolean;
  showEmergencyPhone?: boolean;
  hint: string;
}

const RG_CNH_HINT = 'Envie foto da frente e do verso.';
const PASSPORT_HINT = 'Envie a página com sua foto e seus dados.';
const GENERIC_HINT = 'Envie uma foto ou PDF do documento.';
const INSURANCE_HINT = 'Envie a apólice ou o bilhete do seguro (opcional).';

const FIELD_CONFIG: Record<PersonalDocType, DocFieldConfig> = {
  passaporte: {
    fullNameLabel: 'Nome completo (como está no passaporte)',
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
    fullNameLabel: 'Nome completo (como está no documento)',
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
    fullNameLabel: 'Nome completo (como está no documento)',
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
    fullNameLabel: 'Nome completo (como está no documento)',
    showTitle: false,
    showNumber: true,
    numberLabel: 'Número (opcional)',
    showIssuer: true,
    issuerLabel: 'País emissor',
    dateMode: 'both',
    hint: GENERIC_HINT,
  },
  visto: {
    fullNameLabel: 'Nome completo (como está no visto)',
    showTitle: true,
    titleLabel: 'Qual visto (opcional)',
    titlePlaceholder: 'Ex.: Visto americano B1/B2',
    showNumber: true,
    numberLabel: 'Número do visto (opcional)',
    showIssuer: true,
    issuerLabel: 'País do visto',
    issuerPlaceholder: 'Ex.: Estados Unidos',
    dateMode: 'both',
    showVisaDetails: true,
    hint: GENERIC_HINT,
  },
  vacina: {
    fullNameLabel: 'Nome de quem tomou a vacina',
    showTitle: true,
    titleLabel: 'Qual vacina (opcional)',
    titlePlaceholder: 'Ex.: Febre amarela',
    showNumber: false,
    showIssuer: false,
    dateMode: 'vaccine',
    showDose: true,
    hint: GENERIC_HINT,
  },
  'seguro-anual': {
    fullNameLabel: 'Nome do titular do seguro',
    issuerFirst: true,
    showTitle: true,
    titleLabel: 'Plano ou cartão (opcional)',
    titlePlaceholder: 'Ex.: Seguro do cartão Visa Infinite',
    showNumber: true,
    numberLabel: 'Nº da apólice (opcional)',
    showIssuer: true,
    issuerLabel: 'Seguradora',
    dateMode: 'both',
    issueLabel: 'Início da vigência',
    expiryLabel: 'Fim da vigência',
    showEmergencyPhone: true,
    hint: INSURANCE_HINT,
  },
  outro: {
    fullNameLabel: 'Nome completo',
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

export function DocumentForm({
  initialDoc,
  tripEndISO,
  onSave,
  onRemove,
}: DocumentFormProps) {
  const baseId = useId();

  const [type, setType] = useState<PersonalDocType | null>(initialDoc?.type ?? null);
  const [title, setTitle] = useState(initialDoc?.title ?? '');
  const [number, setNumber] = useState(initialDoc?.number ?? '');
  const [issuer, setIssuer] = useState(initialDoc?.issuer ?? '');
  const [issueDate, setIssueDate] = useState(initialDoc?.issueDate ?? '');
  const [expiryDate, setExpiryDate] = useState(initialDoc?.expiryDate ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialDoc?.attachments ?? []);
  const [fullName, setFullName] = useState(initialDoc?.fullName ?? '');
  const [visaEntries, setVisaEntries] = useState<PersonalDocument['visaEntries']>(initialDoc?.visaEntries ?? '');
  const [maxStayDays, setMaxStayDays] = useState(initialDoc?.maxStayDays ?? '');
  const [vaccineDose, setVaccineDose] = useState(initialDoc?.vaccineDose ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialDoc?.emergencyPhone ?? '');
  const [remindBefore, setRemindBefore] = useState<ReminderLead>(initialDoc?.remindBefore ?? '6m');
  const af = useAutofill();

  /**
   * Arquivos novos (ajustes-84): entram nos anexos e o último é "lido" (simulado) —
   * dados do arquivo de exemplo, se for um deles e do tipo escolhido, ou o exemplo do
   * tipo. Sempre preenche; só destaca o que veio com valor.
   */
  function handleFiles(files: File[]) {
    if (!type) return;
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
      })),
    ]);
    const { fields } = readDocumentFile(files[files.length - 1], type);
    af.read(() => {
      const keys: string[] = [];
      const set = <T,>(value: T | undefined, setter: (v: T) => void, key: string) => {
        if (value === undefined) return;
        setter(value);
        if (value !== '') keys.push(key);
      };
      set(fields.title, setTitle, 'title');
      set(fields.fullName, setFullName, 'full-name');
      set(fields.number, setNumber, 'number');
      set(fields.issuer, setIssuer, 'issuer');
      set(fields.issueDate, setIssueDate, 'issue-date');
      set(fields.expiryDate, setExpiryDate, 'expiry-date');
      set(fields.visaEntries, setVisaEntries, 'visa-entries');
      set(fields.maxStayDays, setMaxStayDays, 'max-stay');
      set(fields.vaccineDose, setVaccineDose, 'dose');
      set(fields.emergencyPhone, setEmergencyPhone, 'emergency-phone');
      return keys;
    });
  }

  function removeAttachment(att: Attachment) {
    URL.revokeObjectURL(att.url);
    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
  }

  function handleTypeChange(newType: PersonalDocType) {
    setType(newType);
    if ((newType === 'passaporte' || newType === 'pid') && issuer.trim() === '') {
      setIssuer('Brasil');
    }
  }

  function handleSave() {
    if (!type) return;
    const id = initialDoc?.id ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onSave(
      {
        id,
        type,
        title,
        number,
        issuer,
        issueDate,
        expiryDate,
        attachments,
        fullName,
        visaEntries,
        maxStayDays,
        vaccineDose,
        emergencyPhone,
        remindBefore,
      },
    );
  }

  const cfg = type ? FIELD_CONFIG[type] : null;
  // documento pessoal exige a imagem (ajustes-84); seguro anual e "outro" continuam opcionais
  const photoRequired = type !== null && type !== 'seguro-anual' && type !== 'outro';
  const missingPhoto = photoRequired && attachments.length === 0;

  const expiryError = expiryDate.length === 10 && !parseDisplayDate(expiryDate) ? 'Data inválida.' : null;
  const issueError = issueDate.length === 10 && !parseDisplayDate(issueDate) ? 'Data inválida.' : null;

  const previewStatus = expiryStatus({ expiryDate, remindBefore } as PersonalDocument, tripEndISO);
  const previewLabel = expiryStatusLabel(previewStatus);
  const previewIsAlert = previewStatus.kind === 'expired' || previewStatus.kind === 'before-trip-end';

  /** "Me avisar" só faz sentido com validade: tipos com as duas datas, ou vacina com "Válida até" preenchida. */
  const showReminder = cfg
    ? cfg.dateMode === 'both' || (cfg.dateMode === 'vaccine' && expiryDate.trim() !== '')
    : false;

  const issuerField = cfg?.showIssuer && (
    <TextField
      id={`${baseId}-issuer`}
      highlight={af.hl('issuer')}
      label={cfg.issuerLabel as string}
      placeholder={cfg.issuerPlaceholder}
      value={issuer}
      onChange={setIssuer}
      autoComplete="off"
    />
  );

  return (
    <div className={styles.form}>
      <OptionChipGroup legend="Qual documento?" options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />

      {/* 1º bloco depois do tipo: a foto ou o arquivo do documento (ajustes-84) */}
      {type && cfg && (
        <div className="flex flex-col gap-(--space-label)">
          <p className="m-0 text-sm font-medium text-foreground">
            Foto ou arquivo do documento{photoRequired && <span className="visually-hidden"> (obrigatório)</span>}
          </p>
          <p className={ownStyles.holderHint}>{cfg.hint}</p>
          <div className="mt-1 flex flex-col gap-3">
            <DocumentFilePicker onFiles={handleFiles} disabled={af.reading} />
            <DocumentThumbs attachments={attachments} docLabel={docTypeShort(type)} onRemove={removeAttachment} />
            <ReadStatus reading={af.reading} filled={af.filled} />
          </div>
        </div>
      )}

      {/* campos desabilitados enquanto "lê" o arquivo; display: contents mantém o gap do formulário */}
      <fieldset disabled={af.reading} className="contents">
      {type && cfg && (
        <>
          {/* nome em todos os tipos, opcional (sem "(opcional)" no rótulo pra não alongar) — ajustes-82 */}
          <TextField
            id={`${baseId}-full-name`}
            highlight={af.hl('full-name')}
            label={cfg.fullNameLabel}
            placeholder="Ex.: MARIA DA SILVA SOUZA"
            value={fullName}
            onChange={setFullName}
            autoComplete="off"
            autoCapitalize="characters"
          />

          {cfg.issuerFirst && issuerField}

          {cfg.showTitle && (
            <TextField
              id={`${baseId}-title`}
              highlight={af.hl('title')}
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
              highlight={af.hl('number')}
              label={cfg.numberLabel as string}
              value={number}
              onChange={setNumber}
              autoComplete="off"
              autoCapitalize={cfg.numberAutoCapitalize ? 'characters' : undefined}
            />
          )}

          {!cfg.issuerFirst && issuerField}

          {cfg.showVisaDetails && (
            <>
              <OptionChipGroup
                legend="Entradas (opcional)"
                options={VISA_ENTRY_OPTIONS}
                value={visaEntries || null}
                // tocar de novo na opção marcada desmarca (campo é opcional)
                onChange={(v) => setVisaEntries((prev) => (prev === v ? '' : v))}
              />
              <TextField
                id={`${baseId}-max-stay`}
                highlight={af.hl('max-stay')}
                label="Permanência máxima (opcional)"
                placeholder="Ex.: 90"
                inputMode="numeric"
                value={maxStayDays}
                onChange={(v) => setMaxStayDays(v.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
                rightElement={
                  <span className={ownStyles.suffix} aria-hidden="true">
                    dias
                  </span>
                }
              />
            </>
          )}

          {cfg.showDose && (
            <TextField
              id={`${baseId}-dose`}
              highlight={af.hl('dose')}
              label="Dose (opcional)"
              placeholder="Ex.: 1ª dose, reforço, dose única"
              value={vaccineDose}
              onChange={setVaccineDose}
              autoComplete="off"
            />
          )}

          {cfg.dateMode === 'vaccine' && (
            <div className={ownStyles.holderField}>
              <div className={formStyles.timeRow}>
                <TextField
                  id={`${baseId}-issue-date`}
                  highlight={af.hl('issue-date')}
                  label="Data da vacina"
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  value={issueDate}
                  onChange={(v) => setIssueDate(maskSingleDate(v))}
                  error={issueError}
                  autoComplete="off"
                />
                <TextField
                  id={`${baseId}-expiry-date`}
                  highlight={af.hl('expiry-date')}
                  label="Válida até (opcional)"
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  value={expiryDate}
                  onChange={(v) => setExpiryDate(maskSingleDate(v))}
                  error={expiryError}
                  autoComplete="off"
                />
              </div>
              <p className={ownStyles.holderHint}>Preencha a validade só se o certificado tiver uma.</p>
            </div>
          )}

          {cfg.dateMode === 'issue-only' && (
            <TextField
              id={`${baseId}-issue-date`}
              highlight={af.hl('issue-date')}
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
                highlight={af.hl('issue-date')}
                label={cfg.issueLabel ?? 'Emissão'}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                value={issueDate}
                onChange={(v) => setIssueDate(maskSingleDate(v))}
                error={issueError}
                autoComplete="off"
              />
              <TextField
                id={`${baseId}-expiry-date`}
                highlight={af.hl('expiry-date')}
                label={cfg.expiryLabel ?? 'Validade'}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                value={expiryDate}
                onChange={(v) => setExpiryDate(maskSingleDate(v))}
                error={expiryError}
                autoComplete="off"
              />
            </div>
          )}

          {cfg.showEmergencyPhone && (
            <TextField
              id={`${baseId}-emergency-phone`}
              highlight={af.hl('emergency-phone')}
              label="Telefone da central 24h (opcional)"
              placeholder="Ex.: +55 11 0000-0000"
              inputMode="tel"
              value={emergencyPhone}
              onChange={setEmergencyPhone}
              autoComplete="off"
            />
          )}

          {showReminder && (
            <div className={ownStyles.holderField}>
              <OptionChipGroup
                legend="Me avisar antes do vencimento"
                options={REMINDER_OPTIONS}
                value={remindBefore}
                onChange={setRemindBefore}
              />
              <p className={ownStyles.holderHint}>O aviso aparece na tela Início.</p>
            </div>
          )}

          {previewLabel && (
            <Badge variant={previewIsAlert ? 'alert' : 'neutral'}>
              <Icon icon={TriangleAlert} /> {previewLabel}
            </Badge>
          )}
        </>
      )}

      </fieldset>

      <div className={styles.actions}>
        <Button
          fullWidth
          disabled={!type || missingPhoto || af.reading}
          onClick={handleSave}
          aria-describedby={missingPhoto ? `${baseId}-photo-hint` : undefined}
        >
          Salvar documento
        </Button>
        {missingPhoto && (
          <p id={`${baseId}-photo-hint`} className={ownStyles.holderHint}>
            Envie a foto do documento pra salvar.
          </p>
        )}
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
