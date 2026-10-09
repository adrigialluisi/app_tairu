import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { DateRangeField } from '../inputs/DateRangeField';
import { AttachmentList } from './AttachmentList';
import { VoucherUpload } from './VoucherUpload';
import { readOtherFile } from '../../data/mockVouchers';
import { useAutofill } from '../../hooks/useAutofill';
import { OTHER_TYPES, otherTypeIcon, otherTypeLabel } from '../../utils/otherSummary';
import { maskTime } from '../../utils/dateMask';
import type { Attachment, OtherItem, OtherItemType, TripDestination } from '../../context/TripContext';
import styles from './TransportItemForm.module.css';
import formStyles from './StayItemForm.module.css';

interface OtherItemFormProps {
  destinations: TripDestination[];
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: OtherItem | null;
  onSave: (item: OtherItem) => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: { value: OtherItemType; label: string }[] = OTHER_TYPES.map((t) => ({
  value: t,
  label: otherTypeLabel(t),
  icon: otherTypeIcon(t),
}));

interface FieldConfig {
  providerLabel: string | null;
  titleLabel: string;
  titlePlaceholder?: string;
  dateLabel: string;
  showTime: boolean;
  timeLabel?: string;
  timePlaceholder?: string;
  showLocation: boolean;
  locationLabel?: string;
  referenceLabel: string | null;
  showEmergencyPhone: boolean;
  notesPlaceholder?: string;
}

const FIELD_CONFIG: Record<OtherItemType, FieldConfig> = {
  seguro: {
    providerLabel: 'Seguradora',
    titleLabel: 'Plano (opcional)',
    titlePlaceholder: 'Ex.: Mundo, cobertura USD 60 mil',
    dateLabel: 'Vigência',
    showTime: false,
    showLocation: false,
    referenceLabel: 'Nº da apólice',
    showEmergencyPhone: true,
  },
  passeio: {
    providerLabel: 'Agência / empresa (opcional)',
    titleLabel: 'Nome do passeio',
    titlePlaceholder: 'Ex.: Valle de la Luna',
    dateLabel: 'Data',
    showTime: true,
    timeLabel: 'Horário de saída',
    timePlaceholder: 'Ex.: 08:00',
    showLocation: true,
    locationLabel: 'Ponto de encontro',
    referenceLabel: 'Código da reserva (opcional)',
    showEmergencyPhone: false,
    notesPlaceholder: 'Ex.: levar casaco',
  },
  ingresso: {
    providerLabel: null,
    titleLabel: 'Evento ou atração',
    titlePlaceholder: 'Ex.: Show, museu, jogo',
    dateLabel: 'Data',
    showTime: true,
    timeLabel: 'Horário',
    timePlaceholder: 'Ex.: 19:00',
    showLocation: true,
    locationLabel: 'Local',
    referenceLabel: 'Código do ingresso (opcional)',
    showEmergencyPhone: false,
  },
};

export function OtherItemForm({ destinations, initialItem, onSave, onRemove }: OtherItemFormProps) {
  const baseId = useId();
  const navigate = useNavigate();

  const [type, setType] = useState<OtherItemType | null>(initialItem?.type ?? null);
  const [destinationId, setDestinationId] = useState<string | null>(initialItem?.destinationId ?? null);
  const [title, setTitle] = useState(initialItem?.title ?? '');
  const [provider, setProvider] = useState(initialItem?.provider ?? '');
  const [referenceCode, setReferenceCode] = useState(initialItem?.referenceCode ?? '');
  const [startDate, setStartDate] = useState(initialItem?.startDate ?? null);
  const [endDate, setEndDate] = useState(initialItem?.endDate ?? null);
  const [time, setTime] = useState(initialItem?.time ?? '');
  const [location, setLocation] = useState(initialItem?.location ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialItem?.emergencyPhone ?? '');
  const [notes, setNotes] = useState(initialItem?.notes ?? '');
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? 'BRL');
  const [attachments, setAttachments] = useState<Attachment[]>(initialItem?.attachments ?? []);
  const [datesKey, setDatesKey] = useState(0);
  const af = useAutofill();

