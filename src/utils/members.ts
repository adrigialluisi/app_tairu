import type { MemberId, TripPlaceSelection } from '../context/TripContext';
import { YOU, type Member } from './costs';
import { joinPt } from './retrospective';

/** Quem quer o lugar (adicionou + também quer), "Você" primeiro. */
export function wantersOf(selection: TripPlaceSelection, members: Member[]): Member[] {
  const ids: MemberId[] = [selection.addedBy, ...selection.alsoWantedBy];
  return members.filter((m) => ids.includes(m.id));
}

/** "Marina quer ir" / "Marina e Rodrigo querem ir" / "Você e Marina querem ir" — null se só você quer. */
export function wantersText(wanters: Member[]): string | null {
  if (!wanters.some((m) => m.id !== YOU)) return null;
  const names = wanters.map((m) => m.shortName);
  return `${joinPt(names)} ${names.length === 1 ? 'quer' : 'querem'} ir`;
}
