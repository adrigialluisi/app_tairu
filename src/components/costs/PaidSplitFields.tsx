import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MultiOptionChipGroup } from '../quiz/MultiOptionChipGroup';
import { TextField } from '../inputs/TextField';
import type { MemberId } from '../../context/TripContext';
import { YOU, type Member } from '../../utils/costs';
import { externalMemberId, isExternalMemberId } from '../../utils/settlement';
import { Icon } from '../shell/Icon';
import styles from '../central/TransportItemForm.module.css';

/** valor do <option> "Outro" (quem pagou é de fora da viagem) */
const OTHER = '__outro__';

/**
 * Estado de "Quem pagou?" + "Dividir com" + "Dividido entre quantas pessoas?" (ajustes-94/95b), o
 * mesmo no gasto lançado à mão (ExpenseForm) e no custo da Central (CentralCostForm). Escolhendo
 * "Outro", o nome digitado vira uma pessoa do rateio (externalMemberId) e aparece como chip no
 * "Dividir com", DESMARCADO (ajustes-95b: quem pagou por fora nem sempre entra na conta); trocar o
 * nome troca o chip (e mantém marcado, se estava), e voltar pra um membro tira o chip.
 *
 * O número de pessoas começa igual aos chips marcados e acompanha os chips enquanto a pessoa não
 * mexer nele; nunca pode ser menor que os marcados (aviso e o formulário não salva).
 */
export function usePaidSplit(initial: {
  paidBy: MemberId;
  paidByName?: string;
  splitWith: MemberId[];
  splitCount?: number;
}) {
  const [payer, setPayer] = useState<string>(isExternalMemberId(initial.paidBy) ? OTHER : initial.paidBy);
  const [otherName, setOtherName] = useState(initial.paidByName ?? '');
  const [splitWith, setSplitWith] = useState<MemberId[]>(initial.splitWith);
  const initialCount = Math.max(initial.splitCount ?? 0, initial.splitWith.length);
  // editado = a pessoa digitou um número; senão ele segue os chips
  const [countText, setCountText] = useState<string | null>(
    initialCount > initial.splitWith.length ? String(initialCount) : null,
  );

  const otherId = otherName.trim() ? externalMemberId(otherName) : null;
  const isOther = payer === OTHER;

  function choosePayer(value: string) {
    setPayer(value);
    if (value !== OTHER && otherId) setSplitWith((prev) => prev.filter((id) => id !== otherId));
  }

  function changeOtherName(name: string) {
    setOtherName(name);
    const nextId = name.trim() ? externalMemberId(name) : null;
    setSplitWith((prev) => {
      if (!otherId || !prev.includes(otherId)) return prev;
      const rest = prev.filter((id) => id !== otherId);
      return nextId && !rest.includes(nextId) ? [...rest, nextId] : rest;
    });
  }

  function toggleSplit(id: MemberId) {
    const next = splitWith.includes(id) ? splitWith.filter((x) => x !== id) : [...splitWith, id];
    setSplitWith(next);
    // número editado e chip novo marcado: sobe junto, pra não ficar menor que os marcados
    const typed = countText !== null ? Number(countText) : NaN;
    if (Number.isInteger(typed) && typed < next.length) setCountText(String(next.length));
  }

  const typedCount = countText !== null && /^\d+$/.test(countText.trim()) ? Number(countText.trim()) : null;
  const splitCount = countText === null ? splitWith.length : typedCount;
  const countError =
    countText === null
      ? null
      : splitCount === null || splitCount < 1
        ? 'Digite quantas pessoas, em número.'
        : splitCount < splitWith.length
          ? `Tem ${splitWith.length} pessoas marcadas: o número não pode ser menor.`
          : null;

  return {
    payer,
    choosePayer,
    otherName,
    changeOtherName,
    splitWith,
    toggleSplit,
    /** texto do campo "Dividido entre quantas pessoas?" — segue os chips enquanto não for editado */
    countValue: countText ?? String(splitWith.length),
    changeCount: (value: string) => setCountText(value.replace(/\D/g, '').slice(0, 3)),
    countError,
    /** em quantas partes o total é dividido (null enquanto o número digitado é inválido) */
    splitCount: countError ? null : splitCount,
    /** null = "Outro" sem nome ainda (o formulário não salva) */
    paidBy: isOther ? otherId : payer,
    paidByName: isOther ? otherName.trim() : undefined,
    valid: (!isOther || otherId !== null) && splitWith.length > 0 && !countError,
    /** null quando a divisão é entre todos os membros e mais ninguém (vale também pra quem entrar depois) */
    splitForSave(members: Member[]): MemberId[] | null {
      const allSelected = members.every((m) => splitWith.includes(m.id));
      return allSelected && splitWith.every((id) => !isExternalMemberId(id)) ? null : splitWith;
    },
    /** splitCount do gasto: só quando passa dos marcados (gente de fora do app); senão fica sem o campo */
    countForSave(): number | undefined {
      return splitCount !== null && splitCount > splitWith.length ? splitCount : undefined;
    },
  };
}

