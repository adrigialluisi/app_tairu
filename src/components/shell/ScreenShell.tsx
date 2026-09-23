import type { ReactNode } from 'react';
import styles from './ScreenShell.module.css';

interface ScreenShellProps {
  appBar?: ReactNode;
  bottomNav?: ReactNode;
  footer?: ReactNode;
  toast?: ReactNode;
  children: ReactNode;
}

export function ScreenShell({ appBar, bottomNav, footer, toast, children }: ScreenShellProps) {
  return (
    <div className={styles.screen}>
      {appBar}
      <div className={styles.sheet}>
        <main className={styles.content}>{children}</main>
        {footer && <footer className={styles.footer}>{footer}</footer>}
        {toast}
      </div>
      {bottomNav}
    </div>
  );
}
