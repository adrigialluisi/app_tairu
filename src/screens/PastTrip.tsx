import { CalendarDays, ExternalLink, Landmark, List, Map as MapIcon, MapPin, Sparkles, Ticket, UtensilsCrossed, Wallet, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { Icon } from '../components/shell/Icon';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Tabs } from '../components/shell/Tabs';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { StopPhotos } from '../components/itinerary/StopPhotos';
import { TimelineStop } from '../components/itinerary/TimelineStop';
import { ExamplePhotoDialog } from '../components/recap/ExamplePhotoDialog';
import { TravelerAvatar } from '../components/recap/TravelerAvatar';
import { CategoryTags } from '../components/suggestions/CategoryTags';
import {
  EXAMPLE_TRAVELERS,
  getExamplePastTrip,
  photosOfStop,
  type ExamplePhoto,
  type PastTripStop,
  type PastTripStopKind,
} from '../data/examplePastTrips';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatISOToDisplay, formatISOToLongWeekday } from '../utils/dateMask';
import { formatMoney, RATES_AS_OF, RATES_SOURCE_LABEL, toBRL } from '../utils/money';
import {
  allStops,
  cityDays,
  costSummary,
  countKind,
  dayNumberOf,
  formatKm,
  pathKm,
  photosByLabel,
  shortName,
  STOP_KIND_COST_LABEL,
  STOP_KIND_LABEL,
  stopsByDay,
  sumCost,
  tripDayCount,
} from '../utils/pastTrip';

const KIND_ICON: Record<PastTripStopKind, LucideIcon> = {
  lugar: Landmark,
  restaurante: UtensilsCrossed,
  evento: Ticket,
};

type ListFilter = 'tudo' | PastTripStopKind;

/** "€ 45,00" + "≈ R$ 264" — o valor pago fica na moeda em que foi pago, o real é só referência. */
function eur(amount: number): string {
  return formatMoney(amount, 'EUR');
}
function brlApprox(amountEUR: number): string {
  const brl = toBRL(amountEUR, 'EUR');
  return brl === null ? 'sem conversão' : `≈ ${formatMoney(brl, 'BRL')}`;
}

function priceLabel(stop: PastTripStop): string {
  if (stop.cost === 0) return 'Grátis';
  return `${eur(stop.cost)}${stop.costNote ? ` · ${stop.costNote}` : ''}`;
}

/**
 * Viagem passada (rota /viagem-passada/:id) — docs/ajustes-76-viagem-passada-e-recordacao.md.
 * Roteiro só de VISUALIZAÇÃO: compilado em lista (por cidade → dia → paradas)
 * e mapa (rota ligando as paradas), sem nenhuma ação de edição. Daqui sai o
 * "Gerar recordação" (história estilo stories).
 */
