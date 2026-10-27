import airportsRaw from './airports.json';
import citiesRaw from './cities.json';
import currenciesRaw from './currencies.json';
import placesRaw from './places.json';
import localTipsRaw from './localTips.json';
import hotelsRaw from './hotels.json';
import eventsRaw from './events.json';
import cityEventTemplatesRaw from './cityEventTemplates.json';
import type { QuizInterest, QuizDiscovery, StayType } from '../context/TripContext';

export interface CityEntry {
  id: string;
  city: string;
  country: string;
  currencyCode: string;
  /**
   * nomes de região conhecidos que levam a esta cidade (ajustes-86): "Deserto do Atacama" → San Pedro
   * de Atacama. Só onde é verdade — nunca inventar.
   */
  aliases?: string[];
  /** linha de apoio quando a busca casou pelo apelido: "base pra visitar o Deserto do Atacama" */
  aliasNote?: string;
}

/** resultado da busca de destino: `viaAlias` = casou pelo apelido, não pelo nome da cidade/país */
export type CityMatch = CityEntry & { viaAlias: boolean };

export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
}

export const cities: CityEntry[] = citiesRaw;
export const currencies: CurrencyEntry[] = currenciesRaw;

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');

function normalize(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS_RE, '').toLowerCase();
}

/** Autocomplete real: 2+ letras, ignora acento/caixa, casa cidade, país ou apelido de região (ajustes-86). */
export function searchCities(query: string, excludeIds: Set<string> = new Set()): CityMatch[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const matches: CityMatch[] = [];
  for (const c of cities) {
    if (excludeIds.has(c.id)) continue;
    if (normalize(c.city).includes(q) || normalize(c.country).includes(q)) matches.push({ ...c, viaAlias: false });
    else if (c.aliases?.some((alias) => normalize(alias).includes(q))) matches.push({ ...c, viaAlias: true });
  }
  return matches.slice(0, 8);
}

export function getCurrency(code: string): CurrencyEntry | undefined {
  return currencies.find((c) => c.code === code);
}

/**
 * Aeroporto real (ajustes-86, src/data/airports.json, fonte docs/dados/airports.json): código IATA,
 * nome curto do aeroporto e cidade. `cityId` liga com o cities.json quando a cidade existe lá;
 * `nearCityIds` = cidades do cities.json sem aeroporto próprio que ele atende (ex.: CJC → San Pedro).
 */
export interface AirportEntry {
  iata: string;
  name: string;
  city: string;
  country: string;
  cityId: string | null;
  nearCityIds?: string[];
}

export const airports: AirportEntry[] = airportsRaw as AirportEntry[];

/** "São Paulo – Guarulhos"; quando o aeroporto tem o nome da cidade, só a cidade ("Miami") */
export function airportLabel(a: AirportEntry): string {
  return a.name === a.city ? a.city : `${a.city} – ${a.name}`;
}

/** texto salvo no campo do voo: "São Paulo – Guarulhos (GRU)" — o código vai junto, no fim */
export function airportValue(a: AirportEntry): string {
  return `${airportLabel(a)} (${a.iata})`;
}

export function getAirport(iata: string): AirportEntry | undefined {
  return airports.find((a) => a.iata === iata.toUpperCase());
}

/** valor salvo → aeroporto, pelo "(XXX)" do fim; texto antigo/livre → undefined (só exibe o texto) */
export function airportFromValue(value: string): AirportEntry | undefined {
  const m = value.trim().match(/\(([A-Z]{3})\)$/);
  return m ? getAirport(m[1]) : undefined;
}

/** aeroportos da cidade (e os que a atendem de perto) — sugestão sem digitar no voo daquele destino */
export function airportsForCity(cityId: string): AirportEntry[] {
  return [
    ...airports.filter((a) => a.cityId === cityId),
    ...airports.filter((a) => a.nearCityIds?.includes(cityId)),
  ];
}

const cityNameById = new Map(cities.map((c) => [c.id, c.city]));

/**
 * Busca de aeroporto (2+ letras, sem acento/caixa): código, cidade, nome do aeroporto, país ou
 * cidade atendida — "gru", "guaru" e "são paulo" levam a GRU. Código exato vem primeiro, depois
 * código/cidade que começam com o texto, depois o resto.
 */
