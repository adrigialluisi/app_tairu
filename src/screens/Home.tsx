import { Bell, FileText, Images, Luggage, TriangleAlert, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '../components/shell/Button';
import { PlatformSwitcher } from '../components/shell/PlatformSwitcher';
import { useTrip } from '../context/TripContext';
import { useDocuments, type PersonalDocument } from '../context/DocumentsContext';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatCompanionsLabel, formatDatesLabel, formatDestinationsLabel } from '../utils/tripSummary';
import { getTripEndISO } from '../utils/itinerary';
import { attentionText, expiryStatus, needsAttention, type ExpiryStatus } from '../utils/documentSummary';
import { Icon } from '../components/shell/Icon';
import { Card } from '@/components/ui/card';
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
    <Card asChild className="gap-0 py-0 text-left">
    <button type="button" className={styles.heroCard} onClick={onClick}>
      <div className={styles.heroPhotoWrap}>
        {heroCity && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.heroPhoto} />
        ) : (
          <span className={styles.heroPhotoFallback} aria-hidden="true"><Icon icon={Luggage} /></span>
        )}
        <Badge variant="accent" className={styles.heroBadge}>
          Sua viagem
        </Badge>
      </div>
      <div className={styles.heroContent}>
        <span className={styles.heroName}>{trip.name.trim() || 'Viagem sem nome'}</span>
        <span className={styles.heroMeta}>
          {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
        </span>
        <span className={styles.heroMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
      </div>
    </button>
    </Card>
  );
}

function PastTripCard({ trip }: { trip: (typeof EXAMPLE_PAST_TRIPS)[number] }) {
  const thumbnailUrl = usePlaceThumbnail(trip.cityForPhoto);

  return (
    <Card className={`gap-0 py-0 ${styles.pastTripCard}`}>
      <div className={styles.pastTripPhotoWrap}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.pastTripPhoto} />
        ) : (
          <span className={styles.pastTripPhotoFallback} aria-hidden="true"><Icon icon={Luggage} /></span>
        )}
        <Badge variant="neutral" className={styles.exampleBadge}>
          Exemplo
        </Badge>
      </div>
      <div className={styles.pastTripContent}>
        <p className={styles.pastTripName}>{trip.name}</p>
        <p className={styles.pastTripMeta}>
          {trip.destinationsLabel} · {trip.datesLabel}
        </p>
        <p className={styles.pastTripMeta}>{trip.companionsLabel}</p>
      </div>
    </Card>
  );
}

const MAX_ALERTS = 3;
const ALERT_ORDER: ExpiryStatus['kind'][] = ['expired', 'before-trip-end', 'soon'];

/**
 * Representação da notificação push no protótipo (ver
 * docs/ajustes-58-documentos-campos-avisos-seguro-anual.md) — o app não
 * manda push de verdade, então o aviso aparece aqui, onde a pessoa cai ao
 * abrir o app.
 */
function DocumentAlerts({ documents, tripEndISO }: { documents: PersonalDocument[]; tripEndISO: string | null }) {
  const navigate = useNavigate();
  const alerts = documents
    .filter((d) => needsAttention(d, tripEndISO))
    .map((doc) => ({ doc, status: expiryStatus(doc, tripEndISO) }))
    .sort((a, b) => ALERT_ORDER.indexOf(a.status.kind) - ALERT_ORDER.indexOf(b.status.kind));

  if (alerts.length === 0) return null;

  return (
    <section className={styles.alerts} aria-labelledby="home-alerts-title">
      <h2 id="home-alerts-title" className={styles.sectionTitle}>
        Avisos
      </h2>
      {alerts.slice(0, MAX_ALERTS).map(({ doc, status }) => {
        const isCritical = status.kind === 'expired' || status.kind === 'before-trip-end';
        const dateLabel =
          doc.type === 'seguro-anual' ? `Vigência até ${doc.expiryDate}` : `Validade: ${doc.expiryDate}`;
        return (
          <button
            key={doc.id}
            type="button"
            className={`${styles.alertRow} ${isCritical ? styles.alertRowCritical : styles.alertRowSoon}`}
            onClick={() => navigate('/documentos', { state: { openDocId: doc.id } })}
          >
            <span className={styles.alertIcon} aria-hidden="true"><Icon icon={Bell} /></span>
            <span className={styles.alertText}>
              <span className={styles.alertTitle}>{attentionText(doc, status)}</span>
              <span className={styles.alertMeta}>
                {dateLabel}
                {doc.holderName ? ` · ${doc.holderName}` : ''}
              </span>
            </span>
            <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
          </button>
        );
      })}
      {alerts.length > MAX_ALERTS && (
        <button type="button" className={styles.alertMore} onClick={() => navigate('/documentos')}>
          Ver todos os avisos ({alerts.length})
          <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
        </button>
      )}
    </section>
  );
}

export function Home() {
  const trip = useTrip();
  const docs = useDocuments();
  const navigate = useNavigate();
  const hasActiveTrip = trip.name.trim().length > 0 || trip.destinations.length > 0;

  function handleNewTrip() {
    trip.resetTrip();
    navigate('/destinos');
  }

  const tripEndISO = getTripEndISO(trip.destinations);
  const alertCount = docs.documents.filter((d) => needsAttention(d, tripEndISO)).length;
  const documentsSubtitle =
    docs.documents.length === 0
      ? 'Passaporte, RG, CNH e outros'
      : `${docs.documents.length} ${docs.documents.length === 1 ? 'documento' : 'documentos'}`;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <img src={`${import.meta.env.BASE_URL}logo/LogoTairu.svg`} alt="Tairu" className={styles.logoMark} />
        <div className={styles.headerActions}>
          <PlatformSwitcher inline />
          <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
            <Icon icon={User} />
          </button>
        </div>
      </header>

      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá! 👋</h1>
        <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
      </div>

      <DocumentAlerts documents={docs.documents} tripEndISO={tripEndISO} />

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

      {/* Memórias + Meus documentos: linhas do mesmo tipo, agrupadas (12px entre si) */}
      <div className={styles.rows}>
        {hasActiveTrip && (
          <button type="button" className={styles.documentsRow} onClick={() => navigate('/memorias')}>
            <span className={styles.documentsRowIcon} aria-hidden="true"><Icon icon={Images} /></span>
            <span className={styles.documentsRowText}>
              <span className={styles.documentsRowLabel}>Memórias da viagem</span>
              <span className={styles.documentsRowSubtitle}>
                {[
                  trip.photos.length === 0
                    ? 'Fotos organizadas por dia'
                    : `${trip.photos.length} ${trip.photos.length === 1 ? 'foto' : 'fotos'}`,
                  trip.retrospective ? 'retrospectiva pronta' : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
          </button>
        )}

        <button type="button" className={styles.documentsRow} onClick={() => navigate('/documentos')}>
          <span className={styles.documentsRowIcon} aria-hidden="true"><Icon icon={FileText} /></span>
          <span className={styles.documentsRowText}>
            <span className={styles.documentsRowLabel}>Meus documentos</span>
            <span className={styles.documentsRowSubtitle}>
              {documentsSubtitle}
              {alertCount > 0 && (
                <span className={styles.documentsRowAlert}>
                  {' '}
                  · <Icon icon={TriangleAlert} /> {alertCount} {alertCount === 1 ? 'precisa' : 'precisam'} de atenção
                </span>
              )}
            </span>
          </span>
          <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
        </button>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
      </div>
    </div>
  );
}
