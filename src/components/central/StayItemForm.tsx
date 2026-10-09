import { useId, useState } from 'react';
import { OptionChipGroup, type ChipOption } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { DateRangeField } from '../inputs/DateRangeField';
import { VoucherUpload } from './VoucherUpload';
import { HotelSearchField } from './HotelSearchField';
import { HotelInfo } from './HotelInfo';
import { readStayFile } from '../../data/mockVouchers';
import { useAutofill } from '../../hooks/useAutofill';
import { stayTypeIcon, stayTypeLabel } from '../../utils/staySummary';
import { maskTime } from '../../utils/dateMask';
import { getHotel, type HotelEntry } from '../../data';
import type { StayItem, StayType, TripDestination } from '../../context/TripContext';
import styles from './TransportItemForm.module.css';
import formStyles from './StayItemForm.module.css';

interface StayItemFormProps {
  destination: TripDestination;
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: StayItem | null;
  onSave: (item: StayItem) => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}

const TYPE_OPTIONS: ChipOption<StayType>[] = [
  { value: 'hotel', label: stayTypeLabel('hotel'), icon: stayTypeIcon('hotel') },
  { value: 'apartamento', label: stayTypeLabel('apartamento'), icon: stayTypeIcon('apartamento') },
  { value: 'hostel', label: stayTypeLabel('hostel'), icon: stayTypeIcon('hostel') },
  { value: 'pousada', label: stayTypeLabel('pousada'), icon: stayTypeIcon('pousada') },
];

export function StayItemForm({ destination, initialItem, onSave, onRemove }: StayItemFormProps) {
  const baseId = useId();

  const [type, setType] = useState<StayType>(initialItem?.type ?? 'hotel');
  const [hotelId, setHotelId] = useState<string | null>(initialItem?.hotelId ?? null);
  const [name, setName] = useState(initialItem?.name ?? '');
  const [address, setAddress] = useState(initialItem?.address ?? '');
  const [locality, setLocality] = useState(initialItem?.locality ?? destination.city);
  const [checkInDate, setCheckInDate] = useState(initialItem?.checkInDate ?? destination.dateStart);
  const [checkOutDate, setCheckOutDate] = useState(initialItem?.checkOutDate ?? destination.dateEnd);
  const [checkInTime, setCheckInTime] = useState(initialItem?.checkInTime ?? '');
  const [checkOutTime, setCheckOutTime] = useState(initialItem?.checkOutTime ?? '');
  const [datesKey, setDatesKey] = useState(0);
  const [confirmationCode, setConfirmationCode] = useState(initialItem?.confirmationCode ?? '');
  const [roomType, setRoomType] = useState(initialItem?.roomType ?? '');
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? 'BRL');
  const [voucherFileName, setVoucherFileName] = useState<string | null>(initialItem?.voucherFileName ?? null);
  const af = useAutofill();

  const selectedHotel = getHotel(hotelId);

  function handleNameChange(value: string) {
    setName(value);
    setHotelId(null);
  }

  function handleSelectHotel(hotel: HotelEntry) {
    setHotelId(hotel.id);
    setName(hotel.name);
    setType(hotel.type);
    setAddress(`${hotel.address}, ${hotel.neighborhood}`);
    setLocality(hotel.locality);
  }

  /** leitura simulada (ajustes-84): arquivo de exemplo conhecido ou o hotel de exemplo do destino — sempre preenche */
  function handleVoucherFile(file: File) {
    setVoucherFileName(file.name);
    const { fields: match } = readStayFile(file, destination);
    af.read(() => {
      applyVoucher(match);
      return ['hotel-name', 'address', 'locality', 'checkin-time', 'checkout-time', 'confirmation', 'room-type'].filter(
        (key) => key !== 'address' || match.address !== '',
      );
    });
  }

  function applyVoucher(match: ReturnType<typeof readStayFile>['fields']) {
    setType(match.type);
    setHotelId(match.hotelId);
    setName(match.name);
    setAddress(match.address);
    setLocality(match.locality);
    setCheckInDate(match.checkInDate);
    setCheckOutDate(match.checkOutDate);
    setCheckInTime(match.checkInTime);
    setCheckOutTime(match.checkOutTime);
    setConfirmationCode(match.confirmationCode);
    setRoomType(match.roomType);
    setDatesKey((k) => k + 1);
  }

  function handleRemoveVoucher() {
    setVoucherFileName(null);
    af.reset();
  }

  function handleSave() {
    const id = initialItem?.id ?? `stay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    onSave({
      id,
      destinationId: destination.id,
      type,
      hotelId,
      name,
      address,
      locality,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      confirmationCode,
      roomType,
      costAmount,
      costCurrencyCode,
      voucherFileName,
    });
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

      {/* campos desabilitados enquanto "lê" o arquivo (ajustes-84); display: contents mantém o gap do formulário */}
      <fieldset disabled={af.reading} className="contents">

      <OptionChipGroup legend="Tipo de hospedagem" options={TYPE_OPTIONS} value={type} onChange={setType} />

      <HotelSearchField
        id={`${baseId}-hotel-name`}
        cityId={destination.cityId}
        cityName={destination.city}
        value={name}
        onChange={handleNameChange}
        onSelectHotel={handleSelectHotel}
      />

      {selectedHotel && (
        <div className={formStyles.hotelPreview}>
          <HotelInfo hotel={selectedHotel} variant="preview" />
        </div>
      )}

      <TextField id={`${baseId}-address`} highlight={af.hl('address')} label="Endereço" value={address} onChange={setAddress} autoComplete="off" />

      <TextField
        id={`${baseId}-locality`}
        highlight={af.hl('locality')}
        label="Cidade / local"
        placeholder="Ex.: Viña del Mar"
        value={locality}
        onChange={setLocality}
        autoComplete="off"
      />

      <DateRangeField
        key={datesKey}
        label="Check-in e check-out"
        required={false}
        startISO={checkInDate}
        endISO={checkOutDate}
        onChange={(start, end) => {
          setCheckInDate(start);
          setCheckOutDate(end);
        }}
      />

      <div className={formStyles.timeRow}>
        <TextField
          id={`${baseId}-checkin-time`}
          highlight={af.hl('checkin-time')}
          label="Horário do check-in"
          placeholder="Ex.: 15:00"
          inputMode="numeric"
          value={checkInTime}
          onChange={(v) => setCheckInTime(maskTime(v))}
          autoComplete="off"
        />
        <TextField
          id={`${baseId}-checkout-time`}
          highlight={af.hl('checkout-time')}
          label="Horário do check-out"
          placeholder="Ex.: 11:00"
          inputMode="numeric"
          value={checkOutTime}
          onChange={(v) => setCheckOutTime(maskTime(v))}
          autoComplete="off"
        />
      </div>

      <TextField
        id={`${baseId}-confirmation`}
        highlight={af.hl('confirmation')}
        label="Código da reserva (opcional)"
        value={confirmationCode}
        onChange={setConfirmationCode}
        autoComplete="off"
      />

      <TextField
        id={`${baseId}-room-type`}
        highlight={af.hl('room-type')}
        label="Tipo de quarto (opcional)"
        placeholder="Ex.: Duplo, Suíte"
        value={roomType}
        onChange={setRoomType}
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

      </fieldset>

      <div className={styles.actions}>
        <Button fullWidth onClick={handleSave}>
          Salvar hospedagem
        </Button>
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${formStyles.removeOnly}`}
              onClick={onRemove}
            >
              Remover hospedagem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
