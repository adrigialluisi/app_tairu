import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import styles from './EmptyTripState.module.css';

interface EmptyTripStateProps {
  message: string;
}

/**
 * Rede de segurança visual (ver docs/ajustes-08-estado-vazio-lugares-roteiro.md):
 * como o estado é só em memória, um refresh de página ou navegação direta
 * pra /roteiro sem nenhum destino cadastrado ainda zeraria o estado — em
 * vez de renderizar abas/seções vazias e confusas, mostra isso no lugar.
 */
export function EmptyTripState({ message }: EmptyTripStateProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <p className={styles.message}>{message}</p>
      <Button variant="primary" fullWidth onClick={() => navigate('/destinos')}>
        Ir pra Destinos
      </Button>
    </div>
  );
}
