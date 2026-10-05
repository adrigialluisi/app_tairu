import { Download, TriangleAlert, Users } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { Switch } from '../shell/Switch';
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
import type { PersonalDocType, PersonalDocument, ReminderLead } from '../../context/DocumentsContext';
import type { Attachment } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import styles from '../central/TransportItemForm.module.css';
import formStyles from '../central/StayItemForm.module.css';
import ownStyles from './DocumentForm.module.css';

interface DocumentFormProps {
  initialDoc: PersonalDocument | null;
  tripEndISO: string | null;
  /** `shared`: compartilhar com o grupo da viagem atual (guardado na viagem, não no documento) */
  onSave: (doc: PersonalDocument, shared: boolean) => void;
  /** só passado quando initialDoc existe (editando) */
  onRemove?: () => void;
  /** null = sem viagem em andamento (o toggle de compartilhar não aparece) */
  tripName: string | null;
  companionCount: number;
  /** estado atual de compartilhamento desse documento na viagem */
  initiallyShared: boolean;
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
  showFullName?: boolean;
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

const RG_CNH_HINT = 'Anexe foto da frente e do verso.';
const PASSPORT_HINT = 'Anexe a página com sua foto e seus dados.';
const GENERIC_HINT = 'Anexe uma foto ou PDF do documento.';
const INSURANCE_HINT = 'Anexe a apólice ou o bilhete do seguro.';

const FIELD_CONFIG: Record<PersonalDocType, DocFieldConfig> = {
  passaporte: {
    showFullName: true,
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
    showVisaDetails: true,
    hint: GENERIC_HINT,
  },
  vacina: {
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
  tripName,
  companionCount,
  initiallyShared,
}: DocumentFormProps) {
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
  const [fullName, setFullName] = useState(initialDoc?.fullName ?? '');
  const [visaEntries, setVisaEntries] = useState<PersonalDocument['visaEntries']>(initialDoc?.visaEntries ?? '');
  const [maxStayDays, setMaxStayDays] = useState(initialDoc?.maxStayDays ?? '');
  const [vaccineDose, setVaccineDose] = useState(initialDoc?.vaccineDose ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialDoc?.emergencyPhone ?? '');
  const [remindBefore, setRemindBefore] = useState<ReminderLead>(initialDoc?.remindBefore ?? '6m');
  // Acesso (ajustes-66): os dois começam desligados — documento é dado sensível
  const [availableOffline, setAvailableOffline] = useState(initialDoc?.availableOffline ?? false);
  const [shared, setShared] = useState(initiallyShared);

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
        holderName,
        number,
        issuer,
        issueDate,
        expiryDate,
        notes,
        attachments,
        fullName,
        visaEntries,
        maxStayDays,
        vaccineDose,
        emergencyPhone,
        remindBefore,
        availableOffline,
      },
      shared,
    );
  }

  const cfg = type ? FIELD_CONFIG[type] : null;

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

      <AttachmentList attachments={attachments} onChange={setAttachments} hint={cfg?.hint ?? GENERIC_HINT} />

      {type && cfg && (
        <>
          {cfg.showFullName && (
            <TextField
              id={`${baseId}-full-name`}
              label="Nome completo (como está no passaporte)"
              placeholder="Ex.: MARIA DA SILVA SOUZA"
              value={fullName}
              onChange={setFullName}
              autoComplete="off"
              autoCapitalize="characters"
            />
          )}

          {cfg.issuerFirst && issuerField}

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

          <div className={ownStyles.holderField}>
            <TextField
              id={`${baseId}-holder-name`}
              label="De quem é (opcional)"
              value={holderName}
              onChange={setHolderName}
              autoComplete="off"
            />
            <p className={ownStyles.holderHint}>Deixe em branco se for seu. Ex.: filho, mãe.</p>
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

      {type && (
        <fieldset className={ownStyles.access}>
          <legend className={ownStyles.accessLegend}>Acesso</legend>
          <div className={ownStyles.accessList}>
            <Switch
              label={
                <>
                  <Icon icon={Download} /> Disponível offline
                </>
              }
              checked={availableOffline}
              onChange={setAvailableOffline}
              hint="Fica salvo no celular pra abrir sem internet, no aeroporto ou na fronteira."
            />
            {tripName !== null && (
              <Switch
                label={
                  <>
                    <Icon icon={Users} /> Compartilhar com o grupo de {tripName}
                  </>
                }
                checked={shared}
                onChange={setShared}
                hint={`Quem você convidou pra essa viagem vê este documento. O número continua escondido até tocar em Mostrar.${
                  companionCount === 0 ? ' Ninguém foi convidado ainda.' : ''
                }`}
              />
            )}
          </div>
        </fieldset>
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
