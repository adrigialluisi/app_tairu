import { ArrowDown, ArrowUp, Check, HandCoins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shell/Button';
import { useTrip } from '../../context/TripContext';
import {
  computeBalances,
  computeTransfers,
  memberLabel,
  settledKey,
  YOU,
  type CostEntry,
  type Member,
} from '../../utils/costs';
import { RATES_AS_OF, formatMoney } from '../../utils/money';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './SettlementPanel.module.css';

interface SettlementPanelProps {
  entries: CostEntry[];
  members: Member[];
}

/** Aba Rateio: saldo de cada membro e as transferências pra acertar as contas (em reais). */
export function SettlementPanel({ entries, members }: SettlementPanelProps) {
  const trip = useTrip();
  const navigate = useNavigate();

  if (members.length < 2) {
    return (
      <Card asChild className="px-4">
      <div className={styles.invite}>
        <p className={styles.inviteText}>
          <Icon icon={Users} /> Convide alguém pra dividir os gastos da viagem.
        </p>
        <Button variant="secondary" onClick={() => navigate('/convidar')}>
          Convidar
        </Button>
      </div>
      </Card>
    );
  }

  // recalculado a cada render: qualquer mudança em gasto, Central ou convidados reflete aqui
  const balances = computeBalances(entries, members);
  const transfers = computeTransfers(balances);

  return (
    <div className={styles.wrap}>
      <section className={styles.block} aria-labelledby="rateio-membros">
        <h3 id="rateio-membros" className={styles.blockTitle}>
          Quanto cada um
        </h3>
        <ul className={styles.list}>
          {balances.map((b) => {
            const isYou = b.memberId === YOU;
            const name = memberLabel(members, b.memberId);
            return (
              <Card asChild className="px-4">
              <li key={b.memberId} className={styles.memberCard}>
                <span className={`${styles.memberName} ${isYou ? styles.memberNameYou : ''}`}>{name}</span>
                <span className={styles.memberMeta}>Pagou {formatMoney(b.paidBRL, 'BRL')}</span>
                <span className={styles.memberMeta}>
                  {isYou ? 'Sua parte' : `Parte de ${name}`}: {formatMoney(b.shareBRL, 'BRL')}
                </span>
                {b.balanceBRL > 0.005 ? (
                  <span className={`${styles.balance} ${styles.balanceReceive}`}>
                    <Icon icon={ArrowUp} /> vai receber {formatMoney(b.balanceBRL, 'BRL')}
                  </span>
                ) : b.balanceBRL < -0.005 ? (
                  <span className={`${styles.balance} ${styles.balanceOwe}`}>
                    <Icon icon={ArrowDown} /> deve {formatMoney(-b.balanceBRL, 'BRL')}
                  </span>
                ) : (
                  <span className={styles.balance}>
                    <Icon icon={Check} /> quite
                  </span>
                )}
              </li>
              </Card>
            );
          })}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="rateio-acertos">
        <h3 id="rateio-acertos" className={styles.blockTitle}>
          Pra acertar as contas
        </h3>
        {transfers.length === 0 ? (
          <p className={styles.allSet}>
            <Icon icon={Check} /> Tudo certo, ninguém deve nada.
          </p>
        ) : (
          <ul className={styles.list}>
            {transfers.map((t) => {
              const key = settledKey(t);
              const settled = trip.settledTransferKeys.includes(key);
              return (
                <Card asChild className="px-4">
                <li key={t.key} className={styles.transfer}>
                  <p className={`${styles.transferText} ${settled ? styles.transferSettled : ''}`}>
                    <Icon icon={HandCoins} />{' '}
                    {memberLabel(members, t.from)} paga {formatMoney(t.amountBRL, 'BRL')} pra{' '}
                    {memberLabel(members, t.to)}
                  </p>
                  {settled ? (
                    <div className={styles.settledRow}>
                      <span className={styles.settledLabel}>
                        <Icon icon={Check} /> Acertado
                      </span>
                      <Button variant="secondary" onClick={() => trip.toggleSettledTransfer(key)}>
                        Desfazer
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" fullWidth onClick={() => trip.toggleSettledTransfer(key)}>
                      Marcar como acertado
                    </Button>
                  )}
                </li>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <p className={styles.note}>Rateio em reais, pela cotação de {RATES_AS_OF}.</p>
    </div>
  );
}
