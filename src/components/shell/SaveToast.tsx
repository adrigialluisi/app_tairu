import styles from './SaveToast.module.css';

interface SaveToastProps {
  visible: boolean;
  message: string;
}

/**
 * Confirmação leve de "isso já foi salvo" — não existe botão "Salvar" de
 * verdade nesse protótipo, tudo grava no TripContext no momento em que a
 * pessoa digita/seleciona; este toast só dá o feedback visual disso (ver
 * docs/ajustes-22-trilha-progresso-e-salvo.md). Usado junto com o hook
 * useSaveToast, que controla timing/duração.
 */
export function SaveToast({ visible, message }: SaveToastProps) {
  return (
    <div className={styles.toast} data-visible={visible} role="status" aria-live="polite">
      <span aria-hidden="true">✓</span> {message}
    </div>
  );
}
