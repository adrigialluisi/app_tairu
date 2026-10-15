import { CircleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { AttachmentList } from '../central/AttachmentList';
import { VoucherUpload } from '../central/VoucherUpload';
import { Icon } from '../shell/Icon';
import { useAutofill } from '../../hooks/useAutofill';
import { readReceiptFile } from '../../data/mockReceipts';
import { PaidSplitFields } from './PaidSplitFields';
import type {
  Attachment,
  Expense,
  ExpenseCategory,
  MemberId,
  TripDestination,
} from '../../context/TripContext';
import { CATEGORY_META, EXPENSE_CATEGORIES, YOU, resolveSplit, type Member } from '../../utils/costs';
import { RATES_AS_OF, formatMoney, parseAmount, toBRL } from '../../utils/money';
import { DateField } from '../inputs/DateField';
import { getTripEndISO, getTripStartISO } from '../../utils/itinerary';
import styles from '../central/TransportItemForm.module.css';
import formStyles from '../central/StayItemForm.module.css';

interface ExpenseFormProps {
  destinations: TripDestination[];
  members: Member[];
  /** null = lançando um gasto novo */
  initialExpense: Expense | null;
  onSave: (expense: Expense) => void;
  /** fecha sem salvar (ajustes-85): no gasto novo, desiste; editando, volta ao cartão sem alterações */
  onCancel: () => void;
  /** só quando editando */
  onRemove?: () => void;
  /** campos já preenchidos — só usado quando initialExpense é null (Conversor: valor e moeda; parada do Roteiro: o resto) */
  prefill?: ExpensePrefill;
}

/**
 * Gasto lançado de fora do formulário: o Conversor manda valor e moeda (ajustes-62); a parada do
 * Roteiro manda descrição, destino, moeda, data, categoria e a referência da parada (ajustes-88) —
 * aí a pessoa só digita o valor.
 */
export interface ExpensePrefill {
  amount?: string;
  currencyCode?: string;
  description?: string;
  destinationId?: string;
  date?: string | null;
  category?: ExpenseCategory | null;
  placeSelectionId?: string;
}

const OTHER_PLACE = 'outro';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: CATEGORY_META[c].label,
  icon: CATEGORY_META[c].icon,
}));

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Moeda inicial sem destino escolhido: a do destino em que a pessoa está hoje (pelas datas); senão BRL. */
function currentDestinationCurrency(destinations: TripDestination[]): string {
  const today = todayISO();
  const here = destinations.find((d) => d.dateStart && d.dateEnd && d.dateStart <= today && today <= d.dateEnd);
  return here?.currencyCode ?? 'BRL';
}

