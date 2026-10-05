import {
  CalendarDays,
  Compass,
  Drum,
  Landmark,
  Moon,
  MoonStar,
  Music,
  PartyPopper,
  Pencil,
  Scale,
  ShoppingBag,
  ShoppingBasket,
  Theater,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { EventKind } from '../data';

/**
 * Mapa único de ícones das seções de sugestão (perfil da viagem) — usado na
 * faixa do perfil, nos atalhos, nos cabeçalhos de seção, nos cards e no
 * Roteiro. Ícone sempre com aria-hidden e texto ao lado, nunca sozinho.
 * Ver docs/ajustes-60-sugestoes-por-categoria-e-eventos.md; ícones lucide
 * desde o docs/ajustes-72-virada-visual-shadcn.md (seção 5).
 */
export const SECTION_ICONS = {
  eventos: CalendarDays,
  turistico: Landmark,
  'fora-do-circuito': Compass,
  gastronomia: UtensilsCrossed,
  cultura: Theater,
  natureza: Trees,
  'vida-noturna': Moon,
  compras: ShoppingBag,
} satisfies Record<string, LucideIcon>;

/** "Equilibrado" não vira seção própria (mostra as duas), mas aparece como chip na faixa do perfil. */
export const EQUILIBRADO_ICON: LucideIcon = Scale;

export const EVENT_KIND_ICONS: Record<EventKind, LucideIcon> = {
  show: Music,
  feira: ShoppingBasket,
  danca: PartyPopper,
  cerimonia: Drum,
  ceu: MoonStar,
};

export function categoryIcon(category: string): LucideIcon | undefined {
  return SECTION_ICONS[category as keyof typeof SECTION_ICONS];
}

/**
 * Ilustração no lugar da foto quando não há foto real (nunca foto falsa — ver
 * docs/ajustes-70-...md, 2.3): ícone da primeira categoria do lugar; lápis
 * pra lugar adicionado à mão (sem categoria).
 */
export function placeIllustrationIcon(categories?: string[]): LucideIcon {
  if (!categories || categories.length === 0) return Pencil;
  return categoryIcon(categories[0]) ?? SECTION_ICONS.turistico;
}
