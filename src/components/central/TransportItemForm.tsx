import { useId, useState } from 'react';
import { OptionChipGroup, type ChipOption } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { VoucherUpload } from './VoucherUpload';
import { lookupMockTransportVoucher } from '../../data/mockVouchers';
import { transportTypeIcon } from '../../utils/transportSummary';
import type { TransportItem, TransportType } from '../../context/TripContext';
import styles from './TransportItemForm.module.css';

interface TransportItemFormProps {
  destinationId: string;
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: TransportItem | null;
  onSave: (item: TransportItem) => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: ChipOption<TransportType>[] = [
  { value: 'voo', label: 'Voo', icon: transportTypeIcon('voo') },
  { value: 'onibus', label: 'Ônibus', icon: transportTypeIcon('onibus') },
  { value: 'trem', label: 'Trem', icon: transportTypeIcon('trem') },
  { value: 'carro-locado', label: 'Carro locado', icon: transportTypeIcon('carro-locado') },
];

const DATETIME_PLACEHOLDER = 'dd/mm/aaaa hh:mm';

export function TransportItemForm({
  destinationId,
  initialItem,
  onSave,
  onRemove,
}: TransportItemFormProps) {
  const baseId = useId();

  const routeItem =
    initialItem && (initialItem.type === 'voo' || initialItem.type === 'onibus' || initialItem.type === 'trem')
      ? initialItem
      : null;
  const train = initialItem && initialItem.type === 'trem' ? initialItem : null;
  const carRental = initialItem && initialItem.type === 'carro-locado' ? initialItem : null;

  const [type, setType] = useState<TransportType | null>(initialItem?.type ?? 'voo');
  const [company, setCompany] = useState(initialItem?.company ?? '');
  const [flightNumber, setFlightNumber] = useState(initialItem?.type === 'voo' ? initialItem.flightNumber : '');
  const [origin, setOrigin] = useState(routeItem?.origin ?? '');
  const [destination, setDestination] = useState(routeItem?.destination ?? '');
  const [departureAt, setDepartureAt] = useState(routeItem?.departureAt ?? '');
  const [arrivalAt, setArrivalAt] = useState(routeItem?.arrivalAt ?? '');
  const [trainNumber, setTrainNumber] = useState(train?.trainNumber ?? '');
  const [travelClass, setTravelClass] = useState(train?.travelClass ?? '');
  const [seat, setSeat] = useState(train?.seat ?? '');
  const [bookingCode, setBookingCode] = useState(train?.bookingCode ?? '');
  const [vehicleCategory, setVehicleCategory] = useState(carRental?.vehicleCategory ?? '');
  const [pickupLocation, setPickupLocation] = useState(carRental?.pickupLocation ?? '');
  const [pickupAt, setPickupAt] = useState(carRental?.pickupAt ?? '');
  const [dropoffLocation, setDropoffLocation] = useState(carRental?.dropoffLocation ?? '');
  const [dropoffAt, setDropoffAt] = useState(carRental?.dropoffAt ?? '');
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? 'BRL');
  const [voucherFileName, setVoucherFileName] = useState<string | null>(initialItem?.voucherFileName ?? null);
  const [voucherRecognized, setVoucherRecognized] = useState<boolean | null>(null);

  function handleVoucherFile(file: File) {
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
    } else if (match.type === 'trem') {
      setTrainNumber(match.trainNumber);
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
      setTravelClass(match.travelClass);
      setSeat(match.seat);
      setBookingCode(match.bookingCode);
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
    } else if (type === 'trem') {
      onSave({
        ...base,
        type,
        company,
        trainNumber,
        origin,
        destination,
        departureAt,
        arrivalAt,
        travelClass,
        seat,
        bookingCode,
      });
    } else {
      onSave({ ...base, type, company, vehicleCategory, pickupLocation, pickupAt, dropoffLocation, dropoffAt });
    }
  }

  return (
    <div className={styles.form}>
      <VoucherUpload
        fileName={voucherFileName}
        recognized={voucherRecognized}
        onFileSelected={handleVoucherFile}
        onRemove={handleRemoveVoucher}
      />

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

      {type === 'trem' && (
        <>
          <TextField
            id={`${baseId}-company`}
            label="Operadora"
            placeholder="Ex.: Tren de la Costa"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-train-number`}
            label="Número do trem ou linha"
            value={trainNumber}
            onChange={setTrainNumber}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-origin`}
            label="Estação de embarque"
            value={origin}
            onChange={setOrigin}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-destination`}
            label="Estação de desembarque"
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
          <TextField
            id={`${baseId}-travel-class`}
            label="Classe (opcional)"
            placeholder="Ex.: Turista"
            value={travelClass}
            onChange={setTravelClass}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-seat`}
            label="Vagão e assento (opcional)"
            placeholder="Ex.: Vagão 2, assento 14"
            value={seat}
            onChange={setSeat}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-booking-code`}
            label="Código da reserva (opcional)"
            value={bookingCode}
            onChange={setBookingCode}
            autoComplete="off"
            autoCapitalize="characters"
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
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${styles.removeOnly}`}
              onClick={onRemove}
            >
              Remover transporte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
