# Ajuste 23 — Destinos vira um fluxo de 2 steps, com "Salvar" e resumo editável

Feedback da Adriana (11/set/2026), vendo a tela de Destinos já com o alternador leve Destino/Perfil (ajustes-17) e a trilha de progresso (ajustes-22): "na parte de destinos faltou completar o perfil da viagem. Acho que nessa primeira parte pode ser estilo steps em vez de abas. Termino de preencher os destinos e salvo. Ele gera um resumo que eu posso editar depois. E aí vai para o step abaixo para colocar o perfil da viagem que salvo e ele gera um resumo também."

Duas mudanças em conjunto: (1) Destino e Perfil da viagem deixam de ser abas alternáveis livremente e viram **2 steps sequenciais**, cada um com seu próprio botão de salvar e um resumo (editável) depois de salvo; (2) **o Passo 2 (Perfil da viagem) só aparece depois que o Passo 1 (Destino) for salvo** — decisão explícita da Adriana, mesmo isso sendo um tipo de trava pontual dentro desta tela (diferente do resto do app, onde nada trava — ver `docs/ajustes-21-menu-sempre-visivel.md` — mas aqui é intencional: ela quer um fluxo guiado passo a passo dentro da tela de Destinos, sem afetar a regra de o menu fixo nunca travar).

## 1. Novo componente reaproveitável: `src/components/shell/StepSection.tsx`

```tsx
import type { ReactNode } from 'react';
import styles from './StepSection.module.css';

interface StepSectionProps {
  stepNumber: number;
  title: string;
  /** true = mostra o resumo (modo revisão); false = mostra o children (modo edição) */
  saved: boolean;
  summary: ReactNode;
  onEdit: () => void;
  children: ReactNode;
}

/**
 * Seção de formulário em formato de "passo numerado", com dois modos:
 * edição (children, com o botão de salvar de responsabilidade de quem usa
 * o componente) e resumo (summary + botão "Editar" pra voltar à edição).
 * Ver docs/ajustes-23-destinos-em-steps-com-resumo.md.
 */
export function StepSection({ stepNumber, title, saved, summary, onEdit, children }: StepSectionProps) {
  return (
    <section className={styles.step} aria-label={`Passo ${stepNumber}: ${title}`}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber} aria-hidden="true">
          {stepNumber}
        </span>
        <h3 className={styles.stepTitle}>{title}</h3>
        {saved && (
          <button type="button" className={styles.editButton} onClick={onEdit}>
            Editar
          </button>
        )}
      </div>
      {saved ? <div className={styles.stepSummary}>{summary}</div> : <div className={styles.stepBody}>{children}</div>}
    </section>
  );
}
```

**`src/components/shell/StepSection.module.css`** (novo):

```css
.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stepHeader {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stepNumber {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-on-dark);
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepTitle {
  flex: 1;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
}

.editButton {
  background: none;
  border: none;
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  min-height: var(--touch-target);
  padding: 0 var(--space-2);
}

.stepSummary,
.stepBody {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

## 2. `TripProfileQuiz.tsx` — exportar `quizSummaryLines`

Reaproveita as listas de opções já definidas no próprio arquivo (`PACE_OPTIONS`, `RHYTHM_OPTIONS`, `BUDGET_OPTIONS`, `COMPANION_TYPE_OPTIONS`), mais as importadas de `quizOptions.ts` — nenhuma lista nova, só uma função que percorre `trip.quiz` e monta linhas de texto prontas pro resumo:

```tsx
import type { QuizAnswers } from '../../context/TripContext';

// ...(PACE_OPTIONS, RHYTHM_OPTIONS, BUDGET_OPTIONS, COMPANION_TYPE_OPTIONS continuam iguais, sem mudança)

/**
 * Linhas de texto pro resumo do Passo 2 (Perfil da viagem) em
 * CreateTrip.tsx — ver docs/ajustes-23-destinos-em-steps-com-resumo.md.
 * Só inclui perguntas já respondidas; se nada foi respondido ainda,
 * devolve uma linha explicando como preencher.
 */
