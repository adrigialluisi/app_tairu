import { Bell, CalendarDays, Compass, FileText, Luggage, TriangleAlert, User, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '../components/shell/Button';
import { PlatformSwitcher } from '../components/shell/PlatformSwitcher';
import { GroupUpdateBanner } from '../components/shell/GroupUpdateBanner';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { getMembers } from '../utils/costs';
import { joinPt } from '../utils/retrospective';
import { useTrip } from '../context/TripContext';
import { useDocuments, type PersonalDocument } from '../context/DocumentsContext';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatCompanionsLabel, formatDatesLabel, formatDestinationsLabel } from '../utils/tripSummary';
import { getTripEndISO } from '../utils/itinerary';
import { formatMonthYearRange } from '../utils/dateMask';
import { getTripToday, type TripToday } from '../utils/tripToday';
import { attentionText, expiryStatus, needsAttention, type ExpiryStatus } from '../utils/documentSummary';
import { Icon } from '../components/shell/Icon';
import { Card } from '@/components/ui/card';
import { EXAMPLE_PAST_TRIPS, type ExamplePastTrip } from '../data/examplePastTrips';
import styles from './Home.module.css';

function TripHeroCard({
  trip,
  today,
  onClick,
}: {
  trip: ReturnType<typeof useTrip>;
  /** "Simular: durante a viagem" (ajustes-94): selo "Em andamento" (ajustes-95) e a linha do dia */
  today: TripToday | null;
  onClick: () => void;
}) {
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
          {/* estado da viagem (ajustes-95): antes do início, "Planejando"; com a viagem acontecendo, "Em andamento" */}
          {today ? 'Em andamento' : 'Planejando'}
        </Badge>
      </div>
      <div className={styles.heroContent}>
        <span className={styles.heroName}>{trip.name.trim() || 'Viagem sem nome'}</span>
        {today && (
          // --accent-dark no branco: 9.67:1
          <span className={styles.heroToday}>
            {today.city} · Dia {today.globalDay + 1} de {today.totalDays}
          </span>
        )}
        <span className={styles.heroMeta}>
          {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
        </span>
        <span className={styles.heroMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
      </div>
    </button>
    </Card>
  );
}

/**
 * Card de viagem passada de EXEMPLO (src/data/examplePastTrips.ts, sempre com o
 * selo "Exemplo"). Desde o docs/ajustes-76-viagem-passada-e-recordacao.md, o
 * exemplo que tem roteiro (Lisboa + Porto) é clicável e abre a viagem passada;
 * o outro continua só ilustrando o carrossel.
 */
function PastTripCard({ trip, onOpen }: { trip: ExamplePastTrip; onOpen?: () => void }) {
  const thumbnailUrl = usePlaceThumbnail(trip.cityForPhoto);

  const inner = (
    <>
      <div className={styles.pastTripPhotoWrap}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.pastTripPhoto} />
        ) : (
          <span className={styles.pastTripPhotoFallback} aria-hidden="true"><Icon icon={Luggage} /></span>
        )}
        {/* mês e ano da viagem no lugar de "Exemplo" (ajustes-95); o leitor de tela continua ouvindo "Exemplo" */}
        <Badge variant="neutral" className={styles.exampleBadge}>
          <span className="visually-hidden">Exemplo · </span>
          {formatMonthYearRange(trip.startISO, trip.endISO)}
        </Badge>
      </div>
      <div className={styles.pastTripContent}>
        <p className={styles.pastTripName}>{trip.name}</p>
        <p className={styles.pastTripMeta}>
          {trip.destinationsLabel} · {trip.datesLabel}
        </p>
        <p className={styles.pastTripMeta}>{trip.companionsLabel}</p>
      </div>
    </>
  );

  if (!onOpen) return <Card className={`gap-0 py-0 ${styles.pastTripCard}`}>{inner}</Card>;
  return (
    <Card asChild className={`cursor-pointer gap-0 py-0 text-left ${styles.pastTripCard}`}>
      <button type="button" onClick={onOpen} aria-label={`${trip.name} (exemplo): ver roteiro e recordação`}>
        {inner}
      </button>
    </Card>
  );
}

const MAX_ALERTS = 3;
const ALERT_ORDER: ExpiryStatus['kind'][] = ['expired', 'before-trip-end', 'near-trip-end', 'soon'];

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
                {doc.fullName ? ` · ${doc.fullName}` : ''}
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

const GROUP_UPDATES_ID = 'novidades-na-viagem';

/**
 * "Novidades na viagem" (ajustes-89), acima de Avisos: o que chegou no "Simular: uma semana antes da viagem".
 * Cada linha leva à seção e some quando a pessoa passa por ela (unseenUpdates); sem nenhuma, o
 * bloco some.
 */
