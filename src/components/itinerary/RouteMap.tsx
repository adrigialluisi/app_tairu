import { LocateFixed, Minus, Plus, Wifi } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';
import styles from './RouteMap.module.css';

export interface RouteMapPin {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  /** número do dia do roteiro (1-based), sempre presente mesmo se pulado */
  dayNumber: number;
  skipped: boolean;
  /** cor do dia (0 = 1º dia do destino → --map-day-1); sem ela, usa dayNumber - 1 */
  colorIndex?: number;
  /** número dentro do pino = ordem da parada no dia ("Parada 3"); sem ele, o pino mostra o dia (viagem passada) */
  order?: number;
  /** evento (data fixa): pino de outro formato, com ícone de calendário — fora da rota do dia */
  kind?: 'place' | 'event';
  /** título pra foto pequena do popup (Wikipedia, a mesma da parada) */
  photoTitle?: string;
  /** linha de detalhe do popup, no lugar de "Dia 2 · Parada 3" (ex.: "Dia 2 · Evento às 21:30") */
  detail?: string;
}

interface RouteMapProps {
  cityLabel: string;
  pins: RouteMapPin[];
  /** lugares marcados nesse destino sem coordenada (customLabel) — não aparecem no mapa */
  missingCount: number;
  /** liga os pinos (não pulados) numa linha só, na ordem recebida — roteiro de viagem passada (ajustes-76) */
  showRoute?: boolean;
  /** liga as paradas de CADA dia na ordem, com a cor do dia, e mostra a legenda dos dias (ajustes-80) */
  routeByDay?: boolean;
}

const DAY_COLOR_COUNT = 4;

function colorSlot(pin: RouteMapPin): number {
  return ((pin.colorIndex ?? pin.dayNumber - 1) % DAY_COLOR_COUNT) + 1;
}

/** ícone lucide CalendarDays (24×24), desenhado inline pro pino de evento */
const CALENDAR_PATHS =
  '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' +
  '<path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>';

/** gota do Google (lugar) e balão quadrado (evento), no mesmo quadro 28×40 — a ponta é o ponto no mapa */
const PLACE_SHAPE = 'M14 1C6.8 1 1 6.8 1 14c0 9.4 10.9 22.3 12.2 23.8a1 1 0 0 0 1.6 0C16.1 36.3 27 23.4 27 14 27 6.8 21.2 1 14 1z';
const EVENT_SHAPE = 'M5 1h18a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4h-5l-3.2 9.2a.85.85 0 0 1-1.6 0L10 29H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4z';

/**
 * Pino estilo Google Maps (ajustes-80): SVG inline via divIcon, 28×40 (34×48
 * quando selecionado), na cor do dia, com o número da parada em branco (ou o
 * calendário, no evento) e sombra leve. Pulado: cinza --map-skipped, "✕".
 */