export function searchAirports(query: string): AirportEntry[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const rank = (a: AirportEntry): number => {
    const code = a.iata.toLowerCase();
    if (code === q) return 0;
    if (code.startsWith(q) || normalize(a.city).startsWith(q)) return 1;
    const near = (a.nearCityIds ?? []).map((id) => normalize(cityNameById.get(id) ?? ''));
    if (normalize(a.name).includes(q) || normalize(a.city).includes(q) || near.some((n) => n.includes(q))) return 2;
    if (normalize(a.country).includes(q)) return 3;
    return -1;
  };
  return airports
    .map((a) => ({ a, r: rank(a) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r)
    .slice(0, 8)
    .map((x) => x.a);
}

/** países que usam a moeda, tirados do cities.json (ex.: CLP → Chile) — pra busca por país no seletor de moeda */
const countriesByCurrency = new Map<string, string[]>();
for (const c of cities) {
  const list = countriesByCurrency.get(c.currencyCode) ?? [];
  if (!list.includes(c.country)) list.push(c.country);
  countriesByCurrency.set(c.currencyCode, list);
}

/**
 * Busca de moeda (ajustes-86): por código, nome ou país, sem acento/caixa — "peso", "chile" e
 * "clp" acham o Peso chileno. Busca vazia = todas.
 */
export function searchCurrencies(query: string): CurrencyEntry[] {
  const q = normalize(query.trim());
  if (!q) return currencies;
  return currencies.filter(
    (c) =>
      normalize(c.code).includes(q) ||
      normalize(c.name).includes(q) ||
      (countriesByCurrency.get(c.code) ?? []).some((country) => normalize(country).includes(q)),
  );
}

export interface PlaceEntry {
  id: string;
  cityId: string;
  name: string;
  neighborhood: string;
  categories: string[];
  description: string;
  lat: number;
  lng: number;
  /** opcional — só quando o nome do lugar não bate com o título exato do artigo na Wikipedia (ex.: precisa de desambiguação) */
  wikiTitle?: string;
  /** "turistico" (pontos mais conhecidos/visitados) ou "fora-do-circuito" — ver docs/ajustes-37-quiz-turistico-x-fora-circuito.md */
  popularity: 'turistico' | 'fora-do-circuito';
  /** foto local do Wikimedia Commons (ajustes-87); sem ela, a busca ao vivo na Wikipedia fica de reserva */
  photo?: PlacePhoto;
  /**
   * dias da semana em que funciona (0 = domingo … 6 = sábado), só onde faz diferença no roteiro
   * (ajustes-95): Feria de Mataderos [0]. A divisão dos dias respeita; o card e a parada dizem "Só aos domingos".
   */
  openDays?: number[];
}

/**
 * Foto salva no protótipo (public/places/{id}.jpg, ~800px), sempre de licença livre e com crédito.
 * `representative`: não existe foto livre do próprio lugar — é uma foto ilustrativa (ex.: outra
 * parrilla de Buenos Aires pro El Desnivel), e o crédito diz isso.
 */
export interface PlacePhoto {
  src: string;
  author: string;
  license: string;
  sourceUrl: string;
  representative?: boolean;
}

/** URL da foto local do lugar (com o base do Vite, como as fotos de public/memorias-exemplo), ou null */
export function placePhotoUrl(place: Pick<PlaceEntry, 'photo'> | undefined | null): string | null {
  return place?.photo ? `${import.meta.env.BASE_URL}${place.photo.src}` : null;
}

/** "Foto: autor · licença · Wikimedia Commons" — ou "Foto ilustrativa: …" quando não é do próprio lugar */
export function placePhotoCredit(photo: PlacePhoto): string {
  return `${photo.representative ? 'Foto ilustrativa' : 'Foto'}: ${photo.author} · ${photo.license} · Wikimedia Commons`;
}

export const places: PlaceEntry[] = placesRaw as PlaceEntry[];

export function getPlacesForCity(cityId: string): PlaceEntry[] {
  return places.filter((p) => p.cityId === cityId);
}

export function getPlaceById(id: string): PlaceEntry | undefined {
  return places.find((p) => p.id === id);
}

/**
 * Busca do topo das Sugestões (ajustes-87): lugares da cidade pelo nome (ou título da Wikipedia,
 * ex.: "caminito" acha "La Boca — Caminito") ou bairro, sem acento/caixa. Quem começa com o
 * texto vem antes.
 */
export function searchPlacesInCity(cityId: string, query: string): PlaceEntry[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const scored: { place: PlaceEntry; score: number }[] = [];
  for (const place of getPlacesForCity(cityId)) {
    const names = [place.name, place.wikiTitle ?? ''].map(normalize);
    const words = names.flatMap((n) => n.split(/[\s—-]+/));
    let score = -1;
    if (names.some((n) => n.startsWith(q)) || words.some((w) => w.startsWith(q))) score = 0;
    else if (names.some((n) => n.includes(q))) score = 1;
    else if (normalize(place.neighborhood).includes(q)) score = 2;
    if (score >= 0) scored.push({ place, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.place);
}

export const INTEREST_LABELS: Record<QuizInterest, string> = {
  gastronomia: 'Gastronomia',
  cultura: 'Cultura e história',
  natureza: 'Natureza',
  'vida-noturna': 'Vida noturna',
  compras: 'Compras',
};

export function formatCategories(categories: string[]): string {
  return categories.map((c) => INTEREST_LABELS[c as QuizInterest] ?? c).join(' · ');
}

/**
 * Ordenação por perfil (hipótese de produto): lugares cuja categoria bate
 * com os Interesses do Quiz vêm primeiro; como desempate, discovery
 * "turistico" prioriza lugares marcados popularity "turistico", discovery
 * "fora-do-circuito" prioriza popularity "fora-do-circuito" (ver
 * docs/ajustes-37-quiz-turistico-x-fora-circuito.md — substitui o critério
 * antigo de pace relax/urbano por categoria, que era redundante com a
 * pergunta de Interesses). `discovery` é múltipla escolha (herdado do
 * ajustes-18) — marcar os dois soma os dois bônus naturalmente. Sort é
 * estável, então empates mantêm a ordem original do dataset.
 */
export function rankPlacesByProfile(
  cityPlaces: PlaceEntry[],
  interests: QuizInterest[],
  discovery: QuizDiscovery[],
): PlaceEntry[] {
  function score(place: PlaceEntry): number {
    let s = 0;
    if (place.categories.some((c) => interests.includes(c as QuizInterest))) s += 2;
    if (discovery.includes('turistico') && place.popularity === 'turistico') s += 1;
    if (discovery.includes('fora-do-circuito') && place.popularity === 'fora-do-circuito') s += 1;
    return s;
  }
  return [...cityPlaces].sort((a, b) => score(b) - score(a));
}

export interface LocalTipCategory {
  category: string;
  label: string;
  tips: string[];
}

export interface LocalTipsForCity {
  cityId: string;
  categories: LocalTipCategory[];
}

export const localTips: LocalTipsForCity[] = localTipsRaw;

export function getLocalTipsForCity(cityId: string): LocalTipsForCity | undefined {
  return localTips.find((t) => t.cityId === cityId);
}

/**
 * "Também vale visitar" (Tela 4b, aba Dicas locais): 2-3 lugares da cidade
 * que o usuário NÃO marcou na Tela 4a, com a mesma ordenação por perfil.
 */
export function getAlsoWorthVisiting(
  cityId: string,
  excludePlaceIds: Set<string>,
  interests: QuizInterest[],
  discovery: QuizDiscovery[],
  count = 3,
): PlaceEntry[] {
  const candidates = getPlacesForCity(cityId).filter((p) => !excludePlaceIds.has(p.id));
  return rankPlacesByProfile(candidates, interests, discovery).slice(0, count);
}

export interface HotelEntry {
  id: string;
  cityId: string;
  name: string;
  type: StayType;
  address: string;
  neighborhood: string;
  locality: string;
  /** 1–5 quando existe classificação oficial; null quando não existe (aí vale o badge) */
  stars: number | null;
  badge: string | null;
  /** 1–4, relativo aos outros hotéis do mesmo destino */
  priceLevel: 1 | 2 | 3 | 4;
  distanceLabel: string;
  description: string;
  /** caminho relativo a public/, ex.: "hotels/ba-alvear-palace.jpg" */
  photo: string | null;
  photoSourceUrl: string;
  /** coordenada do OpenStreetMap (Nominatim, pelo nome ou número exato do endereço) — só onde bateu (ajustes-88) */
  lat?: number;
  lng?: number;
}

export const hotels: HotelEntry[] = hotelsRaw as HotelEntry[];

/**
 * Busca de hospedagem real, só dentro da cidade do destino. Com o campo
 * vazio (ou menos de 2 letras), devolve todos os hotéis da cidade — 5 por
 * cidade, cabe tudo, sem paginação. Com 2+ letras, filtra por nome, bairro
 * ou cidade (locality), ignorando acento/caixa (mesmo normalize() de
 * searchCities).
 */
export function searchHotels(cityId: string, query: string): HotelEntry[] {
  const inCity = hotels.filter((h) => h.cityId === cityId);
  const q = normalize(query.trim());
  if (q.length < 2) return inCity;
  return inCity.filter(
    (h) =>
      normalize(h.name).includes(q) ||
      normalize(h.neighborhood).includes(q) ||
      normalize(h.locality).includes(q),
  );
}

export function getHotel(id: string | null): HotelEntry | undefined {
  return id ? hotels.find((h) => h.id === id) : undefined;
}

export type EventKind =
  | 'show'
  | 'feira'
  | 'danca'
  | 'cerimonia'
  | 'ceu'
  | 'festival'
  | 'exposicao'
  | 'cinema'
  | 'esporte'
  | 'celebracao';

/**
 * Evento local num dia. Os reais (`events.json`) têm data fixa e foram
 * pesquisados com fonte (`sourceUrl`) e data de checagem (`checkedAt`) — ver
 * docs/ajustes-60-sugestoes-por-categoria-e-eventos.md. Exceção pedida pela
 * Adriana em 08/out/2026 (docs/ajustes-81-eventos-da-cidade-nas-datas.md):
 * eventos com `simulated: true` são FICTÍCIOS, gerados a partir de modelos por
 * dia da semana (`cityEventTemplates.json`) nas datas da viagem; não têm fonte
 * e a tela não mostra "Fonte".
 */
export interface EventEntry {
  id: string;
  cityId: string;
  name: string;
  kind: EventKind;
  /** ISO yyyy-mm-dd */
  date: string;
  time: string;
  venue: string;
  neighborhood: string;
  categories: string[];
  /** só nos reais; os gerados de modelo não têm */
  popularity?: 'turistico' | 'fora-do-circuito';
  price: string;
  description: string;
  lat: number | null;
  lng: number | null;
  sourceLabel?: string;
  sourceUrl?: string;
  checkedAt?: string;
  /** evento fictício gerado de modelo (ajustes-81) — só o roteiro do moderador sabe; a tela não sinaliza */
  simulated?: boolean;
  recurring?: string;
  note?: string;
}

export const events: EventEntry[] = eventsRaw as EventEntry[];

// ---------- eventos da cidade gerados nas datas da viagem (docs/ajustes-81-eventos-da-cidade-nas-datas.md) ----------

/** Modelo de evento fictício que acontece em certos dias da semana (0 = domingo … 6 = sábado). */
interface CityEventTemplate {
  id: string;
  name: string;
  kind: EventKind;
  weekdays: number[];
  time: string;
  venue: string;
  neighborhood: string;
  categories: string[];
  price: string;
  description: string;
  lat: number | null;
  lng: number | null;
}

const templateData = cityEventTemplatesRaw as { cities: Record<string, CityEventTemplate[]>; generic: CityEventTemplate[] };

/** índice templateId → cityId dos modelos das cidades do cenário (getEventById remonta o evento pelo id) */
const templateCity = new Map<string, string>(
  Object.entries(templateData.cities).flatMap(([cityId, list]) => list.map((t) => [t.id, cityId] as [string, string])),
);
const allTemplates = new Map<string, CityEventTemplate>(
  [...Object.values(templateData.cities).flat(), ...templateData.generic].map((t) => [t.id, t]),
);

/** máximo de eventos por dia vindos de modelo, contando os reais do dia */
const MAX_EVENTS_PER_DAY = 2;

/*
  Id estável de uma ocorrência: `${templateId}--${dateISO}` (marcar/desmarcar e o
  Roteiro continuam funcionando). Modelo genérico leva também a cidade
  (`${templateId}@${cityId}--${dateISO}`): assim getEventById acha o nome da
  cidade sozinho (em cities.json) e duas cidades sem lista própria no mesmo dia
  de fronteira não dividem o mesmo id.
*/
function occurrenceId(template: CityEventTemplate, cityId: string, dateISO: string): string {
  return templateCity.has(template.id) ? `${template.id}--${dateISO}` : `${template.id}@${cityId}--${dateISO}`;
}

function fillCity(text: string, cityName: string): string {
  return text.replaceAll('{city}', cityName);
}

function occurrence(template: CityEventTemplate, cityId: string, cityName: string, dateISO: string): EventEntry {
  return {
    id: occurrenceId(template, cityId, dateISO),
    cityId,
    name: fillCity(template.name, cityName),
    kind: template.kind,
    date: dateISO,
    time: template.time,
    venue: fillCity(template.venue, cityName),
    neighborhood: fillCity(template.neighborhood, cityName),
    categories: template.categories,
    price: template.price,
    description: fillCity(template.description, cityName),
    lat: template.lat,
    lng: template.lng,
    simulated: true,
  };
}

function cityNameOf(cityId: string): string {
  return cities.find((c) => c.id === cityId)?.city ?? '';
}

/** dia da semana de uma data ISO (sem fuso: meio-dia UTC) */
function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

function addDayISO(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const byDateAndTime = (a: EventEntry, b: EventEntry) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

/**
 * Eventos da cidade dentro do intervalo [startISO, endISO], inclusive (ajustes-81):
 * os reais de data fixa e, em cada dia, até 2 (contando os reais) gerados dos
 * modelos da cidade — ou dos genéricos, com `{city}` = nome da cidade — que
 * acontecem naquele dia da semana. A escolha roda a lista pelo índice do dia,
 * pra não repetir o mesmo evento em dias seguidos. Ordenados por data e horário.
 */
export function getEventsForDestination(
  cityId: string,
  startISO: string | null,
  endISO: string | null,
  cityName?: string,
): EventEntry[] {
  if (!startISO || !endISO || endISO < startISO) return [];
  // ISO yyyy-mm-dd compara certo como string
  const real = events.filter((e) => e.cityId === cityId && e.date >= startISO && e.date <= endISO);
  const templates = templateData.cities[cityId] ?? templateData.generic;
  const name = cityName || cityNameOf(cityId);
  const generated: EventEntry[] = [];
  for (let dateISO = startISO, dayIndex = 0; dateISO <= endISO; dateISO = addDayISO(dateISO), dayIndex++) {
    const room = MAX_EVENTS_PER_DAY - real.filter((e) => e.date === dateISO).length;
    const matches = templates.filter((t) => t.weekdays.includes(weekdayOf(dateISO)));
    for (let i = 0; i < Math.min(room, matches.length); i++) {
      generated.push(occurrence(matches[(dayIndex + i) % matches.length], cityId, name, dateISO));
    }
  }
  return [...real, ...generated].sort(byDateAndTime);
}

/** Evento real pelo id, ou ocorrência gerada de modelo (`modelo--data` / `modelo@cidade--data`). */
export function getEventById(id: string): EventEntry | undefined {
  const real = events.find((e) => e.id === id);
  if (real) return real;
  const [key, dateISO] = id.split('--');
  if (!dateISO) return undefined;
  const [templateId, genericCityId] = key.split('@');
  const template = allTemplates.get(templateId);
  const cityId = genericCityId ?? templateCity.get(templateId);
  if (!template || !cityId) return undefined;
  return occurrence(template, cityId, cityNameOf(cityId), dateISO);
}
