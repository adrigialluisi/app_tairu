import { useId, useState } from 'react';
import { OptionChipGroup, type ChipOption } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { AirportField } from '../inputs/AirportField';
import { DateField, type TripDateRange } from '../inputs/DateField';
import { TimeField } from '../inputs/TimeField';
import { VoucherUpload } from './VoucherUpload';
import { readTransportFile, type MockVoucherFields } from '../../data/mockVouchers';
import { useTrip } from '../../context/TripContext';
import { useAutofill } from '../../hooks/useAutofill';
import { transportTypeIcon } from '../../utils/transportSummary';
import { joinDisplayDateTime, splitDisplayDateTime } from '../../utils/dateMask';
import { getTripEndISO, getTripStartISO } from '../../utils/itinerary';
import type { TransportItem, TransportType } from '../../context/TripContext';
import styles from './TransportItemForm.module.css';

interface TransportItemFormProps {
  destinationId: string;
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: TransportItem | null;
  onSave: (item: TransportItem) => void;
  /** fecha sem salvar (ajustes-86, substitui a decisão do ajuste 56): item novo não é criado; edição volta ao cartão */
  onCancel: () => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: ChipOption<TransportType>[] = [
  { value: 'voo', label: 'Voo', icon: transportTypeIcon('voo') },
  { value: 'onibus', label: 'Ônibus', icon: transportTypeIcon('onibus') },
  { value: 'trem', label: 'Trem', icon: transportTypeIcon('trem') },
  { value: 'carro-locado', label: 'Carro locado', icon: transportTypeIcon('carro-locado') },
];

interface DateTimeRowProps {
  id: string;
  dateLabel: string;
  timeLabel?: string;
  /** "dd/mm/aaaa hh:mm" — o formato guardado (a Agenda do dia lê assim) */
  value: string;
  onChange: (value: string) => void;
  highlight: boolean;
  tripRange: TripDateRange;
}

/**
 * Data + hora lado a lado (ajustes-86, "Campos de data e hora" no CLAUDE.md): o "Data/hora" em texto
 * livre virou DateField + TimeField. O dado continua junto, "22/11/2026 14:00".
 */
function DateTimeRow({ id, dateLabel, timeLabel = 'Hora', value, onChange, highlight, tripRange }: DateTimeRowProps) {
  const { dateISO, time } = splitDisplayDateTime(value);
  return (
    <div className={styles.dateTimeRow}>
      <DateField
        id={`${id}-date`}
        label={dateLabel}
        valueISO={dateISO}
        onChange={(iso) => onChange(joinDisplayDateTime(iso, time))}
        tripRange={tripRange}
        highlight={highlight}
      />
      <TimeField
        id={`${id}-time`}
        label={timeLabel}
        value={time}
        onChange={(t) => onChange(joinDisplayDateTime(dateISO, t))}
        highlight={highlight}
      />
    </div>
  );
}

export function TransportItemForm({
  destinationId,
  initialItem,
  onSave,
  onCancel,
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
  const flight = initialItem && initialItem.type === 'voo' ? initialItem : null;
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber ?? '');
  const [locator, setLocator] = useState(flight?.locator ?? '');
  const [flightClass, setFlightClass] = useState(flight?.travelClass ?? '');
  const [baggage, setBaggage] = useState(flight?.baggage ?? '');
  const [origin, setOrigin] = useState(routeItem?.origin ?? '');
  const [destination, setDestination] = useState(routeItem?.destination ?? '');
  const [departureAt, setDepartureAt] = useState(routeItem?.departureAt ?? '');
  const [arrivalAt, setArrivalAt] = useState(routeItem?.arrivalAt ?? '');

  /** a data de chegada já vem com a da partida — a pessoa só muda se virar o dia (ajustes-86) */
  function handleDepartureChange(next: string) {
    setDepartureAt(next);
    const dep = splitDisplayDateTime(next);
    const arr = splitDisplayDateTime(arrivalAt);
    if (dep.dateISO && !arr.dateISO) setArrivalAt(joinDisplayDateTime(dep.dateISO, arr.time));
  }
  const [trainNumber, setTrainNumber] = useState(train?.trainNumber ?? '');
  const [travelClass, setTravelClass] = useState(train?.travelClass ?? '');
  const [seat, setSeat] = useState(train?.seat ?? '');
  const [bookingCode, setBookingCode] = useState(train?.bookingCode ?? '');
  const [vehicleCategory, setVehicleCategory] = useState(carRental?.vehicleCategory ?? '');
  const [pickupLocation, setPickupLocation] = useState(carRental?.pickupLocation ?? '');
  const [pickupAt, setPickupAt] = useState(carRental?.pickupAt ?? '');
  const [dropoffLocation, setDropoffLocation] = useState(carRental?.dropoffLocation ?? '');
  const [dropoffAt, setDropoffAt] = useState(carRental?.dropoffAt ?? '');
  const trip = useTrip();
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  // padrão = moeda do destino do item (ajustes-98: a moeda saiu de Destinos e aparece só aqui), editável
  const [costCurrencyCode, setCostCurrencyCode] = useState(
    initialItem?.costCurrencyCode ?? trip.destinations.find((d) => d.id === destinationId)?.currencyCode ?? 'BRL',
  );
  const [voucherFileName, setVoucherFileName] = useState<string | null>(initialItem?.voucherFileName ?? null);
  const af = useAutofill();
  const tripRange = { startISO: getTripStartISO(trip.destinations), endISO: getTripEndISO(trip.destinations) };
  const destinationEntry = trip.destinations.find((d) => d.id === destinationId);

  // voucher com conexão (ajustes-92): os trechos depois do 1º entram como voos separados ao salvar
  const [extraLegs, setExtraLegs] = useState<MockVoucherFields[]>([]);

  /** leitura simulada (ajustes-84): arquivo de exemplo conhecido ou o voucher de exemplo do destino — sempre preenche */
  function handleVoucherFile(file: File) {
    setVoucherFileName(file.name);
    const { fields, extraLegs: legs } = readTransportFile(
      file,
      trip.destinations.find((d) => d.id === destinationId),
    );
    af.read(() => {
      // editando um item que já existe, o voucher só reescreve esse item
      setExtraLegs(initialItem ? [] : (legs ?? []));
      return applyVoucher(fields);
    });
  }

  /** preenche os campos e devolve as chaves (sufixo do id) que mudaram, pro destaque */
  function applyVoucher(match: ReturnType<typeof readTransportFile>['fields']): string[] {
    setType(match.type);
    setCompany(match.company);
    if (match.type === 'voo') {
      setFlightNumber(match.flightNumber);
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
      setLocator(match.locator);
      setFlightClass(match.travelClass);
      setBaggage(match.baggage);
      return ['company', 'flight-number', 'origin', 'destination', 'departure', 'arrival', 'locator', 'flight-class', 'baggage'];
    } else if (match.type === 'onibus') {
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
      return ['company', 'origin', 'destination', 'departure', 'arrival'];
    } else if (match.type === 'trem') {
      setTrainNumber(match.trainNumber);
      setOrigin(match.origin);
      setDestination(match.destination);
      setDepartureAt(match.departureAt);
      setArrivalAt(match.arrivalAt);
      setTravelClass(match.travelClass);
      setSeat(match.seat);
      setBookingCode(match.bookingCode);
      return ['company', 'train-number', 'origin', 'destination', 'departure', 'arrival', 'travel-class', 'seat', 'booking-code'];
    } else {
      setVehicleCategory(match.vehicleCategory);
      setPickupLocation(match.pickupLocation);
      setPickupAt(match.pickupAt);
      setDropoffLocation(match.dropoffLocation);
      setDropoffAt(match.dropoffAt);
      return ['company', 'vehicle-category', 'pickup-location', 'pickup-at', 'dropoff-location', 'dropoff-at'];
    }
  }

  function handleRemoveVoucher() {
    setVoucherFileName(null);
    setExtraLegs([]);
    af.reset();
  }

  /** os outros trechos do voucher, cada um como um voo da Central no mesmo destino */
  function saveExtraLegs() {
    for (const leg of extraLegs) {
      trip.saveTransportItem({
        ...leg,
        id: `${leg.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        destinationId,
        costAmount: '',
        costCurrencyCode,
        voucherFileName,
      });
    }
  }

  function handleSave() {
    if (!type) return;
    const id = initialItem?.id ?? `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const base = { id, destinationId, costAmount, costCurrencyCode, voucherFileName };

    if (type === 'voo') {
      onSave({
        ...base,
        type,
        company,
        flightNumber,
        origin,
        destination,
        departureAt,
        arrivalAt,
        locator,
        travelClass: flightClass,
        baggage,
      });
      // depois do 1º trecho, pra os voos ficarem na ordem do voucher
      saveExtraLegs();
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
        reading={af.reading}
        filled={af.filled}
        onFileSelected={handleVoucherFile}
        onRemove={handleRemoveVoucher}
      />
      {extraLegs.length > 0 && !af.reading && (
        <p className="m-0 text-(length:--text-sm) text-foreground" role="status">
          {extraLegs.length === 1 ? 'Esse voucher tem mais 1 voo' : `Esse voucher tem mais ${extraLegs.length} voos`}
          {extraLegs.map((leg) =>
            leg.type === 'voo'
              ? ` (${leg.flightNumber} · ${leg.departureAt.slice(0, 5)} ${leg.departureAt.slice(11)})`
              : '',
          )}
          . Ele entra como outro voo quando você salvar.
        </p>
      )}

      {/* campos desabilitados enquanto "lê" o arquivo (ajustes-84); display: contents mantém o gap do formulário */}
      <fieldset disabled={af.reading} className="contents">

      <OptionChipGroup legend="Tipo de transporte" options={TYPE_OPTIONS} value={type} onChange={setType} />

      {type === 'voo' && (
        <>
          <TextField
            id={`${baseId}-company`}
            highlight={af.hl('company')}
            label="Companhia aérea"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-flight-number`}
            highlight={af.hl('flight-number')}
            label="Número do voo"
            value={flightNumber}
            onChange={setFlightNumber}
            autoComplete="off"
          />
          {/* aeroporto da base (ajustes-86); sem digitar, sugere os da cidade deste destino */}
          <AirportField
            id={`${baseId}-origin`}
            highlight={af.hl('origin')}
            label="Origem"
            value={origin}
            onChange={setOrigin}
            suggestCityId={destinationEntry?.cityId}
            suggestCityName={destinationEntry?.city}
          />
          <AirportField
            id={`${baseId}-destination`}
            highlight={af.hl('destination')}
            label="Destino"
            value={destination}
            onChange={setDestination}
            suggestCityId={destinationEntry?.cityId}
            suggestCityName={destinationEntry?.city}
          />
          <DateTimeRow
            id={`${baseId}-departure`}
            dateLabel="Data de partida"
            value={departureAt}
            onChange={handleDepartureChange}
            highlight={af.hl('departure')}
            tripRange={tripRange}
          />
          <DateTimeRow
            id={`${baseId}-arrival`}
            dateLabel="Data de chegada"
            value={arrivalAt}
            onChange={setArrivalAt}
            highlight={af.hl('arrival')}
            tripRange={tripRange}
          />
          <TextField
            id={`${baseId}-locator`}
            highlight={af.hl('locator')}
            label="Localizador (opcional)"
            placeholder="Ex.: EEPMS7"
            value={locator}
            onChange={(v) => setLocator(v.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <TextField
            id={`${baseId}-flight-class`}
            highlight={af.hl('flight-class')}
            label="Classe (opcional)"
            placeholder="Ex.: Econômica"
            value={flightClass}
            onChange={setFlightClass}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-baggage`}
            highlight={af.hl('baggage')}
            label="Bagagem (opcional)"
            placeholder="Ex.: 1 despachada + 1 de mão"
            value={baggage}
            onChange={setBaggage}
            autoComplete="off"
          />
        </>
      )}

      {type === 'onibus' && (
        <>
          <TextField
            id={`${baseId}-company`}
            highlight={af.hl('company')}
            label="Empresa"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField id={`${baseId}-origin`} highlight={af.hl('origin')} label="Origem" value={origin} onChange={setOrigin} autoComplete="off" />
          <TextField
            id={`${baseId}-destination`}
            highlight={af.hl('destination')}
            label="Destino"
            value={destination}
            onChange={setDestination}
            autoComplete="off"
          />
          <DateTimeRow
            id={`${baseId}-departure`}
            dateLabel="Data de saída"
            value={departureAt}
            onChange={handleDepartureChange}
            highlight={af.hl('departure')}
            tripRange={tripRange}
          />
          <DateTimeRow
            id={`${baseId}-arrival`}
            dateLabel="Data de chegada"
            value={arrivalAt}
            onChange={setArrivalAt}
            highlight={af.hl('arrival')}
            tripRange={tripRange}
          />
        </>
      )}

      {type === 'trem' && (
        <>
          <TextField
            id={`${baseId}-company`}
            highlight={af.hl('company')}
            label="Operadora"
            placeholder="Ex.: Tren de la Costa"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-train-number`}
            highlight={af.hl('train-number')}
            label="Número do trem ou linha"
            value={trainNumber}
            onChange={setTrainNumber}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-origin`}
            highlight={af.hl('origin')}
            label="Estação de embarque"
            value={origin}
            onChange={setOrigin}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-destination`}
            highlight={af.hl('destination')}
            label="Estação de desembarque"
            value={destination}
            onChange={setDestination}
            autoComplete="off"
          />
          <DateTimeRow
            id={`${baseId}-departure`}
            dateLabel="Data de partida"
            value={departureAt}
            onChange={handleDepartureChange}
            highlight={af.hl('departure')}
            tripRange={tripRange}
          />
          <DateTimeRow
            id={`${baseId}-arrival`}
            dateLabel="Data de chegada"
            value={arrivalAt}
            onChange={setArrivalAt}
            highlight={af.hl('arrival')}
            tripRange={tripRange}
          />
          <TextField
            id={`${baseId}-travel-class`}
            highlight={af.hl('travel-class')}
            label="Classe (opcional)"
            placeholder="Ex.: Turista"
            value={travelClass}
            onChange={setTravelClass}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-seat`}
            highlight={af.hl('seat')}
            label="Vagão e assento (opcional)"
            placeholder="Ex.: Vagão 2, assento 14"
            value={seat}
            onChange={setSeat}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-booking-code`}
            highlight={af.hl('booking-code')}
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
            highlight={af.hl('company')}
            label="Locadora"
            value={company}
            onChange={setCompany}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-vehicle-category`}
            highlight={af.hl('vehicle-category')}
            label="Categoria do veículo"
            placeholder="Ex.: Econômico, SUV"
            value={vehicleCategory}
            onChange={setVehicleCategory}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-pickup-location`}
            highlight={af.hl('pickup-location')}
            label="Local de retirada"
            value={pickupLocation}
            onChange={setPickupLocation}
            autoComplete="off"
          />
          <DateTimeRow
            id={`${baseId}-pickup-at`}
            dateLabel="Data de retirada"
            value={pickupAt}
            onChange={setPickupAt}
            highlight={af.hl('pickup-at')}
            tripRange={tripRange}
          />
          <TextField
            id={`${baseId}-dropoff-location`}
            highlight={af.hl('dropoff-location')}
            label="Local de devolução"
            value={dropoffLocation}
            onChange={setDropoffLocation}
            autoComplete="off"
          />
          <DateTimeRow
            id={`${baseId}-dropoff-at`}
            dateLabel="Data de devolução"
            value={dropoffAt}
            onChange={setDropoffAt}
            highlight={af.hl('dropoff-at')}
            tripRange={tripRange}
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

      </fieldset>

      <div className={styles.actions}>
        <Button fullWidth disabled={!type} onClick={handleSave}>
          Salvar transporte
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
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
