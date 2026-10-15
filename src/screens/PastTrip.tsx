import { Camera, Landmark, List, Map as MapIcon, Sparkles, Ticket, UtensilsCrossed, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { Icon } from '../components/shell/Icon';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Tabs } from '../components/shell/Tabs';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { ExamplePhotoDialog, type AlbumPhoto, type AlbumPhotoItem } from '../components/recap/ExamplePhotoDialog';
import { TravelerAvatar } from '../components/recap/TravelerAvatar';
import {
  EXAMPLE_TRAVELERS,
  getExamplePastTrip,
  photosOfStop,
  type PastTripStop,
  type PastTripStopKind,
} from '../data/examplePastTrips';
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
import { formatISOToDisplay, formatISOToShortDay } from '../utils/dateMask';
import { formatMoney, RATES_AS_OF, RATES_SOURCE_LABEL, toBRL } from '../utils/money';
import { joinPt } from '../utils/retrospective';
import {
  allStops,
  costSummary,
  dayNumberOf,
  shortName,
  STOP_KIND_COST_LABEL,
  stopsByDay,
} from '../utils/pastTrip';
import styles from './PastTrip.module.css';

const KIND_ICON: Record<PastTripStopKind, LucideIcon> = {
  lugar: Landmark,
  restaurante: UtensilsCrossed,
  evento: Ticket,
};

/** mais que isso no lugar: 5 fotos + um quadrado "+N" */
const MAX_TILES = 6;

/** "€ 45,00" + "≈ R$ 264" — o valor pago fica na moeda em que foi pago, o real é só referência. */
function eur(amount: number): string {
  return formatMoney(amount, 'EUR');
}
function brlApprox(amountEUR: number): string {
  const brl = toBRL(amountEUR, 'EUR');
  return brl === null ? 'sem conversão' : `≈ ${formatMoney(brl, 'BRL')}`;
}

interface AlbumDay {
  dayISO: string;
  number: number;
  city: string;
  stops: PastTripStop[];
}

