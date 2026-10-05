import { TriangleAlert } from 'lucide-react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { MultiOptionChipGroup } from '../quiz/MultiOptionChipGroup';
import type { MemberId } from '../../context/TripContext';
import type { Member } from '../../utils/costs';
import { Icon } from '../shell/Icon';
import styles from '../central/TransportItemForm.module.css';

interface PaidSplitFieldsProps {
  members: Member[];
  paidBy: MemberId;
  onPaidByChange: (id: MemberId) => void;
  splitWith: MemberId[];
  onToggleSplit: (id: MemberId) => void;
  /** "Cada um: R$ X" — null quando ainda não dá pra calcular */
  perPersonLabel: string | null;
}

/**
 * "Quem pagou?" + "Dividir com" — compartilhado entre o formulário completo
 * de gasto (ExpenseForm) e o reduzido dos custos que vêm da Central
 * (CentralCostForm), pra não duplicar a lógica.
 */
export function PaidSplitFields({
  members,
  paidBy,
  onPaidByChange,
  splitWith,
  onToggleSplit,
  perPersonLabel,
}: PaidSplitFieldsProps) {
  const options = members.map((m) => ({ value: m.id, label: m.label }));

  return (
    <>
      <OptionChipGroup legend="Quem pagou?" options={options} value={paidBy} onChange={onPaidByChange} />
      <div className={styles.fieldGroup}>
        <MultiOptionChipGroup legend="Dividir com" options={options} values={splitWith} onToggle={onToggleSplit} />
        {splitWith.length === 0 ? (
          <p className={styles.hint} role="alert">
            <Icon icon={TriangleAlert} /> Escolha pelo menos 1 pessoa.
          </p>
        ) : (
          perPersonLabel && <p className={styles.hint}>{perPersonLabel}</p>
        )}
      </div>
    </>
  );
}
