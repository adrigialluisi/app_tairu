import { CalendarDays, MapPin } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { MemberAvatars } from '../shell/MemberAvatars';
import { MemberTag } from '../shell/MemberTag';
import { memberTint } from '../../utils/memberColors';
import { YOU, type Member } from '../../utils/costs';
import { goersText } from '../../utils/members';
import { CategoryTags } from './CategoryTags';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { categoryIcon, placeIllustrationIcon } from '../../utils/categoryVisuals';
import { INTEREST_LABELS, placePhotoUrl, type PlaceEntry } from '../../data';
import type { QuizInterest } from '../../context/TripContext';
import { Icon } from '../shell/Icon';
import { NewBadge } from '../shell/NewBadge';
import { Card } from '@/components/ui/card';
import { openDaysLabel } from '../../utils/openDays';
import styles from './PlaceCard.module.css';

interface PlaceCardProps {
  place: PlaceEntry;
  /** está na sua agenda — borda bordô */
  selected: boolean;
  /** rodapé "Adicionar à agenda" / "✓ Na agenda · dom 15" (AgendaAction, ajustes-101) */
  action: ReactNode;
  /** quem do grupo quer esse lugar (ajustes-67) — só mostra se tiver alguém além de você */
  wanters?: Member[];
  /** id do cartão, pra busca do topo e lista de convidados rolarem até ele */
  id?: string;
  /** sugerido por convidado na simulação "uma semana antes da viagem" e ainda não visto (ajustes-89) */
  isNew?: boolean;
  /** convidado que escolheu primeiro (addedBy) — tag no canto e a cor do cartão (ajustes-94) */
  suggestedBy?: Member;
}

/**
 * Card de lugar do carrossel de Sugestões (substitui o antigo PlaceRow em lista). Três estados
 * (ajustes-87): ninguém escolheu → "+"; só convidados escolheram → sem ✓ e com o botão "Eu
 * também"; você escolheu → ✓ bordô (com os avatares de quem mais quer: "Você e Marina querem ir").
 * Desde o ajustes-94, o escolhido por convidado leva a tag colorida de quem sugeriu no canto
 * superior direito (ao lado do ✓, quando você também escolheu) e, enquanto só o grupo escolheu, o
 * cartão inteiro fica tingido na cor dessa pessoa, com a borda na mesma cor.
 * Desde o ajustes-95b (planos do grupo provisórios) o plano de convidado começa com o mesmo "+" do
 * canto — saíram o botão "Eu também" e o "Selecionado pelo grupo" — e o texto diz "Marina vai ·
 * toque + pra ir também"; depois do toque, ✓ e "Você e Marina vão".
 * Desde o ajustes-101 o "+" / ✓ do canto saiu: a ação é o rodapé "Adicionar à agenda" (`action`),
 * que pede o dia; no canto fica só a tag de quem sugeriu, e o texto é só "Marina vai".
 */
export function PlaceCard({
  place,
  selected,
  action,
  wanters = [],
  id,
  isNew = false,
  suggestedBy,
}: PlaceCardProps) {
  const thumbnailUrl = usePlaceThumbnail(place.wikiTitle ?? place.name, placePhotoUrl(place));
  const tags = place.categories.map((c) => ({
    key: c,
    icon: categoryIcon(c),
    label: INTEREST_LABELS[c as QuizInterest] ?? c,
  }));
  const guests = wanters.filter((m) => m.id !== YOU);
  const byGroupOnly = !selected && guests.length > 0;
  const tagMember = suggestedBy ?? (byGroupOnly ? guests[0] : undefined);
  const tint = byGroupOnly && tagMember?.color;

  return (
    <Card asChild className="gap-0 py-0">
    <article
      id={id}
      className={`${styles.card} ${selected ? styles.cardSelected : ''} ${tint ? styles.cardTinted : ''}`}
      style={tint ? ({ '--card-color': tint, '--card-tint': memberTint(tint) } as CSSProperties) : undefined}
    >
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
        {tagMember && (
          <div className={styles.corner}>
            <MemberTag member={tagMember} className={styles.cornerTag} />
          </div>
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
        {/* lugar que só abre em alguns dias (ajustes-95): "Só aos domingos", --muted 7.63:1 com ícone */}
        {openDaysLabel(place.openDays) && (
          <p className={styles.neighborhood}>
            <Icon icon={CalendarDays} /> {openDaysLabel(place.openDays)}
          </p>
        )}
        {goersText(wanters, { hint: false }) && (
          <p className={styles.wanters}>
            <MemberAvatars members={wanters} />
            <span>{goersText(wanters, { hint: false })}</span>
          </p>
        )}
        <CategoryTags tags={tags} />
        {action}
      </div>
    </article>
    </Card>
  );
}
