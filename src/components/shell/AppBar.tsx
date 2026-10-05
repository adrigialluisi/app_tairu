import { ArrowLeft, ChevronLeft, House } from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { Icon } from './Icon';
import styles from './AppBar.module.css';

interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Botão de Início no lugar do voltar — só aparece quando não há onBack (que tem prioridade). */
  onHome?: () => void;
}

export function AppBar({ title, subtitle, onBack, onHome }: AppBarProps) {
  const { platform } = usePlatform();

  return (
    <header className={styles.bar}>
      {onBack ? (
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Voltar"
        >
          <Icon icon={platform === 'ios' ? ChevronLeft : ArrowLeft} />
        </button>
      ) : onHome ? (
        <button type="button" className={styles.backButton} onClick={onHome} aria-label="Ir pra Início">
          <Icon icon={House} />
        </button>
      ) : (
        platform === 'ios' && <span className={styles.spacer} aria-hidden="true" />
      )}
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {platform === 'ios' && <span className={styles.spacer} aria-hidden="true" />}
    </header>
  );
}
