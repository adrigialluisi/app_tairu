import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Button } from '../components/shell/Button';
import { SaveToast } from '../components/shell/SaveToast';
import { StepSection } from '../components/shell/StepSection';
import { TextField } from '../components/inputs/TextField';
import { DestinationField } from '../components/inputs/DestinationField';
import { TripProfileQuiz, quizSummaryLines } from '../components/quiz/TripProfileQuiz';
import { useTrip, type TripDestination } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { formatISOToDisplay } from '../utils/dateMask';
import { getCurrency } from '../data';
import styles from './CreateTrip.module.css';

/**
 * Datas de destinos diferentes podem se TOCAR (fim de um = início do
 * outro — ex.: sai de Buenos Aires de manhã, chega em Santiago ainda de
 * manhã no mesmo dia) — só não podem se sobrepor de verdade. Ordena por
 * dateStart e checa só pares consecutivos: inválido se
 * próximo.dateStart < anterior.dateEnd (comparação estrita); igual é
 * válido (dia de fronteira). Ver docs/ajustes-09-datas-por-destino.md.
 */
function findDateOverlap(destinations: TripDestination[]): [TripDestination, TripDestination] | null {
  const withDates = destinations.filter((d) => d.dateStart && d.dateEnd);
  const sorted = [...withDates].sort((a, b) => ((a.dateStart as string) < (b.dateStart as string) ? -1 : 1));
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if ((next.dateStart as string) < (prev.dateEnd as string)) {
      return [prev, next];
    }
  }
  return null;
}

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
  const navigate = useNavigate();
  const { message, visible, show } = useSaveToast();

  // perfilUnlocked nunca volta a false depois de virar true — se o perfil já
  // foi salvo antes, trip.perfilSaved sozinho já garante isso.
  const perfilUnlocked = trip.destinosSaved || trip.perfilSaved;

  const overlap = findDateOverlap(trip.destinations);
  const overlapError = overlap
    ? `As datas de ${overlap[0].city} e ${overlap[1].city} não podem se sobrepor.`
    : null;

  function handleSaveDestinos() {
    trip.setDestinosSaved(true);
    show('Destinos salvos');
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Destinos e datas" onHome={() => navigate('/inicio')} />}
      bottomNav={<BottomNav />}
      footer={
        trip.perfilSaved && trip.companions.length === 0 ? (
          <Button fullWidth onClick={() => navigate('/central')}>
            Continuar
          </Button>
        ) : undefined
      }
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
        saved={trip.destinosSaved}
        onEdit={() => trip.setDestinosSaved(false)}
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

      {perfilUnlocked && (
        <StepSection
          stepNumber={2}
          title="Perfil da viagem"
          saved={trip.perfilSaved}
          onEdit={() => trip.setPerfilSaved(false)}
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
              trip.setPerfilSaved(true);
              show('Perfil da viagem salvo');
            }}
          >
            Salvar perfil da viagem
          </Button>
        </StepSection>
      )}
    </ScreenShell>
  );
}
