import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { BottomNav } from '../components/shell/BottomNav';
import { Button } from '../components/shell/Button';
import { SaveToast } from '../components/shell/SaveToast';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Tabs } from '../components/shell/Tabs';
import { CentralCostForm } from '../components/costs/CentralCostForm';
import { CostSummary } from '../components/costs/CostSummary';
import { CurrencyConverter } from '../components/costs/CurrencyConverter';
import { ExpenseCard } from '../components/costs/ExpenseCard';
import { ExpenseForm } from '../components/costs/ExpenseForm';
import { SettlementPanel } from '../components/costs/SettlementPanel';
import { useTrip } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { buildCostEntries, getMembers, type CostEntry } from '../utils/costs';
import { formatISOToDisplay } from '../utils/dateMask';
import { Icon } from '../components/shell/Icon';
import groupStyles from '../components/central/TransportDestinationGroup.module.css';
import styles from './Costs.module.css';

const TABS_NAME = 'custos-tabs';

type CostsTab = 'lancamentos' | 'rateio' | 'conversor';

/** State aceito na navegação pra cá (ex.: atalho "Abrir conversor" em Dicas locais). */
interface CostsLocationState {
  tab?: 'conversor';
  currencyCode?: string;
}

/** data mais cedo primeiro; sem data no fim, na ordem em que foram lançados */
function byDate(a: CostEntry, b: CostEntry): number {
  if (a.date && b.date) return a.date.localeCompare(b.date);
  if (a.date) return -1;
  if (b.date) return 1;
  return 0;
}

/**
 * Custos (etapa 9 do fluxo, "Controle financeiro com rateio final") — ver
 * docs/ajustes-61-custos-lancamentos-e-rateio.md. Junta gastos lançados à
 * mão com os custos digitados na Central e monta o rateio em reais.
 */
export function Costs() {
  const trip = useTrip();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as CostsLocationState | null) ?? {};
  const { message, visible, show } = useSaveToast();
  const [tab, setTab] = useState<CostsTab>(navState.tab ?? 'lancamentos');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [prefill, setPrefill] = useState<{ amount: string; currencyCode: string } | undefined>(undefined);

  const converterFrom = navState.currencyCode ?? trip.destinations[0]?.currencyCode ?? 'BRL';
  const tripCurrencies = [...new Set([...trip.destinations.map((d) => d.currencyCode), 'BRL'])];

  function handleLaunchFromConverter(amount: string, currencyCode: string) {
    setPrefill({ amount, currencyCode });
    setEditingId('new');
    setTab('lancamentos');
  }

  const members = getMembers(trip);
  const entries = buildCostEntries(trip);
  const destinationIds = new Set(trip.destinations.map((d) => d.id));

  const groups = [
    {
      key: 'viagem',
      title: 'Viagem toda / outros lugares',
      dates: null as string | null,
      items: entries.filter((e) => !e.destinationId || !destinationIds.has(e.destinationId)),
    },
    ...trip.destinations.map((d) => ({
      key: d.id,
      title: `${d.city}, ${d.country}`,
      dates: d.dateStart && d.dateEnd ? `${formatISOToDisplay(d.dateStart)} – ${formatISOToDisplay(d.dateEnd)}` : null,
      items: entries.filter((e) => e.destinationId === d.id),
    })),
  ].filter((g) => g.items.length > 0);

  function handleSaved() {
    setEditingId(null);
    setPrefill(undefined);
    show('Gasto salvo');
  }

  function renderEntry(entry: CostEntry) {
    if (editingId !== entry.id) {
      return <ExpenseCard key={entry.id} entry={entry} members={members} onEdit={() => setEditingId(entry.id)} />;
    }
    if (entry.origin === 'central') {
      return (
        <CentralCostForm
          key={entry.id}
          entry={entry}
          members={members}
          onSave={(override) => {
            trip.saveCentralCostOverride(override);
            handleSaved();
          }}
        />
      );
    }
    const expense = trip.expenses.find((e) => e.id === entry.id) ?? null;
    return (
      <ExpenseForm
        key={entry.id}
        destinations={trip.destinations}
        members={members}
        initialExpense={expense}
        onSave={(updated) => {
          trip.saveExpense(updated);
          handleSaved();
        }}
        onRemove={() => {
          trip.removeExpense(entry.id);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Custos da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={<BottomNav />}
      toast={<SaveToast visible={visible} message={message} />}
    >
      <CostSummary entries={entries} memberCount={members.length} />

      <div className={styles.tabsBlock}>
        <Tabs
          name={TABS_NAME}
          label="Seções de custos"
          items={[
            { value: 'lancamentos', label: 'Lançamentos' },
            { value: 'rateio', label: 'Rateio' },
            { value: 'conversor', label: 'Conversor' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />

        {tab === 'lancamentos' && (
          <div
            role="tabpanel"
            id={`${TABS_NAME}-panel-lancamentos`}
            aria-labelledby={`${TABS_NAME}-tab-lancamentos`}
            className={styles.panel}
          >
            {editingId === 'new' ? (
              <ExpenseForm
                key={prefill ? `new-${prefill.amount}-${prefill.currencyCode}` : 'new'}
                destinations={trip.destinations}
                members={members}
                initialExpense={null}
                prefill={prefill}
                onSave={(expense) => {
                  trip.saveExpense(expense);
                  handleSaved();
                }}
              />
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setPrefill(undefined);
                  setEditingId('new');
                }}
              >
                <Icon icon={Plus} /> Lançar gasto
              </Button>
            )}

            {groups.map((g) => (
              <div key={g.key} className={groupStyles.group}>
                <div className={groupStyles.header}>
                  <h3 className={groupStyles.title}>{g.title}</h3>
                  {g.dates && <span className={groupStyles.dates}>{g.dates}</span>}
                </div>
                {[...g.items].sort(byDate).map(renderEntry)}
              </div>
            ))}
          </div>
        )}

        {tab === 'rateio' && (
          <div
            role="tabpanel"
            id={`${TABS_NAME}-panel-rateio`}
            aria-labelledby={`${TABS_NAME}-tab-rateio`}
            className={styles.panel}
          >
            <SettlementPanel entries={entries} members={members} />
          </div>
        )}

        {tab === 'conversor' && (
          <div
            role="tabpanel"
            id={`${TABS_NAME}-panel-conversor`}
            aria-labelledby={`${TABS_NAME}-tab-conversor`}
            className={styles.panel}
          >
            <CurrencyConverter
              initialFrom={converterFrom}
              tripCurrencies={tripCurrencies}
              onLaunchExpense={handleLaunchFromConverter}
            />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
