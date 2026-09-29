import { useId, useState } from 'react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { DateRangeField } from '../inputs/DateRangeField';
import { VoucherUpload } from './VoucherUpload';
import { HotelSearchField } from './HotelSearchField';
import { HotelInfo } from './HotelInfo';
import { lookupMockStayVoucher } from '../../data/mockVouchers';
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

const TYPE_OPTIONS: { value: StayType; label: string }[] = [
  { value: 'hotel', label: `${stayTypeIcon('hotel')} ${stayTypeLabel('hotel')}` },
  { value: 'apartamento', label: `${stayTypeIcon('apartamento')} ${stayTypeLabel('apartamento')}` },
  { value: 'hostel', label: `${stayTypeIcon('hostel')} ${stayTypeLabel('hostel')}` },
  { value: 'pousada', label: `${stayTypeIcon('pousada')} ${stayTypeLabel('pousada')}` },
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
  const [voucherRecognized, setVoucherRecognized] = useState<boolean | null>(null);

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

  function handleVoucherFile(file: File) {
    const match = lookupMockStayVoucher(file.name);
    setVoucherFileName(file.name);

    if (!match) {
      setVoucherRecognized(false);
      return;
    }

    setVoucherRecognized(true);
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
    setVoucherRecognized(null);
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
        recognized={voucherRecognized}
        onFileSelected={handleVoucherFile}
        onRemove={handleRemoveVoucher}
      />

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

      <TextField id={`${baseId}-address`} label="Endereço" value={address} onChange={setAddress} autoComplete="off" />

      <TextField
        id={`${baseId}-locality`}
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
          label="Horário do check-in"
          placeholder="Ex.: 15:00"
          inputMode="numeric"
          value={checkInTime}
          onChange={(v) => setCheckInTime(maskTime(v))}
          autoComplete="off"
        />
        <TextField
          id={`${baseId}-checkout-time`}
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
        label="Código da reserva (opcional)"
        value={confirmationCode}
        onChange={setConfirmationCode}
        autoComplete="off"
      />

      <TextField
        id={`${baseId}-room-type`}
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

      <div className={styles.actions}>
        <Button fullWidth onClick={handleSave}>
          Salvar estadia
        </Button>
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${formStyles.removeOnly}`}
              onClick={onRemove}
            >
              Remover estadia
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
