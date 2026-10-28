import type { CSSProperties } from 'react';
import { JoinButton } from '../shell/JoinButton';
import { MemberAvatars } from '../shell/MemberAvatars';
import { Icon } from '../shell/Icon';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { placePhotoUrl, type PlaceEntry } from '../../data';
import { YOU, type Member } from '../../utils/costs';
import { goersText } from '../../utils/members';
import { placeIllustrationIcon } from '../../utils/categoryVisuals';
import styles from './GuestChoicesList.module.css';

export interface GuestChoice {
  /** lugar do app; undefined = escrito à mão pelo convidado (sem foto) — também aparece (ajustes-101f) */
  place: PlaceEntry | undefined;
  /** nome na linha (o do lugar do app ou o escrito) */
  title: string;
  /** quem quer o lugar, "Você" primeiro (wantersOf) */
  wanters: Member[];
  /** você também escolheu — mesmo estado do cartão na categoria */
  mine: boolean;
  /** id da seleção (cardId histórico: no ajustes-87 era o id do cartão do lugar na categoria dele) */
  cardId: string;
  /** convidado que escolheu primeiro: avatar colorido e filete na cor dele (ajustes-94) */
  suggestedBy?: Member;
}

/**
 * "Sugestões dos convidados" no topo do Roteiro (ajustes-100; era "Escolhas dos convidados" da aba
 * Sugestões, ajustes-87), em formato compacto: uma linha por lugar — miniatura,
 * nome, quem escolheu e categoria — que leva até o cartão do lugar na categoria dele. Desde o
 * ajustes-95, toda linha tem a mesma estrutura: filete à esquerda na cor de quem sugeriu, sempre, e
 * à direita o botão circular dos cartões de Sugestões em versão menor ("+" → ✓), que muda o MESMO
 * estado do cartão (trip.toggleMyInterest). Sem chevron: o resto da linha continua levando ao cartão.
 * Textos do ajustes-95b (planos provisórios), sem o convite desde o ajustes-100 (o "+" está ao lado):
 * antes do toque, "Marina vai"; depois, "Você e Marina vão". A linha começa sempre no "+" — o lugar
 * só é seu quando você toca.
 */
export function GuestChoicesList({
  choices,
  onOpen,
  onToggleMine,
  rowId,
}: {
  choices: GuestChoice[];
  onOpen: (cardId: string) => void;
  /** "+" / ✓ direto na linha */
  onToggleMine: (choice: GuestChoice) => void;
  /** id da linha — a Novidade da Início ("Marina adicionou …") rola até ela e pisca (ajustes-101f) */
  rowId?: (cardId: string) => string;
}) {
  return (
    <ul className={styles.list}>
      {choices.map((c) => (
        <li key={c.cardId} id={rowId?.(c.cardId)}>
          <GuestChoiceRow choice={c} onOpen={onOpen} onToggleMine={onToggleMine} />
        </li>
      ))}
    </ul>
  );
}

function GuestChoiceRow({
  choice,
  onOpen,
  onToggleMine,
}: {
  choice: GuestChoice;
  onOpen: (cardId: string) => void;
  onToggleMine: (choice: GuestChoice) => void;
}) {
  const { place, title, wanters, mine, cardId, suggestedBy } = choice;
  const thumb = usePlaceThumbnail(place ? (place.wikiTitle ?? place.name) : '', placePhotoUrl(place));
  const guests = wanters.filter((m) => m.id !== YOU);
  // filete sempre: quem sugeriu ou, se você adicionou primeiro, o primeiro convidado que também quer
  const rowColor = (suggestedBy ?? guests[0])?.color;
  const metaText = goersText(wanters, { hint: false });

  return (
    <div className={styles.rowWrap} style={rowColor ? ({ '--row-color': rowColor } as CSSProperties) : undefined}>
      <button type="button" className={styles.row} onClick={() => onOpen(cardId)}>
        <span className={styles.thumb} aria-hidden="true">
          {thumb ? <img src={thumb} alt="" className={styles.thumbImg} /> : <Icon icon={placeIllustrationIcon(place?.categories)} />}
        </span>
        <span className={styles.text}>
          <span className={styles.name}>{title}</span>
          <span className={styles.meta}>
            <MemberAvatars members={guests} />
            <span className={styles.metaText}>{metaText}</span>
          </span>
        </span>
      </button>
      <JoinButton
        joined={mine}
        label={mine ? `Você também vai a ${title}. Tocar pra desfazer` : `Ir também a ${title}`}
        onClick={() => onToggleMine(choice)}
      />
    </div>
  );
}
