import type { MemberId, TripPlaceSelection } from '../context/TripContext';
import { YOU, type Member } from './costs';
import { joinPt } from './retrospective';

/** Quem quer o lugar (adicionou + também quer), "Você" primeiro. */
export function wantersOf(selection: TripPlaceSelection, members: Member[]): Member[] {
  const ids: MemberId[] = [selection.addedBy, ...selection.alsoWantedBy];
  return members.filter((m) => ids.includes(m.id));
}

/**
 * Quem vai (ajustes-95b, planos do grupo provisórios) — null se nenhum convidado quer:
 * - você também vai: "Você e Marina vão";
 * - só convidados: "Marina vai · toque + pra ir também" (sem o convite, só "Marina vai", no
 *   cartão de plano do Roteiro, que já tem o "+" ao lado).
 */
export function goersText(wanters: Member[], { hint = true }: { hint?: boolean } = {}): string | null {
  const guests = wanters.filter((m) => m.id !== YOU);
  if (guests.length === 0) return null;
  const names = joinPt(guests.map((m) => m.shortName));
  if (wanters.some((m) => m.id === YOU)) return `Você e ${names} vão`;
  return `${names} ${guests.length === 1 ? 'vai' : 'vão'}${hint ? ' · toque + pra ir também' : ''}`;
}
