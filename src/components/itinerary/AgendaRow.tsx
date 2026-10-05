import type { ReactNode } from 'react';
import type { AgendaItem } from '../../utils/agenda';
import { Icon } from '../shell/Icon';
import styles from './AgendaRow.module.css';

interface AgendaRowProps {
  item: AgendaItem;
  isLast: boolean;
  /** leva pra origem do item (Central na aba certa, ou Sugestões) */
  onOpen: () => void;
  /** "abrir na Central" / "ver nas Sugestões" — só pra leitor de tela */
  openHint: string;
  /** "21/11" — só no card "Fora das datas da viagem", onde cada linha precisa dizer a data */
  dateLabel?: string;
  /** ação secundária à direita (ex.: "Remover" do evento) */
  action?: ReactNode;
  /** faixa embaixo da linha, alinhada com o título (ex.: fotos do evento, ajustes-75) */
  below?: ReactNode;
}

/** Linha compacta da "Agenda do dia": hora · ícone · título/subtítulo, com conectora entre os ícones. */
export function AgendaRow({ item, isLast, onOpen, openHint, dateLabel, action, below }: AgendaRowProps) {
  return (
    <li className={`${styles.row} ${isLast ? styles.rowLast : ''}`}>
      <button type="button" className={styles.main} onClick={onOpen}>
        <span className={styles.time}>
          {dateLabel && <span className={styles.date}>{dateLabel}</span>}
          {item.time || <span aria-label="sem hora">—</span>}
        </span>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={item.icon} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{item.title}</span>
          {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
          <span className="visually-hidden"> — {openHint}</span>
        </span>
      </button>
      {action && <div className={styles.action}>{action}</div>}
      {below && <div className={styles.below}>{below}</div>}
    </li>
  );
}
