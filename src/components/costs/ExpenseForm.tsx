import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { AttachmentList } from '../central/AttachmentList';
import { PaidSplitFields } from './PaidSplitFields';
import type {
  Attachment,
  Expense,
  ExpenseCategory,
  MemberId,
  TripDestination,
} from '../../context/TripContext';
import { CATEGORY_META, EXPENSE_CATEGORIES, YOU, displayDateToISO, resolveSplit, type Member } from '../../utils/costs';
import { RATES_AS_OF, formatMoney, parseAmount, toBRL } from '../../utils/money';
import { formatISOToDisplay, maskSingleDate } from '../../utils/dateMask';
import styles from '../central/TransportItemForm.module.css';
import formStyles from '../central/StayItemForm.module.css';

interface ExpenseFormProps {
  destinations: TripDestination[];
  members: Member[];
  /** null = lançando um gasto novo */
  initialExpense: Expense | null;
  onSave: (expense: Expense) => void;
  /** só quando editando */
  onRemove?: () => void;
  /** valor e moeda já preenchidos (vindo do Conversor) — só usado quando initialExpense é null */
  prefill?: { amount: string; currencyCode: string };
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

export function ExpenseForm({ destinations, members, initialExpense, onSave, onRemove, prefill }: ExpenseFormProps) {
  const baseId = useId();
  const navigate = useNavigate();
  const hasCompanions = members.length > 1;

  const [description, setDescription] = useState(initialExpense?.description ?? '');
  const [place, setPlace] = useState<string | null>(
    initialExpense ? (initialExpense.destinationId ?? OTHER_PLACE) : null,
  );
  const initialPrefill = initialExpense ? undefined : prefill;
  const [amount, setAmount] = useState(initialExpense?.amount ?? initialPrefill?.amount ?? '');
  const [currencyCode, setCurrencyCode] = useState(
    initialExpense?.currencyCode ?? initialPrefill?.currencyCode ?? currentDestinationCurrency(destinations),
  );
  const [currencyHint, setCurrencyHint] = useState<string | null>(null);
  const [category, setCategory] = useState<ExpenseCategory | null>(initialExpense?.category ?? null);
  const [paidBy, setPaidBy] = useState<MemberId>(initialExpense?.paidBy ?? YOU);
  const [splitWith, setSplitWith] = useState<MemberId[]>(() =>
    resolveSplit(initialExpense?.splitWith ?? null, members),
  );
  const [dateText, setDateText] = useState(initialExpense?.date ? formatISOToDisplay(initialExpense.date) : '');
  const [attachments, setAttachments] = useState<Attachment[]>(initialExpense?.attachments ?? []);

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
  const dateISO = dateText.length === 10 ? displayDateToISO(dateText) : null;
  const dateError = dateText.length === 10 && !dateISO ? 'Data inválida.' : null;

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
    !dateError;

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
    });
  }

  return (
    <div className={styles.form}>
      <TextField
        id={`${baseId}-description`}
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
            id={`${baseId}-amount`}
            label="Valor"
            placeholder="Ex.: 450"
            inputMode="decimal"
            value={amount}
            onChange={setAmount}
            error={amountError}
            autoComplete="off"
          />
          <CurrencySelect
            id={`${baseId}-currency`}
            label="Moeda"
            value={currencyCode}
            onChange={handleCurrencyChange}
          />
        </div>
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

      <TextField
        id={`${baseId}-date`}
        label="Data (opcional)"
        placeholder="dd/mm/aaaa"
        inputMode="numeric"
        value={dateText}
        onChange={(v) => setDateText(maskSingleDate(v))}
        error={dateError}
        autoComplete="off"
      />

      <AttachmentList
        attachments={attachments}
        onChange={setAttachments}
        hint="Comprovante (opcional): anexe a nota ou o recibo (PDF ou foto)."
      />

      <div className={styles.actions}>
        <Button fullWidth disabled={!canSave} onClick={handleSave}>
          Salvar gasto
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
