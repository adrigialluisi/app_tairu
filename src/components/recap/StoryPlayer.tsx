import { Pause, Play, Share2, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { ExamplePastTrip, PastTripCity, PastTripStop } from '../../data/examplePastTrips';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { formatISOToDisplay } from '../../utils/dateMask';
import {
  allStops,
  busiestDay,
  cityDays,
  dayNumberOf,
  formatKm,
  pathKm,
  photosByLabel,
  shortName,
  tripDayCount,
  withPlacesOnly,
} from '../../utils/pastTrip';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';
import { StoryMap, type StoryMapFocus } from './StoryMap';
import { TravelerAvatar } from './TravelerAvatar';
import styles from './StoryPlayer.module.css';

export interface RecapPhoto {
  id: string;
  url: string;
  name: string;
  /** foto de exemplo (ajustes-78): nome do lugar, vira legenda no slide; foto do celular não tem */
  placeName?: string;
  /** foto de exemplo: "Berthold Werner · CC BY-SA 4.0" (crédito obrigatório do Wikimedia Commons) */
  credit?: string;
  /** foto de exemplo: página do arquivo no Commons — vai no cartão "Créditos das fotos" (ajustes-91) */
  sourceUrl?: string;
  /** foto em pé (medida ao abrir a recordação): vai de preferência em tela cheia (ajustes-91) */
  portrait?: boolean;
  /** ExampleTraveler.id de quem adicionou (ajustes-79); foto do celular = "voce" */
  addedBy?: string;
}

/*
  Cartões de foto (ajustes-91, substituem a grade de 4 do "Lisboa em fotos"): a maioria em tela
  cheia com zoom lento, alternando com montagens de 2 (split) e 3 (hero) pra dar ritmo. Nunca
  grade de 4 ou mais. Créditos saem de cima das fotos e vão pro cartão "Créditos das fotos".
*/
type PhotoLayout = 'photo-full' | 'photo-split' | 'photo-hero';

type Slide =
  | { kind: 'cover' }
  | { kind: 'numbers' }
  | { kind: 'route' }
  | { kind: 'city-map'; cityIndex: number }
  | { kind: PhotoLayout; cityIndex: number; photos: RecapPhoto[] }
  /** cidade sem foto escolhida: foto real do lugar (Wikipedia), em tela cheia */
  | { kind: 'place-full'; cityIndex: number; stop: PastTripStop }
  | { kind: 'highlight' }
  | { kind: 'credits' }
  | { kind: 'outro' };

const DURATION: Record<Slide['kind'], number> = {
  cover: 4000,
  numbers: 6000,
  route: 6500,
  'city-map': 7000,
  // foto cheia ~3,5 s; montagens ~4,5 s (têm mais pra ver)
  'photo-full': 3500,
  'place-full': 3500,
  'photo-split': 4500,
  'photo-hero': 4500,
  highlight: 5500,
  credits: 9000,
  outro: Number.POSITIVE_INFINITY, // último slide fica parado, com as ações
};

/** cidade sem foto escolhida: quantos lugares viram foto cheia (Wikipedia) */
const FALLBACK_PLACES = 3;
/** ritmo por cidade: cheia → 2 → cheia → 3 → cheia… */
const LAYOUT_CYCLE: PhotoLayout[] = ['photo-full', 'photo-split', 'photo-full', 'photo-hero'];

/** tira `count` fotos da fila, de preferência as que `prefer` aceita (na ordem do roteiro) */
function takeFrom(queue: RecapPhoto[], count: number, prefer: (p: RecapPhoto) => boolean): RecapPhoto[] {
  const order = new Map(queue.map((p, i) => [p, i]));
  const picked = queue.filter(prefer).slice(0, count);
  for (const p of queue) if (picked.length < count && !picked.includes(p)) picked.push(p);
  for (const p of picked) queue.splice(queue.indexOf(p), 1);
  // devolve na ordem do roteiro
  return picked.sort((a, b) => order.get(a)! - order.get(b)!);
}

/** foto em pé → tela cheia; deitadas → montagem de 2. Sobrou pouco, a montagem encolhe. */
function layoutPhotos(photos: RecapPhoto[]): { kind: PhotoLayout; photos: RecapPhoto[] }[] {
  const queue = [...photos];
  const out: { kind: PhotoLayout; photos: RecapPhoto[] }[] = [];
  let step = 0;
  while (queue.length > 0) {
    let kind = LAYOUT_CYCLE[step % LAYOUT_CYCLE.length];
    if (kind === 'photo-hero' && queue.length < 3) kind = queue.length === 2 ? 'photo-split' : 'photo-full';
    if (kind === 'photo-split' && queue.length < 2) kind = 'photo-full';
    if (kind === 'photo-full') out.push({ kind, photos: takeFrom(queue, 1, (p) => !!p.portrait) });
    else if (kind === 'photo-split') out.push({ kind, photos: takeFrom(queue, 2, (p) => !p.portrait) });
    else out.push({ kind, photos: takeFrom(queue, 3, () => true) });
    step++;
  }
  return out;
}
/** toque mais longo que isto é "segurar pra pausar", não "avançar" */
const HOLD_MS = 250;

function buildSlides(cities: PastTripCity[], photos: Record<string, RecapPhoto[]>): Slide[] {
  const slides: Slide[] = [{ kind: 'cover' }, { kind: 'numbers' }];
  if (cities.length > 1) slides.push({ kind: 'route' });
  cities.forEach((city, cityIndex) => {
    // o mapa da cidade é o "título da cidade" antes das fotos dela
    slides.push({ kind: 'city-map', cityIndex });
    const mine = photos[city.id] ?? [];
    if (mine.length === 0) {
      for (const stop of spreadStops(city.stops, FALLBACK_PLACES)) slides.push({ kind: 'place-full', cityIndex, stop });
    } else {
      for (const card of layoutPhotos(mine)) slides.push({ ...card, cityIndex });
    }
  });
  slides.push({ kind: 'highlight' });
  if (Object.values(photos).some((list) => list.some((p) => p.credit))) slides.push({ kind: 'credits' });
  slides.push({ kind: 'outro' });
  return slides;
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduce;
}

/** Número que sobe até o valor final (estilo retrospectiva); com movimento reduzido, já aparece pronto. */
function CountUp({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }
    // setInterval (e não requestAnimationFrame): o rAF para quando a aba fica em segundo plano
    const start = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1200);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value, reduceMotion]);
  return <>{shown.toLocaleString('pt-BR')}</>;
}

