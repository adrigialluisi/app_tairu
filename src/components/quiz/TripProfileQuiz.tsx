import { OptionChipGroup } from './OptionChipGroup';
import { MultiOptionChipGroup } from './MultiOptionChipGroup';
import { INTEREST_OPTIONS, KNOWS_DESTINATION_OPTIONS } from '../../data/quizOptions';
import {
  useTrip,
  type QuizAnswers,
  type QuizBudget,
  type QuizCompanionType,
  type QuizDiscovery,
  type QuizRhythm,
} from '../../context/TripContext';
import styles from './TripProfileQuiz.module.css';

const DISCOVERY_OPTIONS: { value: QuizDiscovery; label: string }[] = [
  { value: 'turistico', label: 'Turístico' },
  { value: 'equilibrado', label: 'Equilibrado' },
  { value: 'fora-do-circuito', label: 'Fora do circuito' },
];

const RHYTHM_OPTIONS: { value: QuizRhythm; label: string }[] = [
  { value: 'tranquilo', label: 'Tranquilo' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'corrido', label: 'Corrido' },
];

const BUDGET_OPTIONS: { value: QuizBudget; label: string }[] = [
  { value: 'economico', label: 'Econômico' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'confortavel', label: 'Confortável' },
];

const COMPANION_TYPE_OPTIONS: { value: QuizCompanionType; label: string }[] = [
  { value: 'sozinho', label: 'Sozinho(a)' },
  { value: 'casal', label: 'Casal' },
  { value: 'amigos', label: 'Amigos' },
  { value: 'familia-criancas', label: 'Família com crianças' },
];

/**
 * Só o conteúdo das 6 perguntas — sem ScreenShell/AppBar/footer próprios.
 * Usado como aba "Perfil da viagem" dentro de CreateTrip.tsx (ver
 * docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md). Interesses e
 * "já conhece" voltaram a ser gerais da viagem (não mais por destino, ver
 * docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md, que substitui
 * docs/ajustes-14-interesses-por-destino.md).
 */
export function TripProfileQuiz() {
  const trip = useTrip();

  return (
    <>
      {trip.destinations.length > 1 && (
        <p className={styles.multiDestinationHint}>
          Essa viagem tem {trip.destinations.length} destinos — marque tudo que fizer sentido pra qualquer um deles,
          é isso que direciona as sugestões de dicas no roteiro.
        </p>
      )}

      <MultiOptionChipGroup
        legend="Turístico ou fora do circuito?"
        options={DISCOVERY_OPTIONS}
        values={trip.quiz.discovery}
        onToggle={trip.toggleQuizDiscovery}
      />

      <OptionChipGroup
        legend="Ritmo do dia a dia?"
        options={RHYTHM_OPTIONS}
        value={trip.quiz.rhythm}
        onChange={(v) => trip.setQuizAnswer('rhythm', v)}
      />

      <OptionChipGroup
        legend="Orçamento aproximado?"
        options={BUDGET_OPTIONS}
        value={trip.quiz.budget}
        onChange={(v) => trip.setQuizAnswer('budget', v)}
      />

      <OptionChipGroup
        legend="Como vai ser essa viagem?"
        options={COMPANION_TYPE_OPTIONS}
        value={trip.quiz.companionType}
        onChange={(v) => trip.setQuizAnswer('companionType', v)}
      />

      <MultiOptionChipGroup
        legend="Interesses da viagem"
        options={INTEREST_OPTIONS}
        values={trip.quiz.interests}
        onToggle={trip.toggleQuizInterest}
      />

      <OptionChipGroup
        legend="Já conhece algum desses destinos?"
        options={KNOWS_DESTINATION_OPTIONS}
        value={trip.quiz.knowsDestination}
        onChange={(v) => trip.setQuizAnswer('knowsDestination', v)}
      />
    </>
  );
}

/**
 * Linhas de texto pro resumo do Passo 2 (Perfil da viagem) em
 * CreateTrip.tsx — ver docs/ajustes-23-destinos-em-steps-com-resumo.md.
 * Só inclui perguntas já respondidas; se nada foi respondido ainda,
 * devolve uma linha explicando como preencher.
 */
export function quizSummaryLines(quiz: QuizAnswers): string[] {
  const lines: string[] = [];

  if (quiz.discovery.length > 0) {
    lines.push(
      `Estilo de descoberta: ${quiz.discovery.map((d) => DISCOVERY_OPTIONS.find((o) => o.value === d)?.label).join(' e ')}`,
    );
  }
  if (quiz.rhythm) {
    lines.push(`Ritmo: ${RHYTHM_OPTIONS.find((o) => o.value === quiz.rhythm)?.label}`);
  }
  if (quiz.budget) {
    lines.push(`Orçamento: ${BUDGET_OPTIONS.find((o) => o.value === quiz.budget)?.label}`);
  }
  if (quiz.companionType) {
    lines.push(`Viagem: ${COMPANION_TYPE_OPTIONS.find((o) => o.value === quiz.companionType)?.label}`);
  }
  if (quiz.interests.length > 0) {
    lines.push(`Interesses: ${quiz.interests.map((i) => INTEREST_OPTIONS.find((o) => o.value === i)?.label).join(', ')}`);
  }
  if (quiz.knowsDestination) {
    lines.push(`Já conhece: ${KNOWS_DESTINATION_OPTIONS.find((o) => o.value === quiz.knowsDestination)?.label}`);
  }

  if (lines.length === 0) {
    return ['Nenhuma resposta ainda — toque em "Editar" pra preencher.'];
  }
  return lines;
}
