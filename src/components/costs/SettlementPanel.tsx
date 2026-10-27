import { ArrowDown, ArrowUp, Check, HandCoins, History, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '../inputs/TextField';
import { DateField } from '../inputs/DateField';
import { Button } from '../shell/Button';
import { useTrip } from '../../context/TripContext';
import {
  computeBalances,
  computeTransfers,
  memberLabel,
  YOU,
  type CostEntry,
  type Member,
  type Transfer,
} from '../../utils/costs';
import { RATES_AS_OF, formatMoney, parseAmount } from '../../utils/money';
import { formatISOToDisplay } from '../../utils/dateMask';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './SettlementPanel.module.css';

interface SettlementPanelProps {
  entries: CostEntry[];
  members: Member[];
  /** toast da tela ("Pagamento registrado") */
  onSaved?: (message: string) => void;
  /** estado vazio: abre o "Lançar gasto" em Lançamentos (ajustes-95) */
  onAddExpense: () => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "249,67" — valor do formulário de pagamento já com o total da transferência */
const toInput = (value: number) => value.toFixed(2).replace('.', ',');

/**
 * "Registrar pagamento" (ajustes-90): valor já com o total, editável pra pagamento parcial, e a
 * data de hoje. Não deixa passar do que falta (viraria dívida no sentido contrário).
 */
function PaymentForm({
  transfer,
  members,
  onConfirm,
  onCancel,
}: {
  transfer: Transfer;
  members: Member[];
  onConfirm: (amountBRL: number, dateISO: string) => void;
  onCancel: () => void;
}) {
  const baseId = useId();
  const [amount, setAmount] = useState(toInput(transfer.amountBRL));
  const [dateISO, setDateISO] = useState<string | null>(todayISO());
  const [dateInvalid, setDateInvalid] = useState(false);
  const parsed = parseAmount(amount);
  const tooMuch = parsed !== null && parsed > transfer.amountBRL + 0.005;
  const error =
    amount.trim() !== '' && parsed === null
      ? 'Valor inválido. Ex.: 100 ou 249,67'
      : tooMuch
        ? `Passa do que falta (${formatMoney(transfer.amountBRL, 'BRL')}).`
        : null;
  const canConfirm = parsed !== null && parsed > 0 && !tooMuch && dateISO !== null && !dateInvalid;

  return (
    <div className={styles.paymentForm}>
      <TextField
        id={`${baseId}-amount`}
        label={`Quanto ${memberLabel(members, transfer.from)} pagou (R$)`}
        inputMode="decimal"
        value={amount}
        onChange={setAmount}
        error={error}
        autoComplete="off"
      />
      <DateField
        id={`${baseId}-date`}
        label="Data do pagamento"
        required
        valueISO={dateISO}
        onChange={setDateISO}
        onInvalidChange={setDateInvalid}
      />
      <div className={styles.paymentActions}>
        <Button fullWidth disabled={!canConfirm} onClick={() => canConfirm && onConfirm(Math.round(parsed! * 100) / 100, dateISO!)}>
          Confirmar pagamento
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/**
 * Aba Rateio: saldo de cada membro e as transferências pra acertar as contas (em reais). Desde o
 * ajustes-90 os acertos são pagamentos registrados (`trip.settlements`) que entram no saldo: as
 * transferências mostram só o que FALTA, um gasto novo gera só a diferença e o histórico lista
 * quem pagou o quê, com "Desfazer".
 */
export function SettlementPanel({ entries, members, onSaved, onAddExpense }: SettlementPanelProps) {
  const trip = useTrip();
  const navigate = useNavigate();
  const [payingKey, setPayingKey] = useState<string | null>(null);

  /*
    Sem bloqueio por convidado (ajustes-95): entra no rateio quem aparece em algum gasto ou acerto —
    convidado aceito, com convite pendente ou "Outro". Vazio enquanto nenhum gasto envolve outra pessoa.
  */
  const involved = new Set<string>([YOU]);
  for (const e of entries) {
    if (e.amountBRL === null) continue;
    involved.add(e.paidBy);
    e.splitWith.forEach((id) => involved.add(id));
  }
  for (const st of trip.settlements) {
    involved.add(st.from);
    involved.add(st.to);
  }

  if (involved.size < 2) {
    return (
      <Card asChild className="px-4">
      <div className={styles.invite}>
        <p className={styles.inviteText}>Lance um gasto e diga quem pagou pra ver quem deve pra quem.</p>
        <Button onClick={onAddExpense}>
          <Icon icon={Plus} /> Lançar gasto
        </Button>
        <button type="button" className={styles.inviteLink} onClick={() => navigate('/convidar')}>
          Convidar alguém pra viagem
        </button>
      </div>
      </Card>
    );
  }

  const rateioMembers = members.filter((m) => involved.has(m.id));

  // recalculado a cada render: qualquer mudança em gasto, Central, convidados ou acertos reflete aqui
  const balances = computeBalances(entries, rateioMembers, trip.settlements);
  const transfers = computeTransfers(balances);
  // "Pagou" e "Parte" do cartão são só dos gastos; o acerto aparece no saldo e no histórico
  const spent = new Map(computeBalances(entries, rateioMembers).map((b) => [b.memberId, b]));
  const history = [...trip.settlements].sort((a, b) => b.date.localeCompare(a.date));

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
                <span className={styles.memberMeta}>Pagou {formatMoney(spent.get(b.memberId)?.paidBRL ?? 0, 'BRL')}</span>
                <span className={styles.memberMeta}>
                  {isYou ? 'Sua parte' : `Parte de ${name}`}: {formatMoney(b.shareBRL, 'BRL')}
                </span>
                {/* partes de quem não está marcado no gasto (ajustes-95b): pagas, mas fora do acerto */}
                {b.outsideBRL > 0.005 && (
                  <span className={styles.memberMeta}>
                    Fora do acerto (quem não está no app): {formatMoney(b.outsideBRL, 'BRL')}
                  </span>
                )}
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
            <Icon icon={Check} /> Tudo acertado por enquanto.
          </p>
        ) : (
          <ul className={styles.list}>
            {transfers.map((t) => (
              <Card asChild className="px-4" key={t.key}>
                <li className={styles.transfer}>
                  <p className={styles.transferText}>
                    <Icon icon={HandCoins} />{' '}
                    {memberLabel(members, t.from)} paga {formatMoney(t.amountBRL, 'BRL')} pra{' '}
                    {memberLabel(members, t.to)}
                  </p>
                  {payingKey === t.key ? (
                    <PaymentForm
                      transfer={t}
                      members={members}
                      onCancel={() => setPayingKey(null)}
                      onConfirm={(amountBRL, date) => {
                        trip.addSettlement({
                          id: `acerto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          from: t.from,
                          to: t.to,
                          amountBRL,
                          date,
                        });
                        setPayingKey(null);
                        onSaved?.('Pagamento registrado');
                      }}
                    />
                  ) : (
                    <Button variant="secondary" fullWidth onClick={() => setPayingKey(t.key)}>
                      Registrar pagamento
                    </Button>
                  )}
                </li>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className={styles.block} aria-labelledby="rateio-historico">
          <h3 id="rateio-historico" className={styles.blockTitle}>
            Histórico de acertos
          </h3>
          <ul className={styles.historyList}>
            {history.map((st) => (
              <li key={st.id} className={styles.historyRow}>
                <Icon icon={History} className={styles.historyIcon} />
                <span className={styles.historyText}>
                  {memberLabel(members, st.from)} pagou {formatMoney(st.amountBRL, 'BRL')} pra{' '}
                  {memberLabel(members, st.to)} · {formatISOToDisplay(st.date).slice(0, 5)}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => trip.removeSettlement(st.id)}
                  aria-label={`Desfazer: ${memberLabel(members, st.from)} pagou ${formatMoney(st.amountBRL, 'BRL')} pra ${memberLabel(members, st.to)}`}
                >
                  Desfazer
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={styles.note}>Rateio em reais, pela cotação de {RATES_AS_OF}.</p>
    </div>
  );
}