/** "Castelo de São Jorge · por Camila" — legenda da foto, sem crédito (que fica no cartão de créditos) */
function captionOf(p: RecapPhoto, cityName: string): string {
  return `${p.placeName ?? cityName}${p.addedBy ? ` · por ${shortName(p.addedBy)}` : ''}`;
}

interface PhotoFrameProps {
  url: string | null;
  caption: string;
  /** zoom lento (Ken Burns) na foto cheia; com movimento reduzido, parada */
  zoom?: { durationMs: number; paused: boolean } | null;
  small?: boolean;
}

/** Uma foto da montagem: cobre o espaço todo, legenda no rodapé sobre degradê escuro. */
function PhotoFrame({ url, caption, zoom = null, small = false }: PhotoFrameProps) {
  return (
    <figure className={styles.frame}>
      {url ? (
        <img
          src={url}
          alt=""
          className={`${styles.frameImg} ${zoom ? styles.kenBurns : ''}`}
          style={zoom ? { animationDuration: `${zoom.durationMs}ms`, animationPlayState: zoom.paused ? 'paused' : 'running' } : undefined}
        />
      ) : (
        <span className={styles.tileEmpty} aria-hidden="true" />
      )}
      <figcaption className={`${styles.frameCaption} ${small ? styles.frameCaptionSmall : ''}`}>{caption}</figcaption>
    </figure>
  );
}

/** Foto real do lugar (Wikipedia) quando a pessoa não escolheu fotos da cidade. */
function PlacePhotoFull({ stop, zoom }: { stop: PastTripStop; zoom: PhotoFrameProps['zoom'] }) {
  const url = usePlaceThumbnail(stop.wikiTitle ?? '');
  return <PhotoFrame url={url} caption={stop.name} zoom={zoom} />;
}

/** Lugares espalhados pelo roteiro da cidade (não só os do primeiro dia). */
function spreadStops(stops: PastTripStop[], count: number): PastTripStop[] {
  if (stops.length <= count) return stops;
  return Array.from({ length: count }, (_, i) => stops[Math.round((i * (stops.length - 1)) / (count - 1))]);
}

interface StoryPlayerProps {
  trip: ExamplePastTrip & { cities: PastTripCity[] };
  photos: Record<string, RecapPhoto[]>;
  onClose: () => void;
}

