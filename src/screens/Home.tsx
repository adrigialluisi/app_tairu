import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shell/Button';
import { PlatformSwitcher } from '../components/shell/PlatformSwitcher';
import { useTrip } from '../context/TripContext';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatCompanionsLabel, formatDatesLabel, formatDestinationsLabel } from '../utils/tripSummary';
import styles from './Home.module.css';

/**
 * O protótipo não guarda histórico real de viagens (tudo em memória) —
 * estas são viagens de exemplo fixas, só pra ilustrar o layout do
 * carrossel. Nunca vêm do TripContext, nunca são clicáveis, sempre
 * marcadas com o selo "Exemplo". Nomes de ocasião (não nome de cidade) e
 * destinos fora do cenário fixo de teste. `cityForPhoto` busca uma foto
 * real (Wikipedia) do destino real do exemplo — não é dado fingido, só a
 * "viagem" em si que é ilustrativa.
 */
const EXAMPLE_PAST_TRIPS = [
  {
    id: 'exemplo-1',
    name: 'Réveillon em família',
    cityForPhoto: 'Rio de Janeiro',
    destinationsLabel: 'Rio de Janeiro',
    datesLabel: '28/12 – 02/01',
    companionsLabel: '4 convidados',
  },
  {
    id: 'exemplo-2',
    name: 'Aniversário de 30 anos',
    cityForPhoto: 'Lisboa',
    destinationsLabel: 'Lisboa, Porto',
    datesLabel: '10/05 – 18/05',
    companionsLabel: '2 convidados',
  },
];

function TripHeroCard({ trip, onClick }: { trip: ReturnType<typeof useTrip>; onClick: () => void }) {
  const heroCity = trip.destinations[0]?.city ?? '';
  const thumbnailUrl = usePlaceThumbnail(heroCity);

  return (
    <button type="button" className={styles.heroCard} onClick={onClick}>
      <div className={styles.heroPhotoWrap}>
        {heroCity && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.heroPhoto} />
        ) : (
          <span className={styles.heroPhotoFallback} aria-hidden="true">🧳</span>
        )}
        <span className={styles.heroBadge}>Sua viagem</span>
      </div>
      <div className={styles.heroContent}>
        <span className={styles.heroName}>{trip.name.trim() || 'Viagem sem nome'}</span>
        <span className={styles.heroMeta}>
          {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
        </span>
        <span className={styles.heroMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
      </div>
    </button>
  );
}

function PastTripCard({ trip }: { trip: (typeof EXAMPLE_PAST_TRIPS)[number] }) {
  const thumbnailUrl = usePlaceThumbnail(trip.cityForPhoto);

  return (
    <div className={styles.pastTripCard}>
      <div className={styles.pastTripPhotoWrap}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.pastTripPhoto} />
        ) : (
          <span className={styles.pastTripPhotoFallback} aria-hidden="true">🧳</span>
        )}
        <span className={styles.exampleBadge}>Exemplo</span>
      </div>
      <div className={styles.pastTripContent}>
        <p className={styles.pastTripName}>{trip.name}</p>
        <p className={styles.pastTripMeta}>
          {trip.destinationsLabel} · {trip.datesLabel}
        </p>
        <p className={styles.pastTripMeta}>{trip.companionsLabel}</p>
      </div>
    </div>
  );
}

export function Home() {
  const trip = useTrip();
  const navigate = useNavigate();
  const hasActiveTrip = trip.name.trim().length > 0 || trip.destinations.length > 0;

  function handleNewTrip() {
    trip.resetTrip();
    navigate('/destinos');
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <img src={`${import.meta.env.BASE_URL}logo/LogoTairu.svg`} alt="Tairu" className={styles.logoMark} />
        <div className={styles.headerActions}>
          <PlatformSwitcher inline />
          <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
            <span aria-hidden="true">👤</span>
          </button>
        </div>
      </header>

      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá! 👋</h1>
        <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
      </div>

      {hasActiveTrip && <TripHeroCard trip={trip} onClick={() => navigate('/destinos')} />}

      <section className={styles.pastTrips} aria-label="Viagens passadas (exemplo)">
        <h2 className={styles.sectionTitle}>Viagens passadas</h2>
        <div className={styles.carousel}>
          {EXAMPLE_PAST_TRIPS.map((t) => (
            <PastTripCard key={t.id} trip={t} />
          ))}
        </div>
        <p className={styles.pastTripsNote}>Suas viagens concluídas vão aparecer aqui.</p>
      </section>

      <button type="button" className={styles.documentsRow} onClick={() => navigate('/documentos')}>
        <span className={styles.documentsRowIcon} aria-hidden="true">📄</span>
        <span className={styles.documentsRowLabel}>Meus documentos</span>
        <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
      </button>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
      </div>
    </div>
  );
}
