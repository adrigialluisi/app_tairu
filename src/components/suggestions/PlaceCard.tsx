import { Check, MapPin, Plus } from 'lucide-react';
import { Button } from '../shell/Button';
import { MemberAvatars } from '../shell/MemberAvatars';
import type { Member } from '../../utils/costs';
import { wantersText } from '../../utils/members';
import { CategoryTags } from './CategoryTags';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { categoryIcon, placeIllustrationIcon } from '../../utils/categoryVisuals';
import { INTEREST_LABELS, type PlaceEntry } from '../../data';
import type { QuizInterest } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
  place: PlaceEntry;
  selected: boolean;
  onToggle: () => void;
  /** quem do grupo quer esse lugar (ajustes-67) — só mostra se tiver alguém além de você */
  wanters?: Member[];
}

/** Card de lugar do carrossel de Sugestões (substitui o antigo PlaceRow em lista). */
export function PlaceCard({ place, selected, onToggle, wanters = [] }: PlaceCardProps) {
  const thumbnailUrl = usePlaceThumbnail(place.wikiTitle ?? place.name);
  const tags = place.categories.map((c) => ({
    key: c,
    icon: categoryIcon(c),
    label: INTEREST_LABELS[c as QuizInterest] ?? c,
  }));

  return (
    <Card asChild className="gap-0 py-0">
    <article className={`${styles.card} ${selected ? styles.cardSelected : ''}`}>
      <div className={styles.photoArea}>
        <div className={styles.photoClip}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" loading="lazy" className={styles.photo} />
          ) : (
            <span className={styles.photoFallback} aria-hidden="true">
              <Icon icon={placeIllustrationIcon(place.categories)} />
            </span>
          )}
        </div>
        <Button
          variant={selected ? 'primary' : 'secondary'}
          iconOnly
          className={styles.toggle}
          aria-pressed={selected}
          aria-label={`${selected ? 'Remover' : 'Adicionar'} ${place.name} ${selected ? 'do' : 'ao'} roteiro`}
          onClick={onToggle}
        >
          <Icon icon={selected ? Check : Plus} />
        </Button>
      </div>
      <div className={styles.body}>
        <h4 className={styles.name}>{place.name}</h4>
        {place.neighborhood && (
          <p className={styles.neighborhood}>
            <Icon icon={MapPin} /> {place.neighborhood}
          </p>
        )}
        {wantersText(wanters) && (
          <p className={styles.wanters}>
            <MemberAvatars members={wanters} />
            <span>{wantersText(wanters)}</span>
          </p>
        )}
        <CategoryTags tags={tags} />
      </div>
    </article>
    </Card>
  );
}
