import type { QuizInterest, QuizKnowsDestination } from '../context/TripContext';

/**
 * Compartilhado com DestinationField.tsx — Interesses e "já conhece" viraram
 * personalização por destino (ver docs/ajustes-14-interesses-por-destino.md),
 * não mais perguntas da viagem toda (ficavam antes em QuizProfile.tsx, hoje
 * apagado — as 4 perguntas que restaram viraram TripProfileQuiz.tsx, ver
 * docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md), mas as opções em si
 * continuam as mesmas.
 */
export const INTEREST_OPTIONS: { value: QuizInterest; label: string }[] = [
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'cultura', label: 'Cultura e história' },
  { value: 'natureza', label: 'Natureza' },
  { value: 'vida-noturna', label: 'Vida noturna' },
  { value: 'compras', label: 'Compras' },
];

export const KNOWS_DESTINATION_OPTIONS: { value: QuizKnowsDestination; label: string }[] = [
  { value: 'sim', label: 'Sim, já conheço' },
  { value: 'nao', label: 'Não, primeira vez' },
];
