import { Check, ChevronRight } from 'lucide-react';
import { MemberAvatars } from '../shell/MemberAvatars';
import { Icon } from '../shell/Icon';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { INTEREST_LABELS, placePhotoUrl, type PlaceEntry } from '../../data';
import type { QuizInterest } from '../../context/TripContext';
import { YOU, type Member } from '../../utils/costs';
import { joinPt } from '../../utils/retrospective';
import { placeIllustrationIcon } from '../../utils/categoryVisuals';
import styles from './GuestChoicesList.module.css';

export interface GuestChoice {
  place: PlaceEntry;
  /** quem quer o lugar, "Você" primeiro (wantersOf) */
  wanters: Member[];
  /** você também escolheu — mesmo estado do cartão na categoria */
  mine: boolean;
  /** id do cartão do lugar na categoria dele */
  cardId: string;
}

/**
 * "Escolhas dos convidados" em formato compacto (ajustes-87): uma linha por lugar — miniatura,
 * nome, quem escolheu e categoria — que leva até o cartão do lugar na categoria dele. É só
 * atalho: não tem botão de marcar, pra o ✓ nunca acender em dois lugares (problema do ajuste 73).
 */
export function GuestChoicesList({ choices, onOpen }: { choices: GuestChoice[]; onOpen: (cardId: string) => void }) {
  return (
    <ul className={styles.list}>
      {choices.map((c) => (
        <li key={c.place.id}>
          <GuestChoiceRow choice={c} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function GuestChoiceRow({ choice, onOpen }: { choice: GuestChoice; onOpen: (cardId: string) => void }) {
  const { place, wanters, mine, cardId } = choice;
  const thumb = usePlaceThumbnail(place.wikiTitle ?? place.name, placePhotoUrl(place));
  const guests = wanters.filter((m) => m.id !== YOU);
  const category = INTEREST_LABELS[place.categories[0] as QuizInterest] ?? place.categories[0];

  return (
    <button type="button" className={styles.row} onClick={() => onOpen(cardId)}>
      <span className={styles.thumb} aria-hidden="true">
        {thumb ? <img src={thumb} alt="" className={styles.thumbImg} /> : <Icon icon={placeIllustrationIcon(place.categories)} />}
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{place.name}</span>
        <span className={styles.meta}>
          <MemberAvatars members={guests} />
          <span className={styles.metaText}>
            {joinPt(guests.map((m) => m.shortName))}
            {category && ` · ${category}`}
          </span>
        </span>
        {mine ? (
          <span className={styles.statusMine}>
            <Icon icon={Check} /> Você também quer ir
          </span>
        ) : (
          <span className={styles.status}>Selecionado pelo grupo</span>
        )}
      </span>
      <Icon icon={ChevronRight} className={styles.chevron} />
    </button>
  );
}
