import { usePlatform } from '../../context/PlatformContext';
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
  const backGlyph = platform === 'ios' ? '‹' : '←';

  return (
    <header className={styles.bar}>
      {onBack ? (
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Voltar"
        >
          <span aria-hidden="true">{backGlyph}</span>
        </button>
      ) : onHome ? (
        <button type="button" className={styles.backButton} onClick={onHome} aria-label="Ir pra Início">
          <span aria-hidden="true">🏠</span>
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
