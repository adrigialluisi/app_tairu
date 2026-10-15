import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';
import { placeIllustrationIcon } from '../../utils/categoryVisuals';
import type { TripPlaceSelection } from '../../context/TripContext';
import styles from './AddedPlaceCard.module.css';

/**
 * Cartão simples da seção "Adicionados" (ajustes-87): lugar que você escreveu na busca do topo,
 * sem foto nem dados da base — ícone, nome e remover.
 */
export function AddedPlaceCard({ selection, id, onRemove }: { selection: TripPlaceSelection; id: string; onRemove: () => void }) {
  return (
    <Card asChild className="gap-0 py-0">
      <article id={id} className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={placeIllustrationIcon(selection.categories)} />
        </span>
        <h4 className={styles.name}>{selection.customLabel}</h4>
        <Button variant="secondary" fullWidth onClick={onRemove} aria-label={`Remover ${selection.customLabel}`}>
          <Icon icon={Trash2} /> Remover
        </Button>
      </article>
    </Card>
  );
}
