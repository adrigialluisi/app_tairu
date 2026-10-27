import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

interface MiniMapProps {
  lat: number;
  lng: number;
  /** nome do lugar, pro leitor de tela ("Mapa: Café de los Angelitos") */
  label: string;
}

/** pino em gota bordô (--accent), o mesmo desenho do RouteMap, sem número */
const PIN = L.divIcon({
  className: 'mini-map-pin',
  html:
    '<svg width="28" height="40" viewBox="0 0 28 40" style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35))">' +
    '<path d="M14 1C6.8 1 1 6.8 1 14c0 9.4 10.9 22.3 12.2 23.8a1 1 0 0 0 1.6 0C16.1 36.3 27 23.4 27 14 27 6.8 21.2 1 14 1z" style="fill:var(--accent)" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="14" cy="14" r="4.5" fill="#fff"/></svg>',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
});

/**
 * Mapa pequeno da prévia do "Adicionar lugares" (ajustes-97): 140px, sem interação nenhuma (nem
 * arrastar, nem zoom), só pra ver onde o lugar fica. Mesmos tiles do RouteMap (OpenStreetMap, com
 * a atribuição obrigatória). Sem internet, fica o fundo cinza — o endereço está escrito logo acima.
 */
export function MiniMap({ lat, lng, label }: MiniMapProps) {
  return (
    <div role="img" aria-label={`Mapa: ${label}`} className="h-[140px] overflow-hidden rounded-lg border border-border bg-muted">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="size-full"
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[lat, lng]} icon={PIN} interactive={false} keyboard={false} />
      </MapContainer>
    </div>
  );
}
