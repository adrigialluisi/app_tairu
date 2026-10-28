import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AgendaItem } from '../../utils/agenda';
import { Icon } from '../shell/Icon';
import styles from './AgendaRow.module.css';

interface AgendaRowProps {
  item: AgendaItem;
  isLast: boolean;
  /**
   * leva pra origem do item (Central na aba certa). Sem ele, a linha não é tocável: o evento escolhido
   * já está na agenda e tem as próprias ações embaixo (Foto, Gasto, Alterar — ajustes-101b)
   */
  onOpen?: () => void;
  /** "abrir na Central" — só pra leitor de tela */
  openHint?: string;
  /** "21/11" — só no card "Fora das datas da viagem", onde cada linha precisa dizer a data */
  dateLabel?: string;
  /** ação secundária à direita (ex.: "Remover" do evento) */
  action?: ReactNode;
  /** faixa embaixo da linha, alinhada com o título (ex.: fotos do evento, ajustes-75) */
  below?: ReactNode;
  /**
   * faixa embaixo com a largura toda da linha, sem o recuo do título — as ações Foto · Gasto ·
   * Alterar do evento (ajustes-101b) não cabiam no recuo num celular de 360px
   */
  belowFullWidth?: boolean;
  /** selo de alerta "Conflita com o voo das 14:00" (ajustes-94) — âmbar --warning, 5.89:1, com ícone */
  warning?: string;
}

/** a parte principal da linha: botão quando leva a algum lugar, senão só o conteúdo */
function Main({ className, onOpen, children }: { className: string; onOpen?: () => void; children: ReactNode }) {
  return onOpen ? (
    <button type="button" className={className} onClick={onOpen}>
      {children}
    </button>
  ) : (
    <div className={`${className} ${styles.mainStatic}`}>{children}</div>
  );
}

/** Linha compacta da "Agenda do dia": hora · ícone · título/subtítulo, com conectora entre os ícones. */
export function AgendaRow({ item, isLast, onOpen, openHint, dateLabel, action, below, belowFullWidth = false, warning }: AgendaRowProps) {
  return (
    <li className={`${styles.row} ${isLast ? styles.rowLast : ''}`}>
      <Main className={styles.main} onOpen={onOpen}>
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
          {warning && (
            <span className="mt-1 inline-flex items-start gap-1 text-(length:--text-sm) font-medium text-warning">
              <Icon icon={TriangleAlert} className="mt-0.5" /> {warning}
            </span>
          )}
          {openHint && <span className="visually-hidden"> — {openHint}</span>}
        </span>
      </Main>
      {action && <div className={styles.action}>{action}</div>}
      {below && <div className={`${styles.below} ${belowFullWidth ? styles.belowFull : ''}`}>{below}</div>}
    </li>
  );
}