export function quizSummaryLines(quiz: QuizAnswers): string[] {
  const lines: string[] = [];

  if (quiz.pace.length > 0) {
    lines.push(`Perfil: ${quiz.pace.map((p) => PACE_OPTIONS.find((o) => o.value === p)?.label).join(' e ')}`);
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
```

(`TripProfileQuiz` em si, o componente/formulário, não muda nada — continua exatamente igual, incluindo o parágrafo condicional de "essa viagem tem N destinos".)

## 3. `CreateTrip.tsx` — remove as abas, vira 2 `StepSection`

Remove por completo: `TABS_NAME`, o `<div role="tablist">` com os dois `<button role="tab">`, o estado `activeTab`, e os dois `<div role="tabpanel">`. Substitui pelo seguinte, mantendo o `TextField` de "Nome da viagem" onde já está (ele é da viagem inteira, não faz parte de nenhum dos dois steps):

```tsx
import { useState } from 'react';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Button } from '../components/shell/Button';
import { SaveToast } from '../components/shell/SaveToast';
import { StepSection } from '../components/shell/StepSection';
import { SuggestionCard } from '../components/shell/SuggestionCard';
import { TextField } from '../components/inputs/TextField';
import { DestinationField } from '../components/inputs/DestinationField';
import { TripProfileQuiz, quizSummaryLines } from '../components/quiz/TripProfileQuiz';
import { useTrip, type TripDestination } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { isDestinosComplete } from '../utils/tripProgress';
import { formatISOToDisplay } from '../utils/dateMask';
import { getCurrency } from '../data';
import styles from './CreateTrip.module.css';

// findDateOverlap continua igual, sem mudança

function formatDestinoSummaryLine(destination: TripDestination): string {
  const dates =
    destination.dateStart && destination.dateEnd
      ? `${formatISOToDisplay(destination.dateStart)} – ${formatISOToDisplay(destination.dateEnd)}`
      : 'datas a definir';
  const currency = getCurrency(destination.currencyCode);
  return `${destination.city}, ${destination.country} — ${dates} · ${currency?.code ?? destination.currencyCode}`;
}

export function CreateTrip() {
  const trip = useTrip();
  const { message, visible, show } = useSaveToast();

  // Se a pessoa já tinha destinos completos ao voltar pra essa tela (ex.: navegou
  // pra outra seção e voltou), os dois steps já entram "salvos" — não força
  // re-clicar em Salvar. perfilUnlocked nunca volta a false depois de virar true.
  const [destinoSaved, setDestinoSaved] = useState(() => isDestinosComplete(trip));
  const [perfilUnlocked, setPerfilUnlocked] = useState(() => isDestinosComplete(trip));
  const [perfilSaved, setPerfilSaved] = useState(false);

  const overlap = findDateOverlap(trip.destinations);
  const overlapError = overlap
    ? `As datas de ${overlap[0].city} e ${overlap[1].city} não podem se sobrepor.`
    : null;

  function handleSaveDestinos() {
    setDestinoSaved(true);
    setPerfilUnlocked(true);
    show('Destinos salvos');
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Destinos e datas" />}
      bottomNav={<BottomNav />}
      toast={<SaveToast visible={visible} message={message} />}
    >
      <div className={styles.intro}>
        <h2 className={styles.title}>Para onde vamos?</h2>
        <p className={styles.subtitle}>
          Preencha os dados da viagem — pode adicionar quantos destinos quiser, a qualquer momento.
        </p>
      </div>

      <TextField
        id="trip-name"
        label="Nome da viagem"
        placeholder="Ex.: Réveillon em família"
        value={trip.name}
        onChange={trip.setName}
        autoComplete="off"
        required
      />

      <StepSection
        stepNumber={1}
        title="Destino"
        saved={destinoSaved}
        onEdit={() => setDestinoSaved(false)}
        summary={
          <ul className={styles.summaryList}>
            {trip.destinations.map((d) => (
              <li key={d.id}>{formatDestinoSummaryLine(d)}</li>
            ))}
          </ul>
        }
      >
        <DestinationField
          destinations={trip.destinations}
          onAdd={(destination) => {
            trip.addDestination(destination);
            show('Destino adicionado');
          }}
          onRemove={trip.removeDestination}
          onCurrencyChange={trip.setDestinationCurrency}
          onDateRangeChange={(id, start, end) => {
            trip.setDestinationDateRange(id, start, end);
            if (start && end) show('Datas salvas');
          }}
          dateOverlapError={overlapError}
        />
        <Button fullWidth disabled={trip.destinations.length === 0 || !!overlapError} onClick={handleSaveDestinos}>
          Salvar destinos
        </Button>
      </StepSection>

      {perfilUnlocked ? (
        <StepSection
          stepNumber={2}
          title="Perfil da viagem"
          saved={perfilSaved}
          onEdit={() => setPerfilSaved(false)}
          summary={
            <ul className={styles.summaryList}>
              {quizSummaryLines(trip.quiz).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          }
        >
          <TripProfileQuiz />
          <Button
            fullWidth
            onClick={() => {
              setPerfilSaved(true);
              show('Perfil da viagem salvo');
            }}
          >
            Salvar perfil da viagem
          </Button>
        </StepSection>
      ) : (
        <p className={styles.lockedHint}>O perfil da viagem aparece aqui depois que você salvar os destinos.</p>
      )}

      {perfilSaved && trip.selectedPlaces.length === 0 && (
        <SuggestionCard
          message="Tudo pronto! Já pode montar o roteiro do dia a dia."
          actionLabel="Ir pro Roteiro"
          to="/roteiro"
          storageKey="ir-pro-roteiro"
        />
      )}
    </ScreenShell>
  );
}
```

Diferença chave em relação ao `ajustes-22`: o card de sugestão "Ir pro Roteiro" antes aparecia com `isDestinosComplete(trip) && trip.selectedPlaces.length === 0`; agora passa a exigir `perfilSaved` (não só destino completo) — faz mais sentido, porque com o Passo 2 aparecendo logo abaixo, não tem por quê sugerir pular direto pro Roteiro antes da pessoa nem ter visto o Perfil da viagem.

## 4. `CreateTrip.module.css` — remover o alternador antigo, adicionar estilos novos

Remover por completo `.panel`, `.sectionSwitcher`, `.sectionLink`, `.sectionLinkActive` (não são mais usados — o `StepSection` cuida do próprio espaçamento interno). Adicionar:

```css
.summaryList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: 14px;
  color: var(--text);
}

.lockedHint {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  font-style: italic;
}
```

## 5. `BottomNav.tsx` — sem mudança

O selo de "Destinos" continua usando `isDestinosComplete(trip)` (dados reais da viagem — pelo menos 1 destino com datas), não o estado local `destinoSaved`/`perfilSaved` desta tela (que é só uma camada de UI de revisão, não critério de dado). Ou seja: é possível a pessoa ainda não ter clicado "Salvar destinos" nesta tela e o selo do menu já aparecer ✓ se os dados já estiverem completos (ex.: voltando de uma edição) — comportamento esperado, sem inconsistência real.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Ao entrar em Destinos pela primeira vez (viagem vazia), só o Passo 1 (Destino) aparece — nenhum vestígio do Passo 2, nem travado/cinza, só a frase de orientação abaixo do Passo 1.
- Botão "Salvar destinos" começa desabilitado (nenhum destino ainda) e habilita assim que o primeiro destino é adicionado; clicar nele troca o formulário por um resumo com cada destino (cidade, país, datas ou "datas a definir", moeda) e faz o Passo 2 aparecer embaixo.
- Clicar "Editar" no resumo do Passo 1 volta pro formulário, com os destinos já cadastrados intactos (nada se perde).
- Depois que o Passo 2 aparece uma vez, ele nunca mais desaparece — mesmo que a pessoa clique "Editar" no Passo 1 de novo depois.
- No Passo 2, preencher algumas perguntas e clicar "Salvar perfil da viagem" troca pro resumo, só com as perguntas já respondidas (perguntas puladas não aparecem como linha vazia); clicar "Editar" volta ao Quiz com as respostas anteriores intactas.
- Clicar "Salvar perfil da viagem" sem responder nada mostra a linha "Nenhuma resposta ainda — toque em Editar pra preencher." no resumo, sem travar nem dar erro.
- O selo ✓ de "Destinos" no menu fixo continua funcionando pelo estado real da viagem (não pelo clique de Salvar desta tela).
- O card de sugestão "Ir pro Roteiro" só aparece depois que o Passo 2 tiver sido salvo (não mais só com destino completo).
- Voltar pra essa tela depois de já ter salvo os dois passos numa visita anterior (ex.: foi pro Roteiro e voltou) mostra os dois já em modo resumo, sem forçar reabrir nada.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
