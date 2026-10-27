import { Plus, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useId, useState } from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MultiOptionChipGroup } from '../quiz/MultiOptionChipGroup';
import { TextField } from '../inputs/TextField';
import type { MemberId } from '../../context/TripContext';
import { YOU, type Member } from '../../utils/costs';
import { externalMemberId, isExternalMemberId } from '../../utils/settlement';
import { Icon } from '../shell/Icon';
import { Button } from '../shell/Button';
import styles from '../central/TransportItemForm.module.css';

/** valor do <option> "Outro" (quem pagou é de fora da viagem) */
const OTHER = '__outro__';

/**
 * Estado de "Quem pagou?" + "Dividir com" + "Dividido entre quantas pessoas?" (ajustes-94/95b/95c),
 * o mesmo no gasto lançado à mão (ExpenseForm) e no custo da Central (CentralCostForm). Escolhendo
 * "Outro", o nome digitado vira uma pessoa do rateio (externalMemberId) e aparece como chip no
 * "Dividir com", DESMARCADO (ajustes-95b: quem pagou por fora nem sempre entra na conta); trocar o
 * nome troca o chip (e mantém marcado, se estava), e voltar pra um membro tira o chip.
 *
 * Desde o ajustes-95c o gasto começa só com quem lançou (Eu pagou, só Eu marcado) e o "+ Outra
 * pessoa" põe gente de fora da viagem só nesse gasto: chip já marcado, com "×" pra tirar. Mesmo
 * nome = mesma pessoa (externalMemberId), também se for o "Outro" de quem pagou.
 *
 * O número de pessoas começa igual aos chips marcados e acompanha os chips enquanto a pessoa não
 * mexer nele; nunca pode ser menor que os marcados (aviso e o formulário não salva).
 */