function GroupUpdates({ trip }: { trip: ReturnType<typeof useTrip> }) {
  const navigate = useNavigate();
  const { roteiro, custos, convidados } = trip.unseenUpdates;
  if (roteiro.length + custos.length + convidados.length === 0) return null;

  const members = getMembers(trip);
  const joined = members.filter((m) => convidados.includes(m.id));
  /*
    Lugares sugeridos, uma linha por cidade (ajustes-94: no teste a participante só percebeu que os
    amigos entraram): "2 lugares sugeridos em Buenos Aires", com os avatares de quem sugeriu, que
    abre as Sugestões da cidade já em "Escolhas dos convidados". Na ordem dos destinos.
  */
  const placeRows = trip.destinations
    .map((d) => {
      const fresh = trip.selectedPlaces.filter((sel) => sel.destinationId === d.id && roteiro.includes(sel.id));
      const who = members.filter((m) => fresh.some((sel) => sel.addedBy === m.id || sel.alsoWantedBy.includes(m.id)) && m.id !== 'voce');
      return { destination: d, count: fresh.length, who };
    })
    .filter((r) => r.count > 0);

  const row = (key: string, icon: ReactNode, text: ReactNode, onClick: () => void) => (
    <button key={key} type="button" className={`${styles.alertRow} ${styles.alertRowSoon}`} onClick={onClick}>
      <span className={styles.alertIcon} aria-hidden="true">{icon}</span>
      <span className={styles.alertText}>
        <span className={styles.alertTitle}>{text}</span>
      </span>
      <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
    </button>
  );

  return (
    <section id={GROUP_UPDATES_ID} className={styles.alerts} aria-labelledby="home-updates-title">
      <h2 id="home-updates-title" className={styles.sectionTitle}>
        Novidades na viagem
      </h2>
      {joined.length > 0 &&
        row(
          'convidados',
          <MemberAvatars members={joined} />,
          `${joinPt(joined.map((m) => m.label))} ${joined.length === 1 ? 'entrou' : 'entraram'} na viagem`,
          () => navigate('/convidar'),
        )}
      {placeRows.map(({ destination, count, who }) =>
        row(
          `roteiro-${destination.id}`,
          who.length > 0 ? <MemberAvatars members={who} /> : <Icon icon={Compass} />,
          `${count} ${count === 1 ? 'lugar sugerido' : 'lugares sugeridos'} em ${destination.city}`,
          () =>
            navigate('/roteiro', { state: { tab: 'lugares', destinationId: destination.id, section: 'grupo' } }),
        ),
      )}
      {custos.length > 0 &&
        row(
          'custos',
          <Icon icon={Wallet} />,
          `${custos.length} ${custos.length === 1 ? 'gasto lançado' : 'gastos lançados'}`,
          () => navigate('/custos'),
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
  const today = getTripToday(trip.destinations, trip.simulatedTodayISO);
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

      <GroupUpdateBanner
        notice={trip.groupUpdateNotice}
        onOpen={() =>
          document.getElementById(GROUP_UPDATES_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />

      <GroupUpdates trip={trip} />

      <DocumentAlerts documents={docs.documents} tripEndISO={tripEndISO} />

      {hasActiveTrip && (
        <div className={styles.heroGroup}>
          <TripHeroCard trip={trip} today={today} onClick={() => navigate('/destinos')} />
          {today && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/roteiro', { state: { tab: 'roteiro', destinationId: today.destinationId } })}
            >
              <Icon icon={CalendarDays} /> Ver o dia de hoje
            </Button>
          )}
        </div>
      )}

      <section className={styles.pastTrips} aria-label="Viagens passadas (exemplo)">
        <h2 className={styles.sectionTitle}>Viagens passadas</h2>
        <div className={styles.carousel}>
          {EXAMPLE_PAST_TRIPS.map((t) => (
            <PastTripCard
              key={t.id}
              trip={t}
              onOpen={t.cities ? () => navigate(`/viagem-passada/${t.id}`) : undefined}
            />
          ))}
        </div>
        <p className={styles.pastTripsNote}>Suas viagens concluídas vão aparecer aqui.</p>
      </section>

      {/* Meus documentos (Memórias saiu da viagem em andamento no ajustes-76 — virou recordação da viagem passada) */}
      <div className={styles.rows}>
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

      {/* fixo no rodapé (ajustes-95): sticky no fim da tela, sempre visível, sem esconder o último item */}
      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
        {/* créditos das fotos num lugar só (ajustes-99c): link pequeno, abaixo de tudo, --muted no branco 7.63:1 */}
        <button
          type="button"
          className="-my-2 inline-flex min-h-11 cursor-pointer items-center self-center border-0 bg-transparent p-0 text-(length:--text-sm) text-muted-foreground underline underline-offset-4"
          onClick={() => navigate('/creditos')}
        >
          Créditos das fotos
        </button>
      </div>
    </div>
  );
}
