import { Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shell/Button';
import { PaidByField, SplitWithField, usePaidSplit } from './PaidSplitFields';
import type { CentralCostOverride } from '../../context/TripContext';
import { YOU, type CostEntry, type Member } from '../../utils/costs';
import { formatMoney } from '../../utils/money';
import { Icon } from '../shell/Icon';
import styles from '../central/TransportItemForm.module.css';
import ownStyles from './CentralCostForm.module.css';

interface CentralCostFormProps {
  entry: CostEntry;
  members: Member[];
  onSave: (override: CentralCostOverride) => void;
}

/**
 * Custo que veio da Central: aqui só muda quem pagou e com quem divide —
 * valor e moeda continuam sendo editados no item da Central.
 */
export function CentralCostForm({ entry, members, onSave }: CentralCostFormProps) {
  const navigate = useNavigate();
  const paidSplit = usePaidSplit({
    paidBy: entry.paidBy,
    paidByName: entry.paidByName,
    splitWith: entry.splitWith,
    splitCount: entry.splitCount,
    splitNames: entry.splitNames,
  });

  // total ÷ "Dividido entre quantas pessoas?" (ajustes-95b)
  const perPersonLabel =
    entry.amountBRL !== null && paidSplit.splitCount
      ? `Cada um: ${formatMoney(entry.amountBRL / paidSplit.splitCount, 'BRL')}`
      : null;

  function handleSave() {
    if (!paidSplit.valid) return;
    onSave({
      sourceId: entry.id,
      paidBy: paidSplit.paidBy ?? YOU,
      ...(paidSplit.paidByName ? { paidByName: paidSplit.paidByName } : {}),
      splitWith: paidSplit.splitForSave(),
      ...(paidSplit.countForSave() ? { splitCount: paidSplit.countForSave() } : {}),
      ...(paidSplit.namesForSave() ? { splitNames: paidSplit.namesForSave() } : {}),
    });
  }

  return (
    <div className={styles.form}>
      <div className={ownStyles.summary}>
        <p className={ownStyles.title}>{entry.description}</p>
        <p className={styles.hint}>
          {formatMoney(entry.amount, entry.currencyCode)} · <Icon icon={Receipt} /> Da Central
        </p>
      </div>

      {/* "Quem pagou?" primeiro e sem depender de convidado aceito (ajustes-95) */}
      <PaidByField members={members} state={paidSplit} />
      <SplitWithField members={members} state={paidSplit} perPersonLabel={perPersonLabel} />

      <p className={styles.hint}>
        O valor e a moeda vêm da Central.{' '}
        <button type="button" className={styles.inlineLink} onClick={() => navigate('/central')}>
          Editar valor na Central
        </button>
      </p>

      <div className={styles.actions}>
        <Button fullWidth disabled={!paidSplit.valid} onClick={handleSave}>
          Salvar gasto
        </Button>
      </div>
    </div>
  );
}
