import { lazy, Suspense } from 'react';
import { TriangleAlert, Wallet } from 'lucide-react';
import { CATEGORY_META, EXPENSE_CATEGORIES, type CostEntry } from '../../utils/costs';
import { RATES_AS_OF, RATES_SOURCE_LABEL, formatMoney } from '../../utils/money';
import { EmptyState } from '../shell/EmptyState';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './CostSummary.module.css';

// Recharts é pesado: o gráfico vem num pedaço separado do bundle, carregado só quando Custos tem gasto
const CostCategoryChart = lazy(() => import('./CostCategoryChart'));

interface CostSummaryProps {
  entries: CostEntry[];
  memberCount: number;
}

/** Card do topo de Custos: total em reais, por pessoa, barra por categoria e de onde vem a cotação. */
export function CostSummary({ entries, memberCount }: CostSummaryProps) {
  if (entries.length === 0) {
    return (
      <EmptyState icon={<Wallet />}>
        Nenhum gasto ainda. Os valores que você colocar na Central aparecem aqui sozinhos, e você pode lançar outros
        gastos.
      </EmptyState>
    );
  }

  const converted = entries.filter((e) => e.amountBRL !== null);
  const total = converted.reduce((sum, e) => sum + (e.amountBRL as number), 0);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c,
    value: converted.filter((e) => e.category === c).reduce((sum, e) => sum + (e.amountBRL as number), 0),
  })).filter((c) => c.value > 0);

  const missingByCurrency = new Map<string, number>();
  for (const e of entries) {
    if (e.amountBRL === null) missingByCurrency.set(e.currencyCode, (missingByCurrency.get(e.currencyCode) ?? 0) + 1);
  }
  const hasConversion = converted.some((e) => e.currencyCode !== 'BRL');

  return (
    <Card className={`px-4 ${styles.card}`}>
      <div className={styles.totalBlock}>
        <span className={styles.totalLabel}>Total da viagem</span>
        <span className={styles.total}>{formatMoney(total, 'BRL')}</span>
        {memberCount > 1 && (
          <span className={styles.perPerson}>≈ {formatMoney(total / memberCount, 'BRL')} por pessoa</span>
        )}
      </div>

      {total > 0 && (
        <>
          {/* enquanto o gráfico carrega, o trilho vazio segura o lugar (sem pulo de layout) */}
          <Suspense fallback={<div className={styles.bar} aria-hidden="true" />}>
            <CostCategoryChart byCategory={byCategory} total={total} />
          </Suspense>
          <ul className={styles.legend} aria-label="Gastos por categoria">
            {byCategory.map((c) => (
              <li key={c.category} className={styles.legendItem}>
                <span
                  className={styles.swatch}
                  style={{ background: CATEGORY_META[c.category].color }}
                  aria-hidden="true"
                />
                <span aria-hidden="true"><Icon icon={CATEGORY_META[c.category].icon} /></span>
                <span className={styles.legendLabel}>{CATEGORY_META[c.category].label}</span>
                <span className={styles.legendValue}>{formatMoney(c.value, 'BRL')}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasConversion && (
        <p className={styles.note}>
          Valores convertidos pra real com a cotação de {RATES_AS_OF} ({RATES_SOURCE_LABEL}).
        </p>
      )}
      {[...missingByCurrency].map(([code, n]) => (
        <p key={code} className={styles.note}>
          <Icon icon={TriangleAlert} /> {n} {n === 1 ? 'gasto' : 'gastos'} em {code}{' '}
          {n === 1 ? 'ficou' : 'ficaram'} fora do total (sem cotação).
        </p>
      ))}
    </Card>
  );
}
