import { Check, Plus } from 'lucide-react';
import { Button } from './Button';
import { Icon } from './Icon';
import styles from './JoinButton.module.css';

/**
 * "+" (ir também) / ✓ (você vai — tocar desfaz) dos planos do grupo: mesmo botão circular do
 * PlaceCard, menor. Usado em "Escolhas dos convidados", no bloco "Planos do grupo" e na parada do
 * Roteiro que veio de um convidado (ajustes-95/95b).
 */
export function JoinButton({ joined, onClick, label }: { joined: boolean; onClick: () => void; label: string }) {
  return (
    <Button
      variant={joined ? 'primary' : 'secondary'}
      iconOnly
      className={styles.join}
      aria-pressed={joined}
      aria-label={label}
      onClick={onClick}
    >
      <Icon icon={joined ? Check : Plus} />
    </Button>
  );
}