export function PastTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = getExamplePastTrip(id);
  const [view, setView] = useState<'lista' | 'mapa'>('lista');
  const [mapCity, setMapCity] = useState('todas');
  const [filter, setFilter] = useState<ListFilter>('tudo');
  const [viewer, setViewer] = useState<{ photo: ExamplePhoto; placeName: string } | null>(null);
  const heroUrl = usePlaceThumbnail(trip?.cityForPhoto ?? '');

  if (!trip?.cities) return <Navigate to="/inicio" replace />;

  const cities = trip.cities;
  const stops = allStops(trip);
  const km = pathKm(stops);
  const costs = costSummary(stops, trip.travelers);
  const maxKindTotal = Math.max(...costs.byKind.map((k) => k.total), 1);
  const visible = (list: PastTripStop[]) => (filter === 'tudo' ? list : list.filter((st) => st.kind === filter));

  const mapStops = mapCity === 'todas' ? stops : (cities.find((c) => c.id === mapCity)?.stops ?? []);
  const pins: RouteMapPin[] = mapStops.map((s) => ({
    id: s.id,
    name: s.name,
    neighborhood: s.neighborhood,
    lat: s.lat,
    lng: s.lng,
    dayNumber: dayNumberOf(trip, s.dayISO),
    skipped: false,
  }));

  const stats = [
    { value: String(tripDayCount(trip)), label: 'dias' },
    { value: String(cities.length), label: cities.length === 1 ? 'cidade' : 'cidades' },
    { value: String(countKind(stops, 'lugar')), label: 'lugares' },
    { value: formatKm(km).replace(' km', ''), label: 'km*' },
  ];

  return (
    <ScreenShell appBar={<AppBar title={trip.name} subtitle="Viagem passada" onBack={() => navigate('/inicio')} />}>
      <div className="flex flex-col gap-6">
        <Card className="gap-0 overflow-hidden py-0">
          <div className="relative h-40 bg-(--placeholder)">
            {heroUrl && <img src={heroUrl} alt="" className="size-full object-cover" />}
            <Badge variant="neutral" className="absolute top-3 left-3">
              Exemplo
            </Badge>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <p className="m-0 text-(length:--text-lg) font-semibold text-foreground">{trip.destinationsLabel}</p>
            <div className="flex items-center gap-2">
              <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                {formatISOToDisplay(trip.startISO)} – {formatISOToDisplay(trip.endISO)} · {trip.companionsLabel}
              </p>
              {/* quem viajou (fictícios, ajustes-79): os mesmos avatares das fotos do roteiro */}
              <span className="flex -space-x-1" role="img" aria-label={`Viajaram: ${EXAMPLE_TRAVELERS.map((t) => shortName(t.id)).join(', ')}`}>
                {EXAMPLE_TRAVELERS.map((t) => (
                  <TravelerAvatar key={t.id} travelerId={t.id} />
                ))}
              </span>
            </div>
          </div>
        </Card>

        <section aria-label="Números da viagem" className="flex flex-col gap-1.5">
          <dl className="m-0 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse items-center rounded-md border border-border bg-background px-1 py-3">
                <dt className="text-(length:--text-sm) text-muted-foreground">{s.label}</dt>
                <dd className="m-0 text-(length:--text-xl) font-semibold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="m-0 text-(length:--text-sm) text-muted-foreground">
            * Distância em linha reta entre os lugares, na ordem do roteiro.
          </p>
        </section>

        <Card className="gap-4 p-4" aria-labelledby="past-costs-title">
          <div className="flex flex-col gap-0.5">
            <h2 id="past-costs-title" className="m-0 flex items-center gap-2 text-(length:--text-lg) font-semibold text-foreground">
              <Icon icon={Wallet} /> Quanto custou
            </h2>
            <p className="m-0 text-(length:--text-xl) font-semibold text-foreground">
              {eur(costs.total)}{' '}
              <span className="text-(length:--text-base) font-normal text-muted-foreground">{brlApprox(costs.total)}</span>
            </p>
            <p className="m-0 text-(length:--text-sm) text-muted-foreground">
              {eur(costs.perPerson)} por pessoa ({trip.travelers} pessoas)
            </p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {costs.byKind.map((k) => (
              <li key={k.kind} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-(length:--text-base)">
                  <span className="flex items-center gap-2 text-foreground">
                    <Icon icon={KIND_ICON[k.kind]} /> {STOP_KIND_COST_LABEL[k.kind]}
                    <span className="text-(length:--text-sm) text-muted-foreground">· {k.count}</span>
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{eur(k.total)}</span>
                </div>
                <span className="block h-2 overflow-hidden rounded-full bg-(--bg-top)" aria-hidden="true">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(k.total / maxKindTotal) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-(length:--text-sm) text-muted-foreground">
            Valores ilustrativos deste exemplo, pagos em euro. Real aproximado pela cotação fixa de {RATES_AS_OF} (
            {RATES_SOURCE_LABEL}). Não inclui passagens nem hospedagem.
          </p>
        </Card>

        <Card className="gap-3 p-4">
          <p className="m-0 flex items-center gap-2 text-(length:--text-lg) font-semibold text-foreground">
            <Icon icon={Sparkles} /> Recordação da viagem
          </p>
          <p className="m-0 text-(length:--text-base) text-muted-foreground">
            Uma história com o caminho que vocês fizeram no mapa, cidade por cidade, e as fotos que você escolher.
          </p>
          <Button variant="primary" fullWidth onClick={() => navigate(`/viagem-passada/${trip.id}/recordacao`)}>
            Gerar recordação
          </Button>
        </Card>

        <section aria-labelledby="past-roteiro-title" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2 id="past-roteiro-title" className="m-0 text-(length:--text-xl) font-semibold text-foreground">
                Roteiro feito
              </h2>
              <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                Fotos que o grupo adicionou em cada lugar durante a viagem. (Exemplo: imagens do Wikimedia Commons.)
              </p>
            </div>
            <div>
              <Tabs
                name="past-view"
                label="Ver roteiro como"
                iconOnly
                value={view}
                onChange={(v) => setView(v as 'lista' | 'mapa')}
                items={[
                  { value: 'lista', label: 'Lista', icon: List },
                  { value: 'mapa', label: 'Mapa', icon: MapIcon },
                ]}
              />
            </div>
          </div>

          {view === 'lista' ? (
            <div id="past-view-panel-lista" role="tabpanel" aria-labelledby="past-view-tab-lista" className="flex flex-col gap-6">
              <Tabs
                name="past-filter"
                label="Mostrar no roteiro"
                value={filter}
                onChange={(v) => setFilter(v as ListFilter)}
                items={[
                  { value: 'tudo', label: 'Tudo' },
                  { value: 'lugar', label: 'Lugares' },
                  { value: 'restaurante', label: 'Comida' },
                  { value: 'evento', label: 'Eventos' },
                ]}
              />
              {cities.map((city) => {
                const days = cityDays(city);
                const cityDaysShown = stopsByDay(city)
                  .map((d) => ({ ...d, shown: visible(d.stops) }))
                  .filter((d) => d.shown.length > 0);
                if (cityDaysShown.length === 0) return null;
                return (
                  <section key={city.id} aria-labelledby={`past-city-${city.id}`} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0.5">
                      <h3 id={`past-city-${city.id}`} className="m-0 flex items-center gap-2 text-(length:--text-lg) font-semibold text-foreground">
                        <Icon icon={MapPin} /> {city.city}
                      </h3>
                      <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                        {formatISOToDisplay(days[0]).slice(0, 5)} – {formatISOToDisplay(days[days.length - 1]).slice(0, 5)} ·{' '}
                        {countKind(city.stops, 'lugar')} lugares · {countKind(city.stops, 'restaurante')} restaurantes
                        {countKind(city.stops, 'evento') > 0 && ` · ${countKind(city.stops, 'evento')} ${countKind(city.stops, 'evento') === 1 ? 'evento' : 'eventos'}`}{' '}
                        · {eur(sumCost(city.stops))}
                      </p>
                    </div>
                    {cityDaysShown.map(({ dayISO, stops: dayAll, shown }) => (
                      <Card key={dayISO} className="gap-4 p-4">
                        <div className="flex flex-col gap-0.5">
                          <h4 className="m-0 flex items-center gap-2 text-(length:--text-lg) font-semibold text-foreground">
                            <Icon icon={CalendarDays} /> Dia {dayNumberOf(trip, dayISO)} · {formatISOToLongWeekday(dayISO)}
                          </h4>
                          <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                            Gasto do dia: {eur(sumCost(dayAll))} {brlApprox(sumCost(dayAll))}
                          </p>
                        </div>
                        <ul className="m-0 flex list-none flex-col p-0">
                          {shown.map((stop, i) => {
                            const stopPhotos = photosOfStop(stop.id);
                            return (
                            <TimelineStop
                              key={stop.id}
                              orderLabel={`${stop.time ? `${stop.time} · ` : ''}${STOP_KIND_LABEL[stop.kind]}`}
                              title={stop.name}
                              tags={
                                <>
                                  <CategoryTags
                                    tags={[{ key: 'price', icon: Wallet, label: priceLabel(stop) }]}
                                  />
                                  {stop.sourceUrl && (
                                    <a
                                      href={stop.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex min-h-11 items-center gap-1 text-(length:--text-sm) font-medium text-(--accent-dark) underline-offset-4 hover:underline"
                                    >
                                      <Icon icon={ExternalLink} /> Ver na agenda da época
                                    </a>
                                  )}
                                </>
                              }
                              description={stop.neighborhood}
                              photoSearchTitle={stop.wikiTitle}
                              photoUrl={stopPhotos[0]?.url}
                              photos={
                                stopPhotos.length > 0 && (
                                  <div className="flex flex-col gap-1.5">
                                    <StopPhotos
                                      placeName={stop.name}
                                      photos={stopPhotos.map((p) => ({
                                        id: p.id,
                                        url: p.url,
                                        label: `${stop.name}, foto adicionada por ${shortName(p.addedBy)}`,
                                        badge: <TravelerAvatar travelerId={p.addedBy} />,
                                      }))}
                                      onOpen={(photoId) => {
                                        const photo = stopPhotos.find((p) => p.id === photoId);
                                        if (photo) setViewer({ photo, placeName: stop.name });
                                      }}
                                    />
                                    <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                                      {photosByLabel(stopPhotos.map((p) => p.addedBy))}
                                    </p>
                                  </div>
                                )
                              }
                              fallbackIcon={KIND_ICON[stop.kind]}
                              skipped={false}
                              isLast={i === shown.length - 1}
                            />
                            );
                          })}
                        </ul>
                      </Card>
                    ))}
                  </section>
                );
              })}
            </div>
          ) : (
            <div id="past-view-panel-mapa" role="tabpanel" aria-labelledby="past-view-tab-mapa" className="flex flex-col gap-3">
              <Tabs
                name="past-map-city"
                label="Cidade no mapa"
                value={mapCity}
                onChange={setMapCity}
                items={[{ value: 'todas', label: 'Viagem toda' }, ...cities.map((c) => ({ value: c.id, label: c.city }))]}
              />
              <RouteMap
                key={mapCity}
                cityLabel={mapCity === 'todas' ? trip.destinationsLabel : mapCity}
                pins={pins}
                missingCount={0}
                showRoute
              />
              <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                O número no pino é o dia da viagem. A linha segue a ordem em que os lugares foram visitados.
              </p>
            </div>
          )}
        </section>
      </div>
      <ExamplePhotoDialog photo={viewer?.photo ?? null} placeName={viewer?.placeName ?? ''} onClose={() => setViewer(null)} />
    </ScreenShell>
  );
}