/**
 * Recordação no formato "stories" (docs/ajustes-76-viagem-passada-e-recordacao.md):
 * capa → números → rota entre as cidades → [mapa da cidade → fotos da cidade] × N
 * → dia mais cheio → fecho com o mapa completo. Só dado real do roteiro, com
 * frases-modelo (sem IA generativa). Toque à direita avança, à esquerda volta,
 * segurar pausa; setas/Espaço/Esc no teclado; botão de pausa sempre visível
 * (WCAG 2.2.2 — conteúdo que avança sozinho precisa poder ser pausado).
 */
export function StoryPlayer({ trip, photos, onClose }: StoryPlayerProps) {
  const reduceMotion = usePrefersReducedMotion();
  // a história mostra só os LUGARES (restaurantes e eventos ficam na tela da viagem passada — ajustes-77);
  // os km continuam calculados pelo roteiro completo, pra bater com a tela da viagem
  const placeTrip = useMemo(() => withPlacesOnly(trip), [trip]);
  const cities = placeTrip.cities;
  const slides = useMemo(() => buildSlides(cities, photos), [cities, photos]);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const pressStart = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  const slide = slides[index];
  const duration = DURATION[slide.kind];
  const stops = allStops(placeTrip);
  const totalKm = pathKm(allStops(trip));
  const busiest = busiestDay(placeTrip);
  // quem tem foto na recordação (fecho, ajustes-79) — só fotos escolhidas, não as da Wikipedia
  const contributors = [
    ...new Set(
      Object.values(photos)
        .flat()
        .map((p) => p.addedBy)
        .filter((id): id is string => !!id),
    ),
  ];

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
      setElapsed(0);
    },
    [slides.length],
  );

  // relógio do slide: pausa no botão, ao segurar e com a aba escondida
  useEffect(() => {
    if (paused || held || !Number.isFinite(duration)) return;
    const step = 50;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setElapsed((e) => e + step);
    }, step);
    return () => clearInterval(timer);
  }, [paused, held, duration, index]);

  useEffect(() => {
    if (elapsed >= duration) go(index + 1);
  }, [elapsed, duration, index, go]);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, go, onClose]);

  // foco do mapa de cada slide — memo por slide, pra o voo só recomeçar ao trocar de slide
  const focus: StoryMapFocus | null = useMemo(() => {
    if (slide.kind === 'route') {
      return {
        key: 'route',
        points: cities.map((c) => ({ lat: c.lat, lng: c.lng })),
        labels: cities.map((c) => ({ lat: c.lat, lng: c.lng, text: c.city })),
        line: true,
      };
    }
    if (slide.kind === 'city-map') {
      const city = cities[slide.cityIndex];
      return { key: `city-${city.id}`, points: city.stops, line: true };
    }
    if (slide.kind === 'outro') {
      return {
        key: 'outro',
        points: stops,
        labels: cities.map((c) => ({ lat: c.lat, lng: c.lng, text: c.city })),
        line: true,
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  const lastFocus = useRef<StoryMapFocus | null>(null);
  if (focus) lastFocus.current = focus;
  const isMapSlide = focus !== null;

  function handlePointerDown() {
    pressStart.current = performance.now();
    setHeld(true);
  }
  function handlePointerUp(direction: -1 | 1) {
    return (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setHeld(false);
      if (performance.now() - pressStart.current < HOLD_MS) go(index + direction);
    };
  }

  async function share() {
    const text = `${trip.name} — ${trip.destinationsLabel}: ${tripDayCount(trip)} dias, ${stops.length} lugares, ≈ ${formatKm(totalKm)}. Planejado no Tairu.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: trip.name, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote('Resumo copiado.');
    } catch {
      setShareNote('Não deu pra compartilhar agora.');
    }
  }

  function renderSlide() {
    switch (slide.kind) {
      case 'cover':
        return (
          <div className={`${styles.slide} ${styles.bgAccent}`}>
            <p className={styles.eyebrow}>Recordação · Tairu</p>
            <h2 className={styles.display}>{trip.name}</h2>
            <p className={styles.lead}>{trip.destinationsLabel}</p>
            <p className={styles.body}>
              {formatISOToDisplay(trip.startISO)} a {formatISOToDisplay(trip.endISO)} · {trip.companionsLabel}
            </p>
          </div>
        );
      case 'numbers':
        return (
          <div className={`${styles.slide} ${styles.bgDark}`}>
            <p className={styles.eyebrow}>A viagem em números</p>
            <dl className={styles.numbers}>
              {[
                { v: tripDayCount(trip), l: 'dias de viagem' },
                { v: cities.length, l: cities.length === 1 ? 'cidade' : 'cidades' },
                { v: stops.length, l: 'lugares visitados' },
                { v: Math.round(totalKm), l: 'km percorridos*' },
              ].map((n, i) => (
                <div key={n.l} className={styles.numberRow} style={{ animationDelay: `${i * 250}ms` }}>
                  <dt className={styles.numberLabel}>{n.l}</dt>
                  <dd className={styles.numberValue}>
                    <CountUp value={n.v} reduceMotion={reduceMotion} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.footnote}>* em linha reta entre os lugares, na ordem do roteiro</p>
          </div>
        );
      case 'route': {
        const between = pathKm(cities);
        return (
          <div className={styles.mapPanel}>
            <p className={styles.eyebrow}>O caminho</p>
            <h2 className={styles.headline}>{cities.map((c) => c.city).join(' → ')}</h2>
            <p className={styles.body}>≈ {formatKm(between)} entre as cidades, em linha reta</p>
          </div>
        );
      }
      case 'city-map': {
        const city = cities[slide.cityIndex];
        const days = cityDays(city);
        const dayNums = days.map((d) => dayNumberOf(trip, d));
        return (
          <div className={styles.mapPanel}>
            <p className={styles.eyebrow}>
              Cidade {slide.cityIndex + 1} de {cities.length} · Dias {dayNums[0]}
              {dayNums.length > 1 ? `–${dayNums[dayNums.length - 1]}` : ''}
            </p>
            <h2 className={styles.headline}>{city.city}</h2>
            <p className={styles.body}>
              {city.stops.length} lugares em {days.length} {days.length === 1 ? 'dia' : 'dias'} · ≈ {formatKm(pathKm(trip.cities[slide.cityIndex].stops))}
            </p>
            <ul className={styles.chips}>
              {city.stops.slice(0, 4).map((s) => (
                <li key={s.id} className={styles.chip}>
                  {s.name}
                </li>
              ))}
              {city.stops.length > 4 && <li className={styles.chip}>+{city.stops.length - 4}</li>}
            </ul>
            {/* de onde vêm as fotos dessa cidade — o crédito de cada uma fica no cartão de créditos */}
            {(photos[city.id] ?? []).some((p) => p.credit) ? (
              <p className={styles.sourceLine}>Fotos de exemplo · Wikimedia Commons</p>
            ) : (photos[city.id] ?? []).length === 0 ? (
              <p className={styles.sourceLine}>Fotos dos lugares · Wikipedia</p>
            ) : null}
          </div>
        );
      }
      case 'photo-full':
      case 'photo-split':
      case 'photo-hero': {
        const city = cities[slide.cityIndex];
        const zoom = reduceMotion ? null : { durationMs: duration, paused: paused || held };
        const [first, ...rest] = slide.photos;
        return (
          <div className={`${styles.photoSlide} ${styles[slide.kind]}`}>
            {slide.kind === 'photo-full' ? (
              <PhotoFrame url={first.url} caption={captionOf(first, city.city)} zoom={zoom} />
            ) : slide.kind === 'photo-split' ? (
              slide.photos.map((p) => <PhotoFrame key={p.id} url={p.url} caption={captionOf(p, city.city)} small />)
            ) : (
              <>
                <PhotoFrame url={first.url} caption={captionOf(first, city.city)} />
                <div className={styles.heroRow}>
                  {rest.map((p) => (
                    <PhotoFrame key={p.id} url={p.url} caption={captionOf(p, city.city)} small />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      }
      case 'place-full':
        return (
          <div className={`${styles.photoSlide} ${styles['photo-full']}`}>
            <PlacePhotoFull
              stop={slide.stop}
              zoom={reduceMotion ? null : { durationMs: duration, paused: paused || held }}
            />
          </div>
        );
      case 'credits': {
        const credited = [
          ...new Map(
            Object.values(photos)
              .flat()
              .filter((p) => p.credit)
              .map((p) => [p.id, p]),
          ).values(),
        ];
        return (
          <div className={`${styles.slide} ${styles.bgDark} ${styles.creditsSlide}`}>
            <p className={styles.eyebrow}>Fotos de exemplo · Wikimedia Commons</p>
            <h2 className={styles.headline}>Créditos das fotos</h2>
            <ul className={styles.creditsList}>
              {credited.map((p) => (
                <li key={p.id}>
                  <span className={styles.creditPlace}>{p.placeName}</span> — {p.credit} ·{' '}
                  {p.sourceUrl ? (
                    <a href={p.sourceUrl} target="_blank" rel="noreferrer" className={styles.creditLink}>
                      Wikimedia Commons
                    </a>
                  ) : (
                    'Wikimedia Commons'
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      case 'highlight':
        return (
          <div className={`${styles.slide} ${styles.bgAccent}`}>
            <p className={styles.eyebrow}>O dia mais cheio</p>
            {busiest && (
              <>
                <h2 className={styles.display}>Dia {dayNumberOf(trip, busiest.dayISO)}</h2>
                <p className={styles.lead}>
                  {busiest.count} lugares em {busiest.city}, num dia só
                </p>
                <ol className={styles.highlightList}>
                  {stops
                    .filter((s) => s.dayISO === busiest.dayISO)
                    .map((s) => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                </ol>
              </>
            )}
          </div>
        );
      case 'outro':
        return (
          <div className={`${styles.mapPanel} ${styles.outroPanel}`}>
            <p className={styles.eyebrow}>Foi assim</p>
            <h2 className={styles.headline}>{trip.name}</h2>
            <p className={styles.body}>
              {tripDayCount(trip)} dias · {cities.length} cidades · {stops.length} lugares · ≈ {formatKm(totalKm)}
            </p>
            {contributors.length > 0 && (
              <p className={styles.contributors}>
                <span className={styles.contributorAvatars}>
                  {contributors.map((id) => (
                    <TravelerAvatar key={id} travelerId={id} />
                  ))}
                </span>
                {photosByLabel(contributors, true)}
              </p>
            )}
            <div className={styles.outroActions}>
              <Button variant="primary" fullWidth onClick={share}>
                <Icon icon={Share2} /> Compartilhar
              </Button>
              <div className={styles.outroRow}>
                <Button variant="secondary" className="min-w-0 flex-1" onClick={() => go(0)}>
                  <Icon icon={RotateCcw} /> Ver de novo
                </Button>
                <Button variant="secondary" className="min-w-0 flex-1" onClick={onClose}>
                  Fechar
                </Button>
              </div>
              <p className={styles.shareNote} role="status">
                {shareNote}
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <div
      ref={dialogRef}
      className={styles.player}
      role="dialog"
      aria-modal="true"
      aria-label={`Recordação: ${trip.name}`}
      tabIndex={-1}
    >
      <div className={`${styles.mapWrap} ${isMapSlide ? styles.mapVisible : ''}`}>
        <StoryMap focus={isMapSlide ? focus : lastFocus.current} reduceMotion={reduceMotion} />
      </div>

      {/* zonas de toque: atrás do conteúdo, que só intercepta onde há botão */}
      {slide.kind !== 'outro' && (
        <div className={styles.tapZones}>
          <button
            type="button"
            className={styles.tapPrev}
            aria-label="Slide anterior"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp(-1)}
            onPointerLeave={() => setHeld(false)}
            onClick={(e) => e.detail === 0 && go(index - 1)}
          />
          <button
            type="button"
            className={styles.tapNext}
            aria-label="Próximo slide"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp(1)}
            onPointerLeave={() => setHeld(false)}
            onClick={(e) => e.detail === 0 && go(index + 1)}
          />
        </div>
      )}

      <div key={index} className={`${styles.content} ${reduceMotion ? '' : styles.enter}`} aria-live="polite">
        {renderSlide()}
      </div>

      <div className={styles.top}>
        <div className={styles.bars} aria-hidden="true">
          {slides.map((_, i) => (
            <span key={i} className={styles.bar}>
              <span
                className={styles.barFill}
                style={{
                  width: i < index ? '100%' : i > index ? '0%' : Number.isFinite(duration) ? `${Math.min(100, (elapsed / duration) * 100)}%` : '100%',
                }}
              />
            </span>
          ))}
        </div>
        <div className={styles.topRow}>
          <span className={styles.counter}>
            {index + 1} de {slides.length}
          </span>
          <div className={styles.topActions}>
            {slide.kind !== 'outro' && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Continuar' : 'Pausar'}
              >
                <Icon icon={paused ? Play : Pause} />
              </button>
            )}
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar recordação">
              <Icon icon={X} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
