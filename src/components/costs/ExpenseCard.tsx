import { Receipt, Users } from 'lucide-react';
import { CATEGORY_META, effectiveSplitCount, memberLabel, type CostEntry, type Member } from '../../utils/costs';
import { formatMoney } from '../../utils/money';
import { MOCK_EXPENSE_PREFIX } from '../../utils/mockContributions';
import { Badge } from '@/components/ui/badge';
import { Icon } from '../shell/Icon';
import { NewBadge } from '../shell/NewBadge';
import { DocumentThumbs, isImageAttachment } from '../documents/DocumentFiles';
import type { Attachment } from '../../context/TripContext';
import { Card } from '@/components/ui/card';
import styles from './ExpenseCard.module.css';

/** id do cartão — a parada do Roteiro leva até o gasto lançado por ela (ajustes-88) */
export const expenseCardId = (expenseId: string) => `gasto-${expenseId}`;

interface ExpenseCardProps {
  entry: CostEntry;
  members: Member[];
  onEdit: () => void;
  /** veio na simulação "uma semana antes da viagem" e ainda não foi visto (ajustes-89) */
  isNew?: boolean;
  /** comprovantes do gasto: foto da nota vira miniatura que abre em tela cheia (ajustes-90) */
  attachments?: Attachment[];
}

export function ExpenseCard({ entry, members, onEdit, isNew = false, attachments = [] }: ExpenseCardProps) {
  const receiptPhotos = attachments.filter(isImageAttachment);
  const meta = CATEGORY_META[entry.category];
  const payer = memberLabel(members, entry.paidBy);
  // "Dividido entre N pessoas" conta também quem não está no app (ajustes-95b)
  const splitCount = effectiveSplitCount(entry);
  const paidLine =
    members.length > 1 || splitCount > 1
      ? `Pago por ${payer} · dividido entre ${splitCount} ${splitCount === 1 ? 'pessoa' : 'pessoas'}`
      : `Pago por ${payer}`;

  return (
    <Card asChild className="px-4">
    <article id={expenseCardId(entry.id)} className={styles.card}>
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
      {receiptPhotos.length > 0 && <DocumentThumbs attachments={receiptPhotos} docLabel={`Nota de ${entry.description}`} />}
      <div className={styles.footer}>
        {isNew && <NewBadge />}
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