type PaidSplitState = ReturnType<typeof usePaidSplit>;

/** "Eu", o nome do convidado ou, enquanto o convite não foi aceito e não há nome, o e-mail */
function optionLabel(m: Member): string {
  if (m.id === YOU) return 'Eu';
  return m.pending && m.email ? m.email : m.label;
}

interface PaidByFieldProps {
  /** Você e todos os convidados, aceitos ou com convite pendente (ajustes-95) */
  members: Member[];
  state: PaidSplitState;
}

/**
 * "Quem pagou?" — select com Eu, cada convidado (aceito ou pendente) e Outro, que abre "Nome de
 * quem pagou" (ajustes-94). Desde o ajustes-95 é o primeiro campo do formulário de gasto e do
 * custo da Central: o organizador controla os gastos sem depender de quem aceitou o convite.
 */
export function PaidByField({ members, state }: PaidByFieldProps) {
  const baseId = useId();
  const payerId = `${baseId}-payer`;

  return (
    <div className={styles.fieldGroup}>
      <Field className="gap-(--space-label)">
        <FieldLabel htmlFor={payerId} className="block text-sm font-medium text-foreground">
          Quem pagou?
        </FieldLabel>
        {/* 44px, borda --field-border (4.8:1), mesmo raio dos campos; foco pelo anel global */}
        <NativeSelect
          className="w-full"
          selectClassName="h-11 rounded-md bg-background pl-3 text-(length:--text-base) text-foreground focus-visible:ring-0"
          id={payerId}
          value={state.payer}
          onChange={(e) => state.choosePayer(e.target.value)}
        >
          {members.map((m) => (
            <NativeSelectOption key={m.id} value={m.id}>
              {optionLabel(m)}
            </NativeSelectOption>
          ))}
          <NativeSelectOption value={OTHER}>Outro</NativeSelectOption>
        </NativeSelect>
      </Field>
      {state.payer === OTHER && (
        <TextField
          id={`${baseId}-other-name`}
          label="Nome de quem pagou"
          required
          placeholder="Ex.: Paula"
          value={state.otherName}
          onChange={state.changeOtherName}
          autoComplete="off"
        />
      )}
    </div>
  );
}

interface SplitWithFieldProps extends PaidByFieldProps {
  /** "Cada um: R$ X" — null quando ainda não dá pra calcular */
  perPersonLabel: string | null;
}

/**
 * "Dividir com" — chips com as mesmas pessoas do "Quem pagou?" e o "Outro" digitado (desmarcado,
 * ajustes-95b) — e, abaixo, "Dividido entre quantas pessoas?", pra incluir quem não está no app.
 */
export function SplitWithField({ members, state, perPersonLabel }: SplitWithFieldProps) {
  const baseId = useId();
  const chipOptions = [
    ...members.map((m) => ({ value: m.id, label: optionLabel(m) })),
    ...(state.payer === OTHER && state.paidBy ? [{ value: state.paidBy, label: state.otherName.trim() }] : []),
  ];

  return (
    <div className={styles.fieldGroup}>
      <MultiOptionChipGroup legend="Dividir com" options={chipOptions} values={state.splitWith} onToggle={state.toggleSplit} />
      {state.splitWith.length === 0 && (
        <p className={styles.hint} role="alert">
          <Icon icon={TriangleAlert} /> Escolha pelo menos 1 pessoa.
        </p>
      )}
      <TextField
        id={`${baseId}-count`}
        label="Dividido entre quantas pessoas?"
        inputMode="numeric"
        value={state.countValue}
        onChange={state.changeCount}
        error={state.countError}
        autoComplete="off"
      />
      {state.splitWith.length > 0 && !state.countError && perPersonLabel && (
        <p className={styles.hint}>{perPersonLabel}</p>
      )}
    </div>
  );
}