/** até 2 bairros do dia ("Baixa e Alfama"); sem bairro, a cidade */
function dayPlaces(day: AlbumDay): string {
  const counts = new Map<string, number>();
  for (const s of day.stops) if (s.neighborhood) counts.set(s.neighborhood, (counts.get(s.neighborhood) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n);
  return top.length > 0 ? joinPt(top) : day.city;
}

const dayId = (dayISO: string) => `dia-${dayISO}`;

/**
 * Viagem passada (rota /viagem-passada/:id) como ÁLBUM POR DIA (docs/ajustes-91-...md, que
 * substitui a lista com TimelineStop do ajustes-76/77): o que foi feito em cada dia e as fotos,
 * sem preço, categoria por extenso, descrição nem ações de planejamento.
 * - Topo: cidades, datas, quem foi e "Gerar recordação".
 * - Filtro por pessoa (Todos · Você · Camila · Bruno) — só filtra as fotos que aparecem.
 * - Faixa presa no topo: pílulas "Dia 1 · 10/05" (tocar leva ao dia) + Lista/Mapa em ícone.
 * - Cada dia: cabeçalho forte que fica preso logo abaixo das pílulas enquanto se rola o dia,
 *   divisória, e cada lugar numa linha (ícone + nome, "Adicionar foto" à direita) com as fotos
 *   em grade de 3, quadradas, com o avatar de quem adicionou.
 * - Tocar na foto abre em tela cheia, passando pelas fotos do mesmo dia.
 * O gasto da viagem (ajustes-77) continua, num cartão só, no fim.
 */
export function PastTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = getExamplePastTrip(id);
  const [view, setView] = useState<'lista' | 'mapa'>('lista');
  const [mapCity, setMapCity] = useState('todas');
  const [person, setPerson] = useState('todos');
  // fotos adicionadas agora (só no aparelho, como no roteiro em andamento) — por lugar
  const [added, setAdded] = useState<Record<string, AlbumPhoto[]>>({});
  const [viewer, setViewer] = useState<{ items: AlbumPhotoItem[]; index: number } | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [barHeight, setBarHeight] = useState(60);
  const heroUrl = usePlaceThumbnail(trip?.cityForPhoto ?? '');
  const barRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetStop = useRef<PastTripStop | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // altura da faixa presa: o cabeçalho do dia prende logo abaixo dela
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBarHeight(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  // pílula do dia em que a pessoa está: o último dia cujo começo já passou da faixa
  useEffect(() => {
    const scroller = albumRef.current?.closest('main');
    if (!scroller || view !== 'lista') return;
    function onScroll() {
      const limit = (barRef.current?.getBoundingClientRect().bottom ?? 0) + 8;
      const sections = [...(albumRef.current?.querySelectorAll<HTMLElement>('[data-day]') ?? [])];
      const current = sections.filter((sec) => sec.getBoundingClientRect().top <= limit).pop();
      setActiveDay(current?.dataset.day ?? sections[0]?.dataset.day ?? null);
    }
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [view]);

  if (!trip?.cities) return <Navigate to="/inicio" replace />;

  const cities = trip.cities;
  const stops = allStops(trip);
  const costs = costSummary(stops, trip.travelers);
  const maxKindTotal = Math.max(...costs.byKind.map((k) => k.total), 1);

  const days: AlbumDay[] = cities.flatMap((city) =>
    stopsByDay(city).map(({ dayISO, stops: dayStops }) => ({
      dayISO,
      number: dayNumberOf(trip, dayISO),
      city: city.city,
      stops: dayStops,
    })),
  );

  const photosOf = (stop: PastTripStop): AlbumPhoto[] => {
    const all: AlbumPhoto[] = [...photosOfStop(stop.id), ...(added[stop.id] ?? [])];
    return person === 'todos' ? all : all.filter((p) => p.addedBy === person);
  };

  const dayLabel = (day: AlbumDay) => `Dia ${day.number} · ${formatISOToShortDay(day.dayISO)}`;

  function openPhoto(day: AlbumDay, photoId: string) {
    const items: AlbumPhotoItem[] = day.stops.flatMap((stop) =>
      photosOf(stop).map((photo) => ({ photo, placeName: stop.name, dayLabel: dayLabel(day) })),
    );
    const index = items.findIndex((it) => it.photo.id === photoId);
    if (index >= 0) setViewer({ items, index });
  }

  function goToDay(dayISO: string) {
    const el = document.getElementById(dayId(dayISO));
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function pickPhotos(stop: PastTripStop) {
    targetStop.current = stop;
    fileRef.current?.click();
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const stop = targetStop.current;
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!stop || files.length === 0) return;
    const photos: AlbumPhoto[] = files.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return {
        id: `album-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        stopId: stop.id,
        url,
        author: '',
        license: '',
        sourcePage: '',
        addedBy: 'voce',
        local: true,
      };
    });
    setAdded((prev) => ({ ...prev, [stop.id]: [...(prev[stop.id] ?? []), ...photos] }));
  }

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

  const personItems = [
    { value: 'todos', label: 'Todos' },
    ...EXAMPLE_TRAVELERS.map((t) => ({ value: t.id, label: t.id === 'voce' ? 'Você' : shortName(t.id) })),
  ];

  return (
    <ScreenShell appBar={<AppBar title={trip.name} subtitle="Viagem passada" onBack={() => navigate('/inicio')} />}>
      <input ref={fileRef} type="file" accept="image/*" multiple className="visually-hidden" tabIndex={-1} onChange={handleFiles} />
      <div className="flex flex-col gap-6">
        {/* topo: cidades, datas, quem foi e a recordação */}
        <Card className="gap-0 overflow-hidden py-0">
          <div className="relative h-36 bg-(--placeholder)">
            {heroUrl && <img src={heroUrl} alt="" className="size-full object-cover" />}
            <Badge variant="neutral" className="absolute top-3 left-3">
              Exemplo
            </Badge>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1">
              <p className="m-0 text-(length:--text-lg) font-semibold text-foreground">{trip.destinationsLabel}</p>
              <div className="flex items-center gap-2">
                <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                  {formatISOToDisplay(trip.startISO)} – {formatISOToDisplay(trip.endISO)} · {trip.companionsLabel}
                </p>
                {/* quem viajou (fictícios, ajustes-79): os mesmos avatares das fotos */}
                <span
                  className="flex -space-x-1"
                  role="img"
                  aria-label={`Viajaram: ${EXAMPLE_TRAVELERS.map((t) => shortName(t.id)).join(', ')}`}
                >
                  {EXAMPLE_TRAVELERS.map((t) => (
                    <TravelerAvatar key={t.id} travelerId={t.id} />
                  ))}
                </span>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={() => navigate(`/viagem-passada/${trip.id}/recordacao`)}>
              <Icon icon={Sparkles} /> Gerar recordação
            </Button>
          </div>
        </Card>

        <Tabs name="past-person" label="Fotos de quem" value={person} onChange={setPerson} items={personItems} />

        {/* álbum: o pai da faixa presa e dos cabeçalhos de dia (o sticky só vale dentro dele) */}
        <section
          ref={albumRef}
          aria-label="Álbum da viagem por dia"
          className={styles.album}
          style={{ ['--bar-h' as string]: `${barHeight}px` }}
        >
          <div ref={barRef} className={styles.bar}>
            {view === 'lista' ? (
              <nav aria-label="Ir para o dia" className={styles.dayPills}>
                {days.map((d) => (
                  <button
                    key={d.dayISO}
                    type="button"
                    className={cn(styles.dayPill, activeDay === d.dayISO && styles.dayPillActive)}
                    aria-current={activeDay === d.dayISO ? 'true' : undefined}
                    onClick={() => goToDay(d.dayISO)}
                  >
                    Dia {d.number} · {formatISOToDisplay(d.dayISO).slice(0, 5)}
                  </button>
                ))}
              </nav>
            ) : (
              <span className="flex-1 text-(length:--text-base) font-semibold text-foreground">Mapa da viagem</span>
            )}
            <Tabs
              name="past-view"
              label="Ver como"
              iconOnly
              value={view}
              onChange={(v) => setView(v as 'lista' | 'mapa')}
              items={[
                { value: 'lista', label: 'Álbum', icon: List },
                { value: 'mapa', label: 'Mapa', icon: MapIcon },
              ]}
            />
          </div>

          {view === 'lista' ? (
            <div id="past-view-panel-lista" role="tabpanel" aria-labelledby="past-view-tab-lista" className={styles.days}>
              {days.map((day) => (
                <section
                  key={day.dayISO}
                  id={dayId(day.dayISO)}
                  data-day={day.dayISO}
                  className={styles.day}
                  aria-labelledby={`${dayId(day.dayISO)}-title`}
                >
                  <header className={styles.dayHeader}>
                    <h2 id={`${dayId(day.dayISO)}-title`} className={styles.dayTitle}>
                      {dayLabel(day)}
                    </h2>
                    <p className={styles.dayPlaces}>{dayPlaces(day)}</p>
                  </header>
                  <ul className={styles.places}>
                    {day.stops.map((stop) => {
                      const photos = photosOf(stop);
                      const overflow = photos.length > MAX_TILES;
                      const tiles = overflow ? photos.slice(0, MAX_TILES - 1) : photos;
                      return (
                        <li key={stop.id} className={styles.place}>
                          <div className={styles.placeRow}>
                            <Icon icon={KIND_ICON[stop.kind]} className={styles.placeIcon} />
                            <h3 className={styles.placeName}>{stop.name}</h3>
                            <button
                              type="button"
                              className={styles.addPhoto}
                              onClick={() => pickPhotos(stop)}
                              aria-label={`Adicionar foto de ${stop.name}`}
                            >
                              <Icon icon={Camera} /> Foto
                            </button>
                          </div>
                          {photos.length > 0 && (
                            <ul className={styles.grid} aria-label={`Fotos de ${stop.name}`}>
                              {tiles.map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    className={styles.tile}
                                    onClick={() => openPhoto(day, p.id)}
                                    aria-label={`${stop.name}, foto adicionada por ${shortName(p.addedBy)}: ver em tela cheia`}
                                  >
                                    <img src={p.url} alt="" loading="lazy" className={styles.tileImg} />
                                    <span className={styles.tileAvatar}>
                                      <TravelerAvatar travelerId={p.addedBy} />
                                    </span>
                                  </button>
                                </li>
                              ))}
                              {overflow && (
                                <li>
                                  <button
                                    type="button"
                                    className={styles.tile}
                                    onClick={() => openPhoto(day, photos[MAX_TILES - 1].id)}
                                    aria-label={`Ver mais ${photos.length - (MAX_TILES - 1)} fotos de ${stop.name}`}
                                  >
                                    <img src={photos[MAX_TILES - 1].url} alt="" loading="lazy" className={styles.tileImg} />
                                    {/* escuro a 60%: "+N" branco ≥ 5.74:1 mesmo sobre foto clara */}
                                    <span className={styles.more} aria-hidden="true">
                                      +{photos.length - (MAX_TILES - 1)}
                                    </span>
                                  </button>
                                </li>
                              )}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
              <p className="m-0 text-(length:--text-sm) text-muted-foreground">
                Fotos de exemplo: imagens do Wikimedia Commons, com o crédito de cada uma na foto aberta.
              </p>
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
      </div>
      <ExamplePhotoDialog
        items={viewer?.items ?? []}
        index={viewer?.index ?? null}
        onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
        onClose={() => setViewer(null)}
      />
    </ScreenShell>
  );
}
