import { Receipt } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shell/Button';
import { PaidSplitFields } from './PaidSplitFields';
import type { CentralCostOverride, MemberId } from '../../context/TripContext';
import type { CostEntry, Member } from '../../utils/costs';
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
  const [paidBy, setPaidBy] = useState<MemberId>(entry.paidBy);
  const [splitWith, setSplitWith] = useState<MemberId[]>(entry.splitWith);

  function toggleSplit(id: MemberId) {
    setSplitWith((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const perPersonLabel =
    entry.amountBRL !== null && splitWith.length > 0
      ? `Cada um: ${formatMoney(entry.amountBRL / splitWith.length, 'BRL')}`
      : null;

  function handleSave() {
    if (splitWith.length === 0) return;
    const allSelected = members.every((m) => splitWith.includes(m.id));
    onSave({ sourceId: entry.id, paidBy, splitWith: allSelected ? null : splitWith });
  }

  return (
    <div className={styles.form}>
      <div className={ownStyles.summary}>
        <p className={ownStyles.title}>{entry.description}</p>
        <p className={styles.hint}>
          {formatMoney(entry.amount, entry.currencyCode)} · <Icon icon={Receipt} /> Da Central
        </p>
      </div>

      {members.length > 1 ? (
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
          Quer dividir esse gasto? Convide alguém em{' '}
          <button type="button" className={styles.inlineLink} onClick={() => navigate('/convidar')}>
            Convidados
          </button>
          .
        </p>
      )}

      <p className={styles.hint}>
        O valor e a moeda vêm da Central.{' '}
        <button type="button" className={styles.inlineLink} onClick={() => navigate('/central')}>
          Editar valor na Central
        </button>
      </p>

      <div className={styles.actions}>
        <Button fullWidth disabled={splitWith.length === 0} onClick={handleSave}>
          Salvar gasto
        </Button>
      </div>
    </div>
  );
}
