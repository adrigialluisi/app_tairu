import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import styles from './SuggestionCard.module.css';

interface SuggestionCardProps {
  message: string;
  actionLabel: string;
  to: string;
  storageKey: string;
}

/**
 * Card de sugestão de próximo passo — dispensável, nunca bloqueia nada
 * (ver docs/ajustes-22-trilha-progresso-e-salvo.md). `storageKey` não tem
 * persistência real: identifica a sugestão só pro aria-label do botão de
 * dispensar; dispensar vale só pra visita atual à tela. Ação principal é
 * um botão de verdade (não mais um link de texto — ver
 * docs/ajustes-36-suggestion-card-vira-botao.md).
 */
export function SuggestionCard({ message, actionLabel, to, storageKey }: SuggestionCardProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={styles.card} role="status">
      <div className={styles.header}>
        <p className={styles.message}>{message}</p>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label={`Dispensar sugestão: ${storageKey}`}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <Button onClick={() => navigate(to)}>
        {actionLabel}
      </Button>
    </div>
  );
}
