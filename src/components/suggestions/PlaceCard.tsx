import { Check, MapPin, Plus } from 'lucide-react';
import { Button } from '../shell/Button';
import { MemberAvatars } from '../shell/MemberAvatars';
import { YOU, type Member } from '../../utils/costs';
import { wantersText } from '../../utils/members';
import { CategoryTags } from './CategoryTags';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { categoryIcon, placeIllustrationIcon } from '../../utils/categoryVisuals';
import { INTEREST_LABELS, placePhotoUrl, type PlaceEntry } from '../../data';
import type { QuizInterest } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { NewBadge } from '../shell/NewBadge';
import { Card } from '@/components/ui/card';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
  place: PlaceEntry;
  /** você escolheu (adicionou, ou tocou "Eu também") — ✓ bordô */
  selected: boolean;
  onToggle: () => void;
  /** quem do grupo quer esse lugar (ajustes-67) — só mostra se tiver alguém além de você */
  wanters?: Member[];
  /** "Eu também": entra num lugar que só convidados escolheram (ajustes-87) */
  onJoin?: () => void;
  /** id do cartão, pra busca do topo e lista de convidados rolarem até ele */
  id?: string;
  /** sugerido por convidado na simulação "2 dias depois" e ainda não visto (ajustes-89) */
  isNew?: boolean;
}

/**
 * Card de lugar do carrossel de Sugestões (substitui o antigo PlaceRow em lista). Três estados
 * (ajustes-87): ninguém escolheu → "+"; só convidados escolheram → selo "Selecionado pelo grupo"
 * no canto da foto, borda neutra, sem ✓, e o botão "Eu também"; você escolheu → ✓ bordô (com os
 * avatares de quem mais quer: "Você e Marina querem ir").
 */
export function PlaceCard({ place, selected, onToggle, wanters = [], onJoin, id, isNew = false }: PlaceCardProps) {
  const thumbnailUrl = usePlaceThumbnail(place.wikiTitle ?? place.name, placePhotoUrl(place));
  const tags = place.categories.map((c) => ({
    key: c,
    icon: categoryIcon(c),
    label: INTEREST_LABELS[c as QuizInterest] ?? c,
  }));
  const guests = wanters.filter((m) => m.id !== YOU);
  const byGroupOnly = !selected && guests.length > 0;

  return (
    <Card asChild className="gap-0 py-0">
    <article id={id} className={`${styles.card} ${selected ? styles.cardSelected : ''}`}>
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
        {byGroupOnly ? (
          <span className={styles.groupBadge}>
            <MemberAvatars members={guests} />
            Selecionado pelo grupo
          </span>
        ) : (
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
        )}
      </div>
      <div className={styles.body}>
        {isNew && <NewBadge className="self-start" />}
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
        {byGroupOnly && onJoin && (
          <Button
            variant="secondary"
            fullWidth
            className={styles.join}
            aria-label={`Eu também quero ir a ${place.name}`}
            onClick={onJoin}
          >
            <Icon icon={Plus} /> Eu também
          </Button>
        )}
      </div>
    </article>
    </Card>
  );
}
