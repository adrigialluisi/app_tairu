import { cn } from '@/lib/utils';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { currencies, getCurrency } from '../../data';
import styles from './CurrencySelect.module.css';

interface CurrencySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
  /** mostra o rótulo visível acima (padrão: só pra leitor de tela, como no campo de custo) */
  showLabel?: boolean;
  /** ocupa a largura do container (ex.: De/Para do conversor) */
  fullWidth?: boolean;
}

/*
  Miolo: Native Select do shadcn (docs/ajustes-71-...md) — continua um <select>
  nativo, então no celular abre a roda do sistema. Visual do ajuste 72: 44px,
  rounded-md, borda stone-500, fundo branco.
  O texto à mostra no campo fechado é um <span> por cima do <select> (que fica com o texto transparente):
  código + nome curto quando cabe, só o código quando o campo é estreito (container query no CSS) — ver
  docs/ajustes-70-...md, 2.1. A lista que abre continua com o nome completo, e o leitor de tela lê o
  <option> selecionado, também completo.
*/
export function CurrencySelect({ id, label, value, onChange, showLabel = false, fullWidth = false }: CurrencySelectProps) {
  const shortName = getCurrency(value)?.name.split(' ')[0];
  const select = (
    <div className={cn(styles.wrap, 'relative min-w-22', fullWidth ? 'flex w-full' : 'inline-flex')}>
      {!showLabel && (
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
      )}
      <NativeSelect
        id={id}
        className="w-full [&_svg]:right-3"
        selectClassName={cn(
          'h-11 rounded-md border-input bg-background pr-9 pl-3 text-(length:--text-base) text-transparent',
          // foco igual ao TextField: borda bordô + anel 2px bordô/20%
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {currencies.map((c) => (
          <NativeSelectOption key={c.code} value={c.code}>
            {c.code} · {c.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <span className={styles.display} aria-hidden="true">
        {value}
        {shortName && <span className={styles.shortName}> · {shortName}</span>}
      </span>
    </div>
  );

  if (!showLabel) return select;
  return (
    <div className="flex min-w-0 flex-col gap-(--space-label)">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {select}
    </div>
  );
}
