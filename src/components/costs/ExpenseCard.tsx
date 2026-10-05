import { Receipt, Users } from 'lucide-react';
import { CATEGORY_META, memberLabel, type CostEntry, type Member } from '../../utils/costs';
import { formatMoney } from '../../utils/money';
import { MOCK_EXPENSE_PREFIX } from '../../utils/mockContributions';
import { Badge } from '@/components/ui/badge';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './ExpenseCard.module.css';

interface ExpenseCardProps {
  entry: CostEntry;
  members: Member[];
  onEdit: () => void;
}

export function ExpenseCard({ entry, members, onEdit }: ExpenseCardProps) {
  const meta = CATEGORY_META[entry.category];
  const payer = memberLabel(members, entry.paidBy);
  const splitCount = entry.splitWith.length;
  const paidLine =
    members.length > 1
      ? `Pago por ${payer} · dividido entre ${splitCount} ${splitCount === 1 ? 'pessoa' : 'pessoas'}`
      : `Pago por ${payer}`;

  return (
    <Card asChild className="px-4">
    <article className={styles.card}>
      <div className={styles.main}>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={meta.icon} />
        </span>
        <div className={styles.text}>
          <h4 className={styles.description}>{entry.description}</h4>
          <p className={styles.meta}>
            <span className="visually-hidden">{meta.label}. </span>
            {paidLine}
          </p>
        </div>
        <div className={styles.amounts}>
          <span className={styles.amount}>{formatMoney(entry.amount, entry.currencyCode)}</span>
          {entry.currencyCode !== 'BRL' && (
            <span className={styles.converted}>
              {entry.amountBRL !== null ? `≈ ${formatMoney(entry.amountBRL, 'BRL')}` : 'sem conversão'}
            </span>
          )}
        </div>
      </div>
      <div className={styles.footer}>
        {entry.origin === 'central' && (
          <Badge variant="neutral">
            <Icon icon={Receipt} /> Da Central
          </Badge>
        )}
        {/* gasto simulado de convidado do cenário (ajustes-67) */}
        {entry.origin === 'manual' && entry.id.startsWith(MOCK_EXPENSE_PREFIX) && (
          <Badge variant="neutral">
            <Icon icon={Users} /> Lançado por {payer.split(' ')[0]}
          </Badge>
        )}
        <button
          type="button"
          className={styles.editButton}
          onClick={onEdit}
          aria-label={`Editar ${entry.description}`}
        >
          Editar
        </button>
      </div>
    </article>
    </Card>
  );
}