function createPinIcon(pin: RouteMapPin, selected: boolean): L.DivIcon {
  const [w, h] = selected ? [34, 48] : [28, 40];
  const fill = pin.skipped ? 'var(--map-skipped)' : `var(--map-day-${colorSlot(pin)})`;
  const isEvent = pin.kind === 'event';
  const glyph = isEvent
    ? `<g transform="translate(7 8) scale(0.5833)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${CALENDAR_PATHS}</g>`
    : `<text x="14" y="18.5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="inherit">${
        pin.skipped ? '✕' : String(pin.order ?? pin.dayNumber)
      }</text>`;
  return L.divIcon({
    className: 'route-map-pin',
    html: `<svg width="${w}" height="${h}" viewBox="0 0 28 40" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));opacity:${pin.skipped ? 0.6 : 1}"><path d="${isEvent ? EVENT_SHAPE : PLACE_SHAPE}" style="fill:${fill}" stroke="#fff" stroke-width="2"/>${glyph}</svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 4],
  });
}

function fitToPins(map: L.Map, pins: RouteMapPin[]) {
  if (pins.length === 0) return;
  const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
}

/** Reenquadra quando o conjunto de pinos muda (troca de dia/destino), não a cada render. */
function FitBounds({ pins }: { pins: RouteMapPin[] }) {
  const map = useMap();
  const key = pins.map((p) => p.id).join('|');
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  useEffect(() => {
    fitToPins(map, pinsRef.current);
  }, [key, map]);
  return null;
}

/**
 * Fecha o popup do pino com Esc — não dá pra confiar que o Leaflet já faz
 * isso sozinho em toda versão sem testar de verdade, e o requisito de
 * acessibilidade é explícito (ver docs/ajustes-10-mapa-no-roteiro.md).
 */
function EscapeClosesPopup() {
  const map = useMap();
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') map.closePopup();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [map]);
  return null;
}

/**
 * Tiles do OpenStreetMap padrão, grátis e sem chave. O CARTO "Voyager" do
 * ajustes-80 saiu em 08/out/2026: passou a exigir chave de API e mostrava
 * "API KEY REQUIRED" no lugar do mapa. Pinos em gota e controles redondos
 * do ajustes-80 continuam. Detecta timeout de carregamento (sem
 * internet) — se nenhum tile carregar em alguns segundos, avisa o componente
 * pai em vez de deixar o mapa cinza/quebrado sem explicação.
 */
function TileLayerWithTimeout({ onStatusChange }: { onStatusChange: (ok: boolean) => void }) {
  const loadedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadedRef.current) onStatusChange(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onStatusChange]);

  return (
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      eventHandlers={{
        load: () => {
          loadedRef.current = true;
          onStatusChange(true);
        },
      }}
    />
  );
}

/** Popup no estilo do cartão do Google: foto pequena (quando tem), nome, bairro e "Dia 2 · Parada 3". */
function PinCard({ pin }: { pin: RouteMapPin }) {
  const photoUrl = usePlaceThumbnail(pin.photoTitle ?? '');
  const detail =
    pin.detail ?? (pin.skipped ? `Dia ${pin.dayNumber} · Pulado` : `Dia ${pin.dayNumber}${pin.order ? ` · Parada ${pin.order}` : ''}`);
  return (
    <div className={styles.popup}>
      {photoUrl && <img src={photoUrl} alt="" className={styles.popupPhoto} />}
      <div className={styles.popupText}>
        <span className={styles.popupName}>{pin.name}</span>
        <span className={styles.popupMeta}>{pin.neighborhood}</span>
        <span className={styles.popupMeta}>{detail}</span>
      </div>
    </div>
  );
}

export function RouteMap({ cityLabel, pins, missingCount, showRoute = false, routeByDay = false }: RouteMapProps) {
  const [tilesOk, setTilesOk] = useState<boolean | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // uma linha por dia, ligando as paradas (não puladas, sem eventos) na ordem da rota
  const dayRoutes = useMemo(() => {
    if (!routeByDay) return [];
    const byDay = new Map<number, RouteMapPin[]>();
    for (const p of pins) {
      if (p.skipped || p.kind === 'event') continue;
      byDay.set(p.dayNumber, [...(byDay.get(p.dayNumber) ?? []), p]);
    }
    return [...byDay.entries()]
      .map(([dayNumber, list]) => ({ dayNumber, list: [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) }))
      .filter((r) => r.list.length > 1);
  }, [pins, routeByDay]);

  // legenda: um item por dia presente no mapa, com a cor e o texto do dia
  const legend = useMemo(() => {
    if (!routeByDay) return [];
    const seen = new Map<number, RouteMapPin>();
    for (const p of pins) if (!p.skipped && !seen.has(p.dayNumber)) seen.set(p.dayNumber, p);
    return [...seen.values()].sort((a, b) => a.dayNumber - b.dayNumber);
  }, [pins, routeByDay]);

  if (pins.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateText}>
          Nenhum lugar com localização marcado pra {cityLabel} ainda.
          {missingCount > 0 &&
            ` (${missingCount} lugar${missingCount > 1 ? 'es' : ''} adicionado${missingCount > 1 ? 's' : ''} sem localização não aparece${missingCount > 1 ? 'm' : ''} no mapa.)`}
        </p>
      </div>
    );
  }

  if (tilesOk === false) {
    return (
      <div className={styles.fallback}>
        <p className={styles.fallbackText}>
          <Icon icon={Wifi} />{' '}
          Mapa precisa de internet — sem conexão agora. A lista continua funcionando normalmente.
        </p>
      </div>
    );
  }

  const controlClass = 'size-11 rounded-full border-transparent bg-background text-foreground shadow-md hover:bg-muted';

  return (
    <div className={styles.wrap}>
      <div className={styles.mapBox}>
        <MapContainer center={[pins[0].lat, pins[0].lng]} zoom={13} scrollWheelZoom={false} zoomControl={false} ref={setMap}>
          <TileLayerWithTimeout onStatusChange={setTilesOk} />
          <FitBounds pins={pins} />
          <EscapeClosesPopup />
          {showRoute && (
            <Polyline
              positions={pins.filter((p) => !p.skipped).map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: '#7E2331', weight: 3, opacity: 0.7, dashArray: '6 6' }}
            />
          )}
          {dayRoutes.map((r) => (
            <Polyline
              key={`route-${r.dayNumber}`}
              positions={r.list.map((p) => [p.lat, p.lng] as [number, number])}
              // a cor vem do token pela classe (o atributo stroke do Leaflet não aceita var())
              pathOptions={{ weight: 4, opacity: 0.85, className: `route-day-${colorSlot(r.list[0])}` }}
            />
          ))}
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createPinIcon(pin, pin.id === selectedId)}
              zIndexOffset={pin.id === selectedId ? 1000 : 0}
              eventHandlers={{
                popupopen: () => setSelectedId(pin.id),
                popupclose: () => setSelectedId((cur) => (cur === pin.id ? null : cur)),
              }}
            >
              <Popup closeButton={false}>
                <PinCard pin={pin} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* controles no canto inferior direito, como no Google Maps (o zoom padrão do Leaflet fica desligado) */}
        {map && (
          <div className={styles.controls}>
            <Button
              variant="secondary"
              iconOnly
              className={controlClass}
              aria-label="Centralizar nos lugares"
              onClick={() => fitToPins(map, pins)}
            >
              <Icon icon={LocateFixed} />
            </Button>
            <div className={styles.zoomGroup}>
              <Button variant="secondary" iconOnly className={controlClass} aria-label="Aproximar" onClick={() => map.zoomIn()}>
                <Icon icon={Plus} />
              </Button>
              <Button variant="secondary" iconOnly className={controlClass} aria-label="Afastar" onClick={() => map.zoomOut()}>
                <Icon icon={Minus} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {legend.length > 1 && (
        <ul className={styles.legend} aria-label="Cores dos dias no mapa">
          {legend.map((p) => (
            <li key={p.dayNumber} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ background: `var(--map-day-${colorSlot(p)})` }} aria-hidden="true" />
              Dia {p.dayNumber}
            </li>
          ))}
        </ul>
      )}

      {missingCount > 0 && (
        <p className={styles.missingNote}>
          {missingCount} lugar{missingCount > 1 ? 'es' : ''} sem localização não aparece{missingCount > 1 ? 'm' : ''}{' '}
          aqui — só na lista.
        </p>
      )}
    </div>
  );
}
