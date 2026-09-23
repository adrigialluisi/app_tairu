import type { KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: string;
  /** glyph/emoji opcional — só usado quando iconOnly */
  icon?: string;
  /** só usado com variant="pill-date": linha de cima do pill (ex.: mês abreviado) */
  pillTop?: string;
  /** só usado com variant="pill-date": linha de baixo do pill (ex.: número do dia) */
  pillBottom?: string;
}

interface TabsProps {
  /** prefixo único de id, pra não colidir quando há mais de um Tabs na mesma tela */
  name: string;
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** quando true, mostra só o icon de cada item (label vira texto oculto + title) */
  iconOnly?: boolean;
  /** 'segmented' (padrão, visual atual) ou 'pill-date' (pills de duas linhas, rolagem horizontal) */
  variant?: 'segmented' | 'pill-date';
}

export function Tabs({ name, items, value, onChange, label, iconOnly = false, variant = 'segmented' }: TabsProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + delta + items.length) % items.length;
    onChange(items[nextIndex].value);
    const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
    (buttons?.[nextIndex] as HTMLButtonElement | undefined)?.focus();
  }

  return (
    <div
      className={`${styles.tablist} ${variant === 'pill-date' ? styles.tablistPillDate : ''}`}
      role="tablist"
      aria-label={label}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${name}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${name}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            title={iconOnly && item.icon ? item.label : undefined}
            className={`${styles.tab} ${variant === 'pill-date' ? styles.tabPillDate : ''} ${selected ? styles.tabSelected : ''}`}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {variant === 'pill-date' && item.pillTop && item.pillBottom ? (
              <>
                <span className={styles.pillTop} aria-hidden="true">{item.pillTop}</span>
                <span className={styles.pillBottom} aria-hidden="true">{item.pillBottom}</span>
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : iconOnly && item.icon ? (
              <>
                <span aria-hidden="true">{item.icon}</span>
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        );
      })}
    </div>
  );
}
