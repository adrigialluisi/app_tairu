import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import styles from './StoryPlayer.module.css';

export interface StoryMapFocus {
  /** muda a cada slide de mapa — a linha é redesenhada quando muda */
  key: string;
  points: { lat: number; lng: number }[];
  /** etiquetas de cidade (slide da rota entre cidades) */
  labels?: { lat: number; lng: number; text: string }[];
  /** linha ligando os pontos na ordem */
  line: boolean;
}

function cityLabelIcon(text: string): L.DivIcon {
  return L.divIcon({
    className: 'story-city-label',
    html: `<span style="display:inline-block;transform:translate(-50%,-150%);white-space:nowrap;background:#fff;color:#1C1917;font-weight:600;font-size:13px;padding:4px 8px;border-radius:999px;box-shadow:0 1px 3px rgba(0,0,0,.3);">${text}</span>`,
    iconSize: [0, 0],
  });
}

/**
 * Leva o mapa até o foco do slide (voo animado, ou salto direto com
 * prefers-reduced-motion) e avisa quando chegou — só aí a linha da rota é
 * desenhada, pra dar a sensação de "seguir o roteiro".
 */
function FlyTo({ focus, reduceMotion, onArrive }: { focus: StoryMapFocus; reduceMotion: boolean; onArrive: () => void }) {
  const map = useMap();
  // ref: a função muda a cada render do pai, mas o voo só deve recomeçar quando o foco muda
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  useEffect(() => {
    if (focus.points.length === 0) return;
    const handleArrive = () => arriveRef.current();
    const bounds = L.latLngBounds(focus.points.map((p) => [p.lat, p.lng] as [number, number]));
    // espaço embaixo pro texto do slide e em cima pras barras de progresso
    const options = { paddingTopLeft: [40, 90] as [number, number], paddingBottomRight: [40, 240] as [number, number], maxZoom: 15 };
    if (reduceMotion) {
      map.fitBounds(bounds, { ...options, animate: false });
      handleArrive();
      return;
    }
    map.once('moveend', handleArrive);
    // garantia: se o mapa já estava no lugar, o voo pode não disparar moveend
    const fallback = setTimeout(handleArrive, 2600);
    map.flyToBounds(bounds, { ...options, duration: 2.2 });
    return () => {
      clearTimeout(fallback);
      map.off('moveend', handleArrive);
    };
  }, [focus, map, reduceMotion]);
  return null;
}

export function StoryMap({ focus, reduceMotion }: { focus: StoryMapFocus | null; reduceMotion: boolean }) {
  const [arrivedKey, setArrivedKey] = useState<string | null>(null);
  const arrived = focus !== null && arrivedKey === focus.key;
  const start = focus?.points[0] ?? { lat: 0, lng: 0 };

  return (
    <div className={styles.mapLayer} aria-hidden="true">
      <MapContainer
        center={[start.lat, start.lng]}
        zoom={5}
        zoomControl={false}
        attributionControl
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
      >
        {/* tiles do OpenStreetMap, os mesmos do Roteiro (CARTO saiu em 08/out: passou a exigir chave de API); os pinos daqui continuam como estão */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {focus && (
          <>
            <FlyTo focus={focus} reduceMotion={reduceMotion} onArrive={() => setArrivedKey(focus.key)} />
            {focus.points.map((p, i) => (
              <CircleMarker
                key={`${focus.key}-${i}`}
                center={[p.lat, p.lng]}
                radius={7}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#B23345', fillOpacity: 1 }}
              />
            ))}
            {focus.labels?.map((l) => (
              <Marker key={`${focus.key}-${l.text}`} position={[l.lat, l.lng]} icon={cityLabelIcon(l.text)} interactive={false} />
            ))}
            {focus.line && arrived && (
              <Polyline
                key={`line-${focus.key}`}
                positions={focus.points.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: '#B23345', weight: 4, opacity: 0.95, className: reduceMotion ? '' : 'story-route-draw' }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
