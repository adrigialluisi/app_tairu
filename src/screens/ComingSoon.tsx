import type { ReactNode } from 'react';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import styles from './ComingSoon.module.css';

interface ComingSoonProps {
  title?: string;
  headerSubtitle?: string;
  message?: string;
  onBack?: () => void;
  onHome?: () => void;
  bottomNav?: ReactNode;
}

export function ComingSoon({
  title = 'Em construção',
  headerSubtitle,
  message = 'Essa seção ainda não foi desenhada nesse bloco do protótipo.',
  onBack,
  onHome,
  bottomNav,
}: ComingSoonProps) {
  return (
    <ScreenShell appBar={<AppBar title={title} subtitle={headerSubtitle} onBack={onBack} onHome={onHome} />} bottomNav={bottomNav}>
      <div className={styles.wrap}>
        <span className={styles.icon} aria-hidden="true">
          🚧
        </span>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{message}</p>
      </div>
    </ScreenShell>
  );
}