  /**
   * Leitura simulada (ajustes-84): o arquivo entra na lista de anexos e preenche os
   * campos — com os dados do arquivo de exemplo, se for um deles e do tipo escolhido,
   * ou com o preenchimento de exemplo do tipo. Sempre preenche.
   */
  function handleReadFile(file: File) {
    if (!type) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        url: URL.createObjectURL(file),
        mimeType: file.type,
      },
    ]);
    const { fields } = readOtherFile(
      file,
      type,
      destinations.find((d) => d.id === destinationId),
      destinations,
    );
    af.read(() => {
      const keys: string[] = [];
      const set = <T,>(value: T | undefined, setter: (v: T) => void, key: string) => {
        if (value === undefined) return;
        setter(value);
        keys.push(key);
      };
      set(fields.title, setTitle, 'title');
      set(fields.provider, setProvider, 'provider');
      set(fields.referenceCode, setReferenceCode, 'reference');
      set(fields.time, setTime, 'time');
      set(fields.location, setLocation, 'location');
      set(fields.emergencyPhone, setEmergencyPhone, 'emergency-phone');
      set(fields.costAmount, setCostAmount, 'cost-amount');
      set(fields.costCurrencyCode, setCostCurrencyCode, 'cost-currency');
      if (fields.startDate !== undefined) {
        setStartDate(fields.startDate);
        setEndDate(fields.endDate ?? null);
        setDatesKey((k) => k + 1);
      }
      if (fields.scope === 'viagem') setDestinationId(null);
      else if (fields.scope) {
        const scope = fields.scope;
        const match = destinations.find((d) => d.cityId === scope.cityId);
        if (match) setDestinationId(match.id);
      }
      return keys;
    });
  }

  const scopeOptions = [
    { value: 'viagem', label: 'Viagem toda' },
    ...destinations.map((d) => ({ value: d.id, label: d.city })),
  ];

  /**
   * Auto-preenche "Vale para" e as datas só na primeira escolha de tipo de
   * um registro NOVO (initialItem null) — depois disso a pessoa tem
   * controle total, nunca mais mexe sozinho (mesmo em troca de tipo
   * seguinte ou ao editar um item já salvo).
   */
  function handleTypeChange(newType: OtherItemType) {
    const isFirstChoice = type === null && !initialItem;
    setType(newType);
    if (!isFirstChoice) return;

    let effectiveDestinationId = destinationId;
    if ((newType === 'passeio' || newType === 'ingresso') && destinations.length === 1) {
      effectiveDestinationId = destinations[0].id;
      setDestinationId(effectiveDestinationId);
    }

    if (newType === 'seguro') {
      if (effectiveDestinationId) {
        const d = destinations.find((x) => x.id === effectiveDestinationId);
        setStartDate(d?.dateStart ?? null);
        setEndDate(d?.dateEnd ?? null);
      } else if (destinations.length > 0) {
        setStartDate(destinations[0].dateStart);
        setEndDate(destinations[destinations.length - 1].dateEnd);
      }
    }
  }

  function handleSave() {
    if (!type) return;
    const id = initialItem?.id ?? `other-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onSave({
      id,
      type,
      destinationId,
      title,
      provider,
      referenceCode,
      startDate,
      endDate,
      time,
      location,
      emergencyPhone,
      notes,
      costAmount,
      costCurrencyCode,
      attachments,
    });
  }

  const cfg = type ? FIELD_CONFIG[type] : null;

  return (
    <div className={styles.form}>
      <OptionChipGroup legend="O que é esse registro?" options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />

      {type === 'seguro' && (
        <p className={styles.hint}>
          Tem seguro anual ou do cartão de crédito? Guarde em{' '}
          <button type="button" className={styles.inlineLink} onClick={() => navigate('/documentos')}>
            Meus documentos
          </button>
          , assim ele vale pra todas as suas viagens.
        </p>
      )}

      {type && (
        <VoucherUpload
          fileName={null}
          reading={af.reading}
          filled={af.filled}
          onFileSelected={handleReadFile}
          hint="Tem o ingresso, o voucher ou a apólice? Envie pra preencher os campos."
          buttonLabel="Enviar arquivo"
        />
      )}

      {/* campos desabilitados enquanto "lê" o arquivo (ajustes-84); display: contents mantém o gap do formulário */}
      <fieldset disabled={af.reading} className="contents">
      {type && cfg && (
        <>
          <OptionChipGroup
            legend="Vale para"
            options={scopeOptions}
            value={destinationId ?? 'viagem'}
            onChange={(v) => setDestinationId(v === 'viagem' ? null : v)}
          />

          {cfg.providerLabel && (
            <TextField
              id={`${baseId}-provider`}
              highlight={af.hl('provider')}
              label={cfg.providerLabel}
              value={provider}
              onChange={setProvider}
              autoComplete="off"
            />
          )}

          <TextField
            id={`${baseId}-title`}
            highlight={af.hl('title')}
            label={cfg.titleLabel}
            placeholder={cfg.titlePlaceholder}
            value={title}
            onChange={setTitle}
            autoComplete="off"
          />

          <DateRangeField
            key={`${type ?? 'none'}-${datesKey}`}
            label={cfg.dateLabel}
            required={false}
            startISO={startDate}
            endISO={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {cfg.showTime && (
            <TextField
              id={`${baseId}-time`}
              highlight={af.hl('time')}
              label={cfg.timeLabel as string}
              placeholder={cfg.timePlaceholder}
              inputMode="numeric"
              value={time}
              onChange={(v) => setTime(maskTime(v))}
              autoComplete="off"
            />
          )}

          {cfg.showLocation && (
            <TextField
              id={`${baseId}-location`}
              highlight={af.hl('location')}
              label={cfg.locationLabel as string}
              value={location}
              onChange={setLocation}
              autoComplete="off"
            />
          )}

          {cfg.referenceLabel && (
            <TextField
              id={`${baseId}-reference`}
              highlight={af.hl('reference')}
              label={cfg.referenceLabel}
              value={referenceCode}
              onChange={setReferenceCode}
              autoComplete="off"
            />
          )}

          {cfg.showEmergencyPhone && (
            <TextField
              id={`${baseId}-emergency-phone`}
              highlight={af.hl('emergency-phone')}
              label="Telefone da central 24h"
              placeholder="Ex.: +55 11 0000-0000"
              inputMode="tel"
              value={emergencyPhone}
              onChange={setEmergencyPhone}
              autoComplete="off"
            />
          )}

          <TextField
            id={`${baseId}-notes`}
            highlight={af.hl('notes')}
            label="Observações (opcional)"
            placeholder={cfg.notesPlaceholder}
            value={notes}
            onChange={setNotes}
            autoComplete="off"
          />

          <div className={styles.costRow}>
            <TextField
              id={`${baseId}-cost-amount`}
              highlight={af.hl('cost-amount')}
              label="Custo (opcional)"
              placeholder="Ex.: 450"
              value={costAmount}
              onChange={setCostAmount}
              autoComplete="off"
            />
            <CurrencySelect
              id={`${baseId}-cost-currency`}
              label="Moeda do custo"
              value={costCurrencyCode}
              onChange={setCostCurrencyCode}
            />
          </div>
        </>
      )}

      {/* o arquivo enviado lá em cima também aparece aqui; dá pra anexar mais sem ler de novo */}
      <AttachmentList attachments={attachments} onChange={setAttachments} />
      </fieldset>

      <div className={styles.actions}>
        <Button fullWidth disabled={!type} onClick={handleSave}>
          Salvar registro
        </Button>
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${formStyles.removeOnly}`}
              onClick={onRemove}
            >
              Remover registro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