export function usePaidSplit(initial: {
  paidBy: MemberId;
  paidByName?: string;
  splitWith: MemberId[];
  splitCount?: number;
  splitNames?: string[];
}) {
  // nunca abre sem ninguém marcado nem com "0" (ajustes-95c): no mínimo, só você
  const initialSplit = initial.splitWith.length > 0 ? initial.splitWith : [YOU];
  const [payer, setPayer] = useState<string>(isExternalMemberId(initial.paidBy) ? OTHER : initial.paidBy);
  const [otherName, setOtherName] = useState(initial.paidByName ?? '');
  const [splitWith, setSplitWith] = useState<MemberId[]>(initialSplit);
  const [extraNames, setExtraNames] = useState<string[]>(initial.splitNames ?? []);
  const initialCount = Math.max(initial.splitCount ?? 0, initialSplit.length);
  // editado = a pessoa digitou um número; senão ele segue os chips
  const [countText, setCountText] = useState<string | null>(
    initialCount > initialSplit.length ? String(initialCount) : null,
  );

  const otherId = otherName.trim() ? externalMemberId(otherName) : null;
  const isOther = payer === OTHER;
  const extras = extraNames.map((name) => ({ id: externalMemberId(name), name }));
  const isExtra = (id: MemberId | null) => !!id && extras.some((x) => x.id === id);

  // número editado e chip novo marcado: sobe junto, pra não ficar menor que os marcados
  function applySplit(next: MemberId[]) {
    setSplitWith(next);
    const typed = countText !== null ? Number(countText) : NaN;
    if (Number.isInteger(typed) && typed < next.length) setCountText(String(next.length));
  }

  function choosePayer(value: string) {
    setPayer(value);
    if (value !== OTHER && otherId && !isExtra(otherId)) setSplitWith((prev) => prev.filter((id) => id !== otherId));
  }

  function changeOtherName(name: string) {
    setOtherName(name);
    const nextId = name.trim() ? externalMemberId(name) : null;
    setSplitWith((prev) => {
      if (!otherId || !prev.includes(otherId) || isExtra(otherId)) return prev;
      const rest = prev.filter((id) => id !== otherId);
      return nextId && !rest.includes(nextId) ? [...rest, nextId] : rest;
    });
  }

  function toggleSplit(id: MemberId) {
    applySplit(splitWith.includes(id) ? splitWith.filter((x) => x !== id) : [...splitWith, id]);
  }

  /** "+ Outra pessoa": chip novo já marcado; nome que já existe (inclusive o "Outro") só marca */
  function addExtra(name: string) {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    const id = externalMemberId(clean);
    if (!isExtra(id) && id !== (isOther ? otherId : null)) setExtraNames((prev) => [...prev, clean]);
    if (!splitWith.includes(id)) applySplit([...splitWith, id]);
  }

  function removeExtra(id: MemberId) {
    setExtraNames((prev) => prev.filter((name) => externalMemberId(name) !== id));
    // o "Outro" de quem pagou com o mesmo nome continua como chip; só desmarca
    setSplitWith((prev) => prev.filter((x) => x !== id));
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
    /** pessoas de fora deste gasto ("+ Outra pessoa") */
    extras,
    addExtra,
    removeExtra,
    /** texto do campo "Dividido entre quantas pessoas?" — segue os chips enquanto não for editado */
    countValue: countText ?? String(Math.max(splitWith.length, 1)),
    changeCount: (value: string) => setCountText(value.replace(/\D/g, '').slice(0, 3)),
    countError,
    /** em quantas partes o total é dividido (null enquanto o número digitado é inválido ou sem ninguém marcado) */
    splitCount: countError || !splitCount ? null : splitCount,
    /** null = "Outro" sem nome ainda (o formulário não salva) */
    paidBy: isOther ? otherId : payer,
    paidByName: isOther ? otherName.trim() : undefined,
    valid: (!isOther || otherId !== null) && splitWith.length > 0 && !countError,
    /**
     * Sempre a lista marcada (ajustes-95c): o "null = todos" deixou de ser salvo, senão um gasto só
     * seu viraria dividido com quem entrasse depois.
     */
    splitForSave(): MemberId[] {
      return splitWith;
    },
    /** nomes de quem é de fora e ficou marcado (o resto do "+ Outra pessoa" some ao salvar) */
    namesForSave(): string[] | undefined {
      const names = extras.filter((x) => splitWith.includes(x.id)).map((x) => x.name);
      return names.length > 0 ? names : undefined;
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
 * "Dividir com" — chips com as mesmas pessoas do "Quem pagou?", o "Outro" digitado (desmarcado,
 * ajustes-95b) e quem foi posto pelo "+ Outra pessoa" (marcado, com "×", ajustes-95c) — e, abaixo,
 * "Dividido entre quantas pessoas?", pra incluir quem não está no app.
 */
export function SplitWithField({ members, state, perPersonLabel }: SplitWithFieldProps) {
  const baseId = useId();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const payerChip =
    state.payer === OTHER && state.paidBy && !state.extras.some((x) => x.id === state.paidBy)
      ? [{ value: state.paidBy, label: state.otherName.trim() }]
      : [];
  const chipOptions = [
    ...members.map((m) => ({ value: m.id, label: optionLabel(m) })),
    ...payerChip,
    ...state.extras.map((x) => ({ value: x.id, label: x.name })),
  ];

  function closeAdding() {
    setAdding(false);
    setNewName('');
  }

  function confirmAdding() {
    if (!newName.trim()) return;
    state.addExtra(newName);
    closeAdding();
  }

  return (
    <div className={styles.fieldGroup}>
      <MultiOptionChipGroup
        legend="Dividir com"
        options={chipOptions}
        values={state.splitWith}
        onToggle={state.toggleSplit}
        removableValues={state.extras.map((x) => x.id)}
        onRemove={state.removeExtra}
        trailing={
          !adding && (
            <button type="button" className={addChipClass} onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden="true" /> Outra pessoa
            </button>
          )
        }
      />
      {adding && (
        <div className={styles.fieldGroup}>
          <TextField
            id={`${baseId}-new-person`}
            label="Nome da pessoa"
            placeholder="Ex.: Paula"
            value={newName}
            onChange={setNewName}
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAdding();
              } else if (e.key === 'Escape') {
                closeAdding();
              }
            }}
          />
          <div className="flex gap-(--space-2)">
            <Button variant="secondary" disabled={!newName.trim()} onClick={confirmAdding}>
              Adicionar
            </Button>
            <Button variant="link" onClick={closeAdding}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
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

/*
  "+ Outra pessoa" (ajustes-95c): mesmo formato dos chips (40px, área de toque de 44px), mas borda
  tracejada — é uma ação, não uma pessoa. Borda stone-500 (4.8:1), texto --accent-dark (9.67:1).
*/
const addChipClass = cn(
  'relative inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-input bg-background px-4 text-sm font-medium text-(--accent-dark)',
  "before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-['']",
  'hover:bg-muted',
);
