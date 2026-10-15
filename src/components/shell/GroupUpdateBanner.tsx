import { useEffect, useState } from 'react';
import styles from './GroupUpdateBanner.module.css';

/** quanto o banner fica na tela (ajustes-89) */
const VISIBLE_MS = 5000;
/** última simulação já anunciada — voltar pra Início não repete o banner */
let lastShownSeq = 0;

interface GroupUpdateBannerProps {
  notice: { seq: number; message: string } | null;
  /** tocar no banner: rola até o bloco "Novidades na viagem" */
  onOpen: () => void;
}

/**
 * Banner estilo notificação do celular (ajustes-89), no topo da Início, depois do "Simular: 2 dias
 * depois": ícone do Tairu + "Marina e Rodrigo entraram na viagem e adicionaram…". Some sozinho em
 * ~5 s; anunciado pro leitor de tela (role="status"). --text no branco: 17.49:1.
 */
export function GroupUpdateBanner({ notice, onOpen }: GroupUpdateBannerProps) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!notice || notice.seq <= lastShownSeq) return;
    lastShownSeq = notice.seq;
    setMessage(notice.message);
    const timer = setTimeout(() => setMessage(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div role="status" className={styles.slot}>
      {message && (
        <button
          type="button"
          className={styles.banner}
          onClick={() => {
            setMessage(null);
            onOpen();
          }}
        >
          <img src={`${import.meta.env.BASE_URL}logo/LogoTairu.svg`} alt="" className={styles.icon} />
          <span className={styles.text}>
            <span className={styles.app}>Tairu · agora</span>
            <span className={styles.message}>{message}</span>
          </span>
        </button>
      )}
    </div>
  );
}
