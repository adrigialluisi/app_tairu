import { haversineKm } from './geo.ts';

/*
  Busca ao vivo de lugares no OpenStreetMap pelo Photon (photon.komoot.io, grátis e sem chave) —
  "Outros lugares em {cidade}" do "Adicionar lugares" (ajustes-97). Terceira exceção de internet do
  protótipo, depois do mapa e das fotos da Wikipedia: se o Photon falhar (sem internet, erro ou mais
  de 4 s), o grupo some sem mensagem e a busca continua com os lugares do app.
  A leitura da resposta é pura (sem fetch), pra rodar no `node --test` (photon.test.ts).
*/

export interface OsmPlace {
  /** "N123" / "W456" / "R789" (tipo + id do OpenStreetMap) */
  osmId: string;
  name: string;
  lat: number;
  lng: number;
  /** "Av. de Mayo 1370, Monserrat" — rua (+ número) e bairro, o que existir */
  address: string;
  /** categoria do app (gastronomia, cultura, natureza, compras) ou 'lugar' */
  category: string;
}

export const PHOTON_URL = 'https://photon.komoot.io/api/';
/** além disso do centro da cidade, não é da cidade (ajustes-97) */
export const MAX_DISTANCE_KM = 40;
/** mesmo nome a menos disso de um lugar já listado = o mesmo lugar */
export const SAME_PLACE_KM = 0.15;
export const PHOTON_TIMEOUT_MS = 4000;

const CATEGORY_BY_OSM_VALUE: Record<string, string> = {
  restaurant: 'gastronomia',
  cafe: 'gastronomia',
  bar: 'gastronomia',
  museum: 'cultura',
  gallery: 'cultura',
  theatre: 'cultura',
  attraction: 'cultura',
  monument: 'cultura',
  park: 'natureza',
  garden: 'natureza',
  viewpoint: 'natureza',
  beach: 'natureza',
  marketplace: 'compras',
  shop: 'compras',
  mall: 'compras',
};

/** osm_value do Photon → categoria do app; o resto vira 'lugar' (ícone genérico) */
export function photonCategory(osmKey: string | undefined, osmValue: string | undefined): string {
  if (osmValue && CATEGORY_BY_OSM_VALUE[osmValue]) return CATEGORY_BY_OSM_VALUE[osmValue];
  // qualquer loja (osm_key "shop", ex.: shop=books) também é compras
  if (osmKey === 'shop') return 'compras';
  return 'lugar';
}

export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** distância de edição (Levenshtein) entre duas palavras curtas */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * O nome tem a ver com o que a pessoa digitou (ajustes-99)? Sem acento nem maiúscula, o nome precisa
 * conter o texto (o que inclui começar com ele). Só com 6+ letras aceita 1 erro de digitação: o texto
 * contra cada trecho do nome com o mesmo número de palavras ("tortonni" → "Tortoni"). "malba" nunca
 * traz "Malta" — o Photon devolve parecidos por conta própria.
 */
export function matchesQuery(name: string, query: string): boolean {
  const n = normalizeName(name);
  const q = normalizeName(query);
  if (!q) return true;
  if (n.includes(q)) return true;
  if (q.replace(/ /g, '').length < 6) return false;
  const words = n.split(' ');
  const size = q.split(' ').length;
  for (let i = 0; i + size <= words.length; i++) {
    if (editDistance(words.slice(i, i + size).join(' '), q) <= 1) return true;
  }
  return false;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    locality?: string;
  };
}

/**
 * Lê a resposta do Photon: só lugares com nome e coordenada, cujo nome bate com o texto digitado
 * (`query`, matchesQuery — ajustes-99), a até MAX_DISTANCE_KM do centro da cidade (sem centro, não
 * filtra) e que não sejam um dos já listados (`exclude`: mesmo nome a menos de 150 m). Sem repetir o
 * mesmo lugar do OSM.
 */
export function parsePhoton(
  json: unknown,
  center: { lat: number; lng: number } | null,
  exclude: { name: string; lat: number; lng: number }[] = [],
  query = '',
): OsmPlace[] {
  const features = (json as { features?: PhotonFeature[] } | null)?.features ?? [];
  const seen = new Set<string>();
  const result: OsmPlace[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (!p.name || typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!matchesQuery(p.name, query)) continue;
    const here = { lat, lng };
    if (center && haversineKm(center, here) > MAX_DISTANCE_KM) continue;
    const name = normalizeName(p.name);
    if (exclude.some((x) => normalizeName(x.name) === name && haversineKm(x, here) < SAME_PLACE_KM)) continue;
    const osmId = `${(p.osm_type ?? '?').toUpperCase()}${p.osm_id ?? `${lat},${lng}`}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);
    const street = [p.street, p.housenumber].filter(Boolean).join(' ');
    const area = p.suburb ?? p.district ?? p.locality;
    result.push({
      osmId,
      name: p.name,
      lat,
      lng,
      address: [street, area].filter(Boolean).join(', '),
      category: photonCategory(p.osm_key, p.osm_value),
    });
  }
  return result;
}

/**
 * Busca no Photon perto do centro da cidade. Desiste em PHOTON_TIMEOUT_MS ou quando `signal`
 * cancela (nova tecla, folha fechada); qualquer falha devolve [] — quem chama só esconde o grupo.
 */
export async function searchPhoton(
  text: string,
  center: { lat: number; lng: number } | null,
  cityName: string,
  exclude: { name: string; lat: number; lng: number }[],
  signal?: AbortSignal,
): Promise<OsmPlace[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PHOTON_TIMEOUT_MS);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  try {
    // sem centro (cidade sem lugares no app), o nome da cidade vai no texto pra puxar pra perto
    const params = new URLSearchParams({ q: center ? text : `${text} ${cityName}`, limit: '8' });
    if (center) {
      params.set('lat', String(center.lat));
      params.set('lon', String(center.lng));
    }
    const response = await fetch(`${PHOTON_URL}?${params}`, { signal: controller.signal });
    if (!response.ok) return [];
    return parsePhoton(await response.json(), center, exclude, text);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