export function ExpenseForm({ destinations, members, initialExpense, onSave, onCancel, onRemove, prefill }: ExpenseFormProps) {
  const baseId = useId();
  const navigate = useNavigate();
  const hasCompanions = members.length > 1;

  const initialPrefill = initialExpense ? undefined : prefill;
  const [description, setDescription] = useState(initialExpense?.description ?? initialPrefill?.description ?? '');
  const [place, setPlace] = useState<string | null>(
    initialExpense ? (initialExpense.destinationId ?? OTHER_PLACE) : (initialPrefill?.destinationId ?? null),
  );
  const [amount, setAmount] = useState(initialExpense?.amount ?? initialPrefill?.amount ?? '');
  const [currencyCode, setCurrencyCode] = useState(
    initialExpense?.currencyCode ?? initialPrefill?.currencyCode ?? currentDestinationCurrency(destinations),
  );
  const [currencyHint, setCurrencyHint] = useState<string | null>(null);
  const [category, setCategory] = useState<ExpenseCategory | null>(
    initialExpense?.category ?? initialPrefill?.category ?? null,
  );
  const [paidBy, setPaidBy] = useState<MemberId>(initialExpense?.paidBy ?? YOU);
  const [splitWith, setSplitWith] = useState<MemberId[]>(() =>
    resolveSplit(initialExpense?.splitWith ?? null, members),
  );
  const [dateISO, setDateISO] = useState<string | null>(initialExpense?.date ?? initialPrefill?.date ?? null);
  const [dateInvalid, setDateInvalid] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(initialExpense?.attachments ?? []);
  // foto da nota (ajustes-90): leitura simulada pelo nome do arquivo; a foto vira o comprovante
  const af = useAutofill();
  const [receipt, setReceipt] = useState<Attachment | null>(null);
  const [amountUnread, setAmountUnread] = useState(false);
  const amountId = `${baseId}-amount`;

  function handleReceipt(file: File) {
    const attachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      url: URL.createObjectURL(file),
      mimeType: file.type,
    };
    // trocar a nota tira a anterior do comprovante
    setAttachments((prev) => [...prev.filter((a) => a.id !== receipt?.id), attachment]);
    setReceipt(attachment);
    const read = readReceiptFile(file);
    af.read(() => {
      if (read) {
        setAmountUnread(false);
        const dest = destinations.find((d) => d.cityId === read.cityId);
        setDescription(read.description);
        if (dest) setPlace(dest.id);
        setAmount(read.amount);
        setCurrencyCode(read.currencyCode);
        setCurrencyHint(null);
        setCategory(read.category);
        setDateISO(read.dateISO);
        return ['description', 'amount', 'currency', 'date'];
      }
      /*
        Qualquer outra foto: o valor NUNCA é inventado, e nada é dado como "lido da nota" (sem faixa
        verde). O que o contexto sabe já está no formulário — aberto pela parada do Roteiro, vem com
        o lugar, a cidade, a moeda e o dia (prefill). O valor fica como está (vazio, se ninguém
        digitou), com foco e o pedido do total.
      */
      setAmountUnread(amount.trim() === '');
      requestAnimationFrame(() => document.getElementById(amountId)?.focus());
      return [];
    });
  }

  function removeReceipt() {
    if (receipt) {
      URL.revokeObjectURL(receipt.url);
      setAttachments((prev) => prev.filter((a) => a.id !== receipt.id));
    }
    setReceipt(null);
    setAmountUnread(false);
    af.reset();
  }

  const placeOptions = [
    ...destinations.map((d) => ({ value: d.id, label: d.city })),
    { value: OTHER_PLACE, label: 'Outro lugar' },
  ];

  function handlePlaceChange(value: string) {
    setPlace(value);
    const dest = destinations.find((d) => d.id === value);
    if (dest) {
      setCurrencyCode(dest.currencyCode);
      setCurrencyHint(`Moeda ajustada pra ${dest.currencyCode} (${dest.city}).`);
    } else {
      setCurrencyHint(null);
    }
  }

  function handleCurrencyChange(code: string) {
    setCurrencyCode(code);
    setCurrencyHint(null);
  }

  function toggleSplit(id: MemberId) {
    setSplitWith((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const parsedAmount = parseAmount(amount);
  const amountBRL = parsedAmount !== null ? toBRL(parsedAmount, currencyCode) : null;
  const amountError = amount.trim() !== '' && parsedAmount === null ? 'Valor inválido. Ex.: 450 ou 85,50' : null;

  let preview: string | null = null;
  if (parsedAmount !== null && currencyCode !== 'BRL') {
    preview =
      amountBRL !== null
        ? `≈ ${formatMoney(amountBRL, 'BRL')} · cotação de ${RATES_AS_OF}`
        : 'Sem conversão: não temos a cotação dessa moeda.';
  }

  const effectiveSplit = hasCompanions ? splitWith : [YOU];
  const perPersonLabel =
    amountBRL !== null && effectiveSplit.length > 0
      ? `Cada um: ${formatMoney(amountBRL / effectiveSplit.length, 'BRL')}`
      : null;

  const canSave =
    description.trim() !== '' &&
    parsedAmount !== null &&
    parsedAmount > 0 &&
    effectiveSplit.length > 0 &&
    !dateInvalid;

  function handleSave() {
    if (!canSave) return;
    const allSelected = members.every((m) => splitWith.includes(m.id));
    onSave({
      id: initialExpense?.id ?? `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: description.trim(),
      amount,
      currencyCode,
      destinationId: place && place !== OTHER_PLACE ? place : null,
      category: category ?? 'outros',
      paidBy: hasCompanions ? paidBy : YOU,
      splitWith: !hasCompanions || allSelected ? null : splitWith,
      date: dateISO,
      attachments,
      placeSelectionId: initialExpense?.placeSelectionId ?? initialPrefill?.placeSelectionId ?? null,
    });
  }

  return (
    <div className={styles.form}>
      {/* igual ao voucher da Central (ajustes-90): foto da nota preenche e vira o comprovante */}
      <VoucherUpload
        fileName={receipt?.fileName ?? null}
        reading={af.reading}
        filled={af.filled}
        onFileSelected={handleReceipt}
        onRemove={removeReceipt}
        hint="Tem a nota? Envie uma foto pra preencher automaticamente."
        buttonLabel="Enviar foto da nota"
        filledMessage="Preenchemos os campos com o que lemos da nota. Confira antes de salvar."
        fileNoun="nota"
        accept="image/*"
      />

      <fieldset disabled={af.reading} className="contents">
      <TextField
        id={`${baseId}-description`}
        highlight={af.hl('description')}
        label="O que foi?"
        placeholder="Ex.: Jantar no Don Julio"
        value={description}
        onChange={setDescription}
        autoComplete="off"
      />

      <div className={styles.fieldGroup}>
        <OptionChipGroup legend="Onde foi?" options={placeOptions} value={place} onChange={handlePlaceChange} />
        {currencyHint && (
          <p className={styles.hint} role="status">
            {currencyHint}
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.costRow}>
          <TextField
            id={amountId}
            label="Valor"
            placeholder="Ex.: 450"
            inputMode="decimal"
            value={amount}
            onChange={(v) => {
              setAmount(v);
              if (v.trim() !== '') setAmountUnread(false);
            }}
            error={amountError}
            highlight={af.hl('amount')}
            autoComplete="off"
          />
          <CurrencySelect
            id={`${baseId}-currency`}
            label="Moeda"
            value={currencyCode}
            onChange={handleCurrencyChange}
            highlight={af.hl('currency')}
          />
        </div>
        {/* aviso, não erro: --warning (5.89:1), com ícone (ajustes-90) */}
        {amountUnread && !af.reading && (
          <p className="m-0 flex items-start gap-1 text-(length:--text-sm) font-medium text-warning" role="status">
            <Icon icon={CircleAlert} /> Não conseguimos ler o valor. Digite o total da nota.
          </p>
        )}
        {preview && (
          <p className={styles.hint} aria-live="polite">
            {preview}
          </p>
        )}
      </div>

      <OptionChipGroup legend="Categoria" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />

      {hasCompanions ? (
        <PaidSplitFields
          members={members}
          paidBy={paidBy}
          onPaidByChange={setPaidBy}
          splitWith={splitWith}
          onToggleSplit={toggleSplit}
          perPersonLabel={perPersonLabel}
        />
      ) : (
        <p className={styles.hint}>
          Quer dividir os gastos? Convide alguém em{' '}
          <button type="button" className={styles.inlineLink} onClick={() => navigate('/convidar')}>
            Convidados
          </button>
          .
        </p>
      )}

      <DateField
        id={`${baseId}-date`}
        label="Data (opcional)"
        valueISO={dateISO}
        onChange={setDateISO}
        onInvalidChange={setDateInvalid}
        highlight={af.hl('date')}
        tripRange={{ startISO: getTripStartISO(destinations), endISO: getTripEndISO(destinations) }}
      />

      <AttachmentList
        attachments={attachments}
        onChange={(next) => {
          setAttachments(next);
          // nota tirada pela lista de comprovantes: o bloco da nota volta ao "Enviar foto da nota"
          if (receipt && !next.some((a) => a.id === receipt.id)) {
            setReceipt(null);
            setAmountUnread(false);
            af.reset();
          }
        }}
        hint="Comprovante (opcional): anexe a nota ou o recibo (PDF ou foto)."
      />
      </fieldset>

      <div className={styles.actions}>
        <Button fullWidth disabled={!canSave || af.reading} onClick={handleSave}>
          Salvar gasto
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
        {onRemove && (
          <div className={styles.secondaryActions}>
            <button
              type="button"
              className={`${styles.textButton} ${styles.removeButton} ${formStyles.removeOnly}`}
              onClick={onRemove}
            >
              Remover gasto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
