import { useId, useRef, useState, type ChangeEvent } from 'react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { UploadIcon, ReplaceIcon, TrashIcon } from '../shell/Icons';
import { lookupMockTransportVoucher } from '../../data/mockVouchers';
import { transportTypeIcon } from '../../utils/transportSummary';
import type { TransportItem, TransportType } from '../../context/TripContext';
import styles from './TransportItemForm.module.css';

interface TransportItemFormProps {
  destinationId: string;
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: TransportItem | null;
  onSave: (item: TransportItem) => void;
  onCancel: () => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'voo', label: `${transportTypeIcon('voo')} Voo` },
  { value: 'onibus', label: `${transportTypeIcon('onibus')} Ônibus` },
  { value: 'carro-locado', label: `${transportTypeIcon('carro-locado')} Carro locado` },
];

const DATETIME_PLACEHOLDER = 'dd/mm/aaaa hh:mm';

export function TransportItemForm({
  destinationId,
  initialItem,
  onSave,
  onCancel,
  onRemove,
}: TransportItemFormProps) {
  const baseId = useId();

  const flightOrBus =
    initialItem && (initialItem.type === 'voo' || initialItem.type === 'onibus') ? initialItem : null;
  const carRental = initialItem && initialItem.type === 'carro-locado' ? initialItem : null;

  const [type, setType] = useState<TransportType | null>(initialItem?.type ?? 'voo');
  const [company, setCompany] = useState(initialItem?.company ?? '');
  const [flightNumber, setFlightNumber] = useState(initialItem?.type === 'voo' ? initialItem.flightNumber : '');
  const [origin, setOrigin] = useState(flightOrBus?.origin ?? '');
  const [destination, setDestination] = useState(flightOrBus?.destination ?? '');
  const [departureAt, setDepartureAt] = useState(flightOrBus?.departureAt ?? '');
  const [arrivalAt, setArrivalAt] = useState(flightOrBus?.arrivalAt ?? '');
  const [vehicleCategory, setVehicleCategory] = useState(carRental?.vehicleCategory ?? '');
  const [pickupLocation, setPickupLocation] = useState(carRental?.pickupLocation ?? '');
  const [pickupAt, setPickupAt] = useState(carRental?.pickupAt ?? '');
  const [dropoffLocation, setDropoffLocation] = useState(carRental?.dropoffLocation ?? '');
  const [dropoffAt, setDropoffAt] = useState(carRental?.dropoffAt ?? '');
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? 'BRL');
  const [voucherFileName, setVoucherFileName] = useState<string | null>(initialItem?.voucherFileName ?? null);
  const [voucherRecognized, setVoucherRecognized] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleVoucherFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const match = lookupMockTransportVoucher(file.name);
    setVoucherFileName(file.name);

    if (!match) {
      setVoucherRecognized(false);
      return;
    }

    setVoucherRecognized(true);
    setType(match.type);
    setCompany(match.company);
    if (match.type === 'voo') {
      setFlightNumber(match.flightNumber);
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
    } else if (match.type === 'onibus') {
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
    } else {
      setVehicleCategory(match.vehicleCategory);
      setPickupLocation(match.pickupLocation);
      setPickupAt(match.pickupAt);
      setDropoffLocation(match.dropoffLocation);
      setDropoffAt(match.dropoffAt);
    }
  }

  function handleRemoveVoucher() {
    setVoucherFileName(null);
    setVoucherRecognized(null);
  }

  function handleSave() {
    if (!type) return;
    const id = initialItem?.id ?? `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const base = { id, destinationId, costAmount, costCurrencyCode, voucherFileName };

    if (type === 'voo') {
      onSave({ ...base, type, company, flightNumber, origin, destination, departureAt, arrivalAt });
    } else if (type === 'onibus') {
      onSave({ ...base, type, company, origin, destination, departureAt, arrivalAt });
    } else {
      onSave({ ...base, type, company, vehicleCategory, pickupLocation, pickupAt, dropoffLocation, dropoffAt });
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.voucherUpload}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          className={styles.hiddenFileInput}
          onChange={handleVoucherFileChange}
        />
        {!voucherFileName && (
          <div className={styles.voucherUploadRow}>
            <span className={styles.voucherHint}>Tem um voucher? Anexe pra preencher os campos automaticamente.</span>
            <button type="button" className={styles.voucherButton} onClick={() => fileInputRef.current?.click()}>
              <UploadIcon />
              Enviar voucher
            </button>
          </div>
        )}

        {voucherFileName && (
          <div className={styles.voucherAttached}>
            <span className={styles.voucherFileIcon} aria-hidden="true">📎</span>
            <span className={styles.voucherFileName} title={voucherFileName}>
              {voucherFileName}
            </span>
            <div className={styles.voucherFileActions}>
              <button
                type="button"
                className={styles.voucherIconButton}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Substituir voucher"
                title="Substituir voucher"
              >
                <ReplaceIcon />
              </button>
              <button
                type="button"
                className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger}`}
                onClick={handleRemoveVoucher}
                aria-label="Excluir voucher"
                title="Excluir voucher"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        )}

        {voucherRecognized === true && (
          <p className={styles.voucherMessageSuccess}>
            <span aria-hidden="true">✓</span> Campos preenchidos automaticamente. Confira antes de salvar.
          </p>
        )}
        {voucherRecognized === false && (
          <p className={styles.voucherMessageMuted}>
            Não reconhecemos esse voucher automaticamente — confira/preencha os campos manualmente abaixo.
          </p>
        )}
      </div>

      <OptionChipGroup legend="Tipo de transporte" options={TYPE_OPTIONS} value={type} onChange={setType} />

      {type === 'voo' && (
        <>
          <TextField
            id={`${baseId}-company`}
            label="Companhia aérea"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-flight-number`}
            label="Número do voo"
            value={flightNumber}
            onChange={setFlightNumber}
            autoComplete="off"
          />
          <TextField id={`${baseId}-origin`} label="Origem" value={origin} onChange={setOrigin} autoComplete="off" />
          <TextField
            id={`${baseId}-destination`}
            label="Destino"
            value={destination}
            onChange={setDestination}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-departure`}
            label="Data/hora de partida"
            placeholder={DATETIME_PLACEHOLDER}
            value={departureAt}
            onChange={setDepartureAt}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-arrival`}
            label="Data/hora de chegada"
            placeholder={DATETIME_PLACEHOLDER}
            value={arrivalAt}
            onChange={setArrivalAt}
            autoComplete="off"
          />
        </>
      )}

      {type === 'onibus' && (
        <>
          <TextField
            id={`${baseId}-company`}
            label="Empresa"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField id={`${baseId}-origin`} label="Origem" value={origin} onChange={setOrigin} autoComplete="off" />
          <TextField
            id={`${baseId}-destination`}
            label="Destino"
            value={destination}
            onChange={setDestination}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-departure`}
            label="Data/hora de saída"
            placeholder={DATETIME_PLACEHOLDER}
            value={departureAt}
            onChange={setDepartureAt}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-arrival`}
            label="Data/hora de chegada"
            placeholder={DATETIME_PLACEHOLDER}
            value={arrivalAt}
            onChange={setArrivalAt}
            autoComplete="off"
          />
        </>
      )}

      {type === 'carro-locado' && (
        <>
          <TextField
            id={`${baseId}-company`}
            label="Locadora"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-vehicle-category`}
            label="Categoria do veículo"
            placeholder="Ex.: Econômico, SUV"
            value={vehicleCategory}
            onChange={setVehicleCategory}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-pickup-location`}
            label="Local de retirada"
            value={pickupLocation}
            onChange={setPickupLocation}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-pickup-at`}
            label="Data/hora de retirada"
            placeholder={DATETIME_PLACEHOLDER}
            value={pickupAt}
            onChange={setPickupAt}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-dropoff-location`}
            label="Local de devolução"
            value={dropoffLocation}
            onChange={setDropoffLocation}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-dropoff-at`}
            label="Data/hora de devolução"
            placeholder={DATETIME_PLACEHOLDER}
            value={dropoffAt}
            onChange={setDropoffAt}
            autoComplete="off"
          />
        </>
      )}

      {type && (
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
      )}

      <div className={styles.actions}>
        <Button fullWidth disabled={!type} onClick={handleSave}>
          Salvar transporte
        </Button>
        <div className={styles.secondaryActions}>
          <button type="button" className={styles.textButton} onClick={onCancel}>
            Cancelar
          </button>
          {onRemove && (
            <button type="button" className={`${styles.textButton} ${styles.removeButton}`} onClick={onRemove}>
              Remover transporte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
