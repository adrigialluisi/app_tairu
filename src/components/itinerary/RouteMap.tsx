import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
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
}

interface RouteMapProps {
  cityLabel: string;
  pins: RouteMapPin[];
  /** lugares marcados nesse destino sem coordenada (customLabel) — não aparecem no mapa */
  missingCount: number;
}

const DAY_COLORS = ['#B23345', '#1D5B7A', '#8A5A1F', '#3E7A6B', '#5B4B8A', '#A34A9A', '#4C6A70', '#7E2331'];

function createDayIcon(dayNumber: number, skipped: boolean): L.DivIcon {
  const color = skipped ? '#726c5e' : DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  const glyph = skipped ? '✕' : String(dayNumber);
  const opacity = skipped ? 0.55 : 1;
  return L.divIcon({
    className: 'route-map-pin',
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};opacity:${opacity};transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);border:2px solid #fff;box-sizing:border-box;"><span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:12px;line-height:1;">${glyph}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

function FitBounds({ pins }: { pins: RouteMapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [pins, map]);
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
 * Detecta timeout de carregamento dos tiles (sem internet, ou OSM
 * inacessível) — se nenhum tile carregar em alguns segundos, avisa o
 * componente pai em vez de deixar o mapa cinza/quebrado sem explicação.
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
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      eventHandlers={{
        load: () => {
          loadedRef.current = true;
          onStatusChange(true);
        },
      }}
    />
  );
}

export function RouteMap({ cityLabel, pins, missingCount }: RouteMapProps) {
  const [tilesOk, setTilesOk] = useState<boolean | null>(null);

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
          <span aria-hidden="true">📡 </span>
          Mapa precisa de internet — sem conexão agora. A lista continua funcionando normalmente.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.mapBox}>
        <MapContainer center={[pins[0].lat, pins[0].lng]} zoom={13} scrollWheelZoom={false}>
          <TileLayerWithTimeout onStatusChange={setTilesOk} />
          <FitBounds pins={pins} />
          <EscapeClosesPopup />
          {pins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createDayIcon(pin.dayNumber, pin.skipped)}>
              <Popup>
                <div className={styles.popup}>
                  <span className={styles.popupName}>{pin.name}</span>
                  <span className={styles.popupMeta}>{pin.neighborhood}</span>
                  <span className={styles.popupMeta}>{pin.skipped ? 'Pulado' : `Dia ${pin.dayNumber}`}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {missingCount > 0 && (
        <p className={styles.missingNote}>
          {missingCount} lugar{missingCount > 1 ? 'es' : ''} sem localização não aparece{missingCount > 1 ? 'm' : ''}{' '}
          aqui — só na lista.
        </p>
      )}
    </div>
  );
}
