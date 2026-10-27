import type { CSSProperties } from 'react';
import { MemberAvatars } from '../shell/MemberAvatars';
import { JoinButton } from '../shell/JoinButton';
import { Icon } from '../shell/Icon';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { placeIllustrationIcon } from '../../utils/categoryVisuals';
import { goersText } from '../../utils/members';
import { placePhotoUrl, type PlaceEntry } from '../../data';
import { YOU, type Member } from '../../utils/costs';
import styles from './GroupPlanCard.module.css';

interface GroupPlanCardProps {
  /** undefined = lugar escrito à mão pelo convidado (sem foto) */
  place: PlaceEntry | undefined;
  title: string;
  /** quem vai (wantersOf) — aqui só convidados, você ainda não */
  wanters: Member[];
  onJoin: () => void;
}

/**
 * Plano de um convidado no dia sugerido do Roteiro (ajustes-95b): referência, não parada — fica
 * fora da divisão de dias, do mapa e da Agenda. "Marina vai" com o avatar e o "+" (o mesmo botão
 * circular de "Escolhas dos convidados"); tocar no "+" faz o lugar virar parada sua.
 */
export function GroupPlanCard({ place, title, wanters, onJoin }: GroupPlanCardProps) {
  const thumb = usePlaceThumbnail(place ? (place.wikiTitle ?? place.name) : '', placePhotoUrl(place));
  const guests = wanters.filter((m) => m.id !== YOU);
  const color = guests[0]?.color;

  return (
    <li className={styles.card} style={color ? ({ '--plan-color': color } as CSSProperties) : undefined}>
      <span className={styles.thumb} aria-hidden="true">
        {thumb ? <img src={thumb} alt="" className={styles.thumbImg} /> : <Icon icon={placeIllustrationIcon(place?.categories)} />}
      </span>
      <div className={styles.text}>
        <p className={styles.name}>{title}</p>
        <p className={styles.meta}>
          <MemberAvatars members={guests} />
          <span>{goersText(wanters, { hint: false })}</span>
        </p>
      </div>
      <JoinButton joined={false} label={`Ir também a ${title}`} onClick={onJoin} />
    </li>
  );
}
