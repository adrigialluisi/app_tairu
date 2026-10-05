import { ArrowUpDown, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { CurrencySelect } from '../inputs/CurrencySelect';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import {
  RATES_AS_OF,
  RATES_SOURCE_LABEL,
  convert,
  formatMoney,
  formatRate,
  hasRate,
  parseAmount,
  unitsPerBRL,
} from '../../utils/money';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import styles from './CurrencyConverter.module.css';

interface CurrencyConverterProps {
  initialFrom: string;
  /** moedas dos destinos da viagem, sem repetir, + BRL */
  tripCurrencies: string[];
  onLaunchExpense: (amount: string, currencyCode: string) => void;
}

/** Escala da tabela de referência pela "força" da moeda De (quantas unidades valem 1 real). */
function referenceAmounts(currencyCode: string): number[] {
  const units = unitsPerBRL(currencyCode) ?? 1;
  if (units > 100) return [1000, 5000, 10000, 50000];
  if (units >= 10) return [100, 500, 1000, 5000];
  return [10, 50, 100, 500];
}

/**
 * Conversor de moedas — ferramenta de apoio independente (aba Conversor de
 * Custos), com a mesma cotação fixa de exchangeRates.json. Ver
 * docs/ajustes-62-conversor-de-moedas.md.
 */
export function CurrencyConverter({ initialFrom, tripCurrencies, onLaunchExpense }: CurrencyConverterProps) {
  const baseId = useId();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(() =>
    initialFrom === 'BRL' ? (tripCurrencies.find((c) => c !== 'BRL') ?? 'BRL') : 'BRL',
  );

  const parsed = parseAmount(amount);
  const amountError = amount.trim() !== '' && parsed === null ? 'Valor inválido. Ex.: 10000 ou 85,50' : null;
  const missing = [from, to].find((c) => !hasRate(c));
  const result = parsed !== null ? convert(parsed, from, to) : null;
  const unit = convert(1, from, to);
  const inverse = convert(1, to, from);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className={styles.converter}>
      <TextField
        id={`${baseId}-amount`}
        label="Valor"
        placeholder="Ex.: 10000"
        inputMode="decimal"
        value={amount}
        onChange={setAmount}
        error={amountError}
        autoComplete="off"
      />

      <div className={styles.group}>
        <div className={styles.pairRow}>
          <CurrencySelect id={`${baseId}-from`} label="De" value={from} onChange={setFrom} showLabel fullWidth />
          <Button variant="secondary" iconOnly className={styles.swap} aria-label="Inverter moedas" onClick={swap}>
            <Icon icon={ArrowUpDown} />
          </Button>
          <CurrencySelect id={`${baseId}-to`} label="Para" value={to} onChange={setTo} showLabel fullWidth />
        </div>

        {tripCurrencies.length > 1 && (
          <OptionChipGroup
            legend="Moedas da viagem"
            options={tripCurrencies.map((c) => ({ value: c, label: c }))}
            value={tripCurrencies.includes(from) ? from : null}
            onChange={setFrom}
          />
        )}
      </div>

      <Card className={`px-4 ${styles.result}`} aria-live="polite">
        {missing ? (
          <p className={styles.missing}>
            <Icon icon={TriangleAlert} /> Sem cotação pra {missing} no protótipo.
          </p>
        ) : (
          <>
            {result !== null && parsed !== null && (
              <>
                <span className={styles.resultFrom}>{formatMoney(parsed, from)} =</span>
                <span className={styles.resultValue}>{formatMoney(result, to)}</span>
              </>
            )}
            {unit !== null && inverse !== null && (
              <span className={styles.rate}>
                1 {from} = {formatRate(unit, to)} · 1 {to} = {formatRate(inverse)} {from}
              </span>
            )}
          </>
        )}
      </Card>

      {!missing && from !== to && (
        // Table do shadcn num Card (docs/ajustes-74-...md): a legenda é o título do cartão,
        // números à direita com tabular-nums pra as casas decimais ficarem alinhadas
        <Card className="gap-0 py-0">
          <Table className="tabular-nums">
            <TableCaption className="mt-0 px-4 pt-4 pb-2 text-left text-(length:--text-lg) font-semibold text-foreground caption-top">
              Valores de referência
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  scope="col"
                  className="h-10 px-4 text-right text-(length:--text-sm) font-normal text-muted-foreground"
                >
                  {from}
                </TableHead>
                <TableHead
                  scope="col"
                  className="h-10 px-4 text-right text-(length:--text-sm) font-normal text-muted-foreground"
                >
                  {to}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referenceAmounts(from).map((n) => (
                <TableRow key={n} className="hover:bg-transparent">
                  <TableCell className="px-4 py-2.5 text-right text-(length:--text-base)">{formatMoney(n, from)}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-(length:--text-base)">
                    {formatMoney(convert(n, from, to) as number, to)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Button
        variant="secondary"
        fullWidth
        disabled={parsed === null || parsed <= 0}
        onClick={() => onLaunchExpense(amount, from)}
      >
        Lançar como gasto
      </Button>

      <p className={styles.footnote}>
        Cotação de {RATES_AS_OF} ({RATES_SOURCE_LABEL}). Pode variar na hora da compra.
      </p>
    </div>
  );
}
