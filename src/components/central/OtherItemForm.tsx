import { useId, useState } from 'react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { DateRangeField } from '../inputs/DateRangeField';
import { AttachmentList } from './AttachmentList';
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
  label: `${otherTypeIcon(t)} ${otherTypeLabel(t)}`,
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
  chip: {
    providerLabel: 'Operadora',
    titleLabel: 'Plano (opcional)',
    titlePlaceholder: 'Ex.: eSIM 10 GB',
    dateLabel: 'Validade',
    showTime: false,
    showLocation: false,
    referenceLabel: null,
    showEmergencyPhone: false,
  },
  outro: {
    providerLabel: 'Fornecedor (opcional)',
    titleLabel: 'Título',
    titlePlaceholder: 'Ex.: Reserva de restaurante',
    dateLabel: 'Data ou período',
    showTime: false,
    showLocation: false,
    referenceLabel: 'Código / localizador (opcional)',
    showEmergencyPhone: false,
  },
};

export function OtherItemForm({ destinations, initialItem, onSave, onRemove }: OtherItemFormProps) {
  const baseId = useId();

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

    if (newType === 'seguro' || newType === 'chip') {
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

      <AttachmentList attachments={attachments} onChange={setAttachments} />

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
              label={cfg.providerLabel}
              value={provider}
              onChange={setProvider}
              autoComplete="off"
            />
          )}

          <TextField
            id={`${baseId}-title`}
            label={cfg.titleLabel}
            placeholder={cfg.titlePlaceholder}
            value={title}
            onChange={setTitle}
            autoComplete="off"
          />

          <DateRangeField
            key={type ?? 'none'}
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
              label={cfg.locationLabel as string}
              value={location}
              onChange={setLocation}
              autoComplete="off"
            />
          )}

          {cfg.referenceLabel && (
            <TextField
              id={`${baseId}-reference`}
              label={cfg.referenceLabel}
              value={referenceCode}
              onChange={setReferenceCode}
              autoComplete="off"
            />
          )}

          {cfg.showEmergencyPhone && (
            <TextField
              id={`${baseId}-emergency-phone`}
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
            label="Observações (opcional)"
            placeholder={cfg.notesPlaceholder}
            value={notes}
            onChange={setNotes}
            autoComplete="off"
          />

          <div className={styles.costRow}>
            <TextField
              id={`${baseId}-cost-amount`}
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
