import citiesRaw from './cities.json';
import currenciesRaw from './currencies.json';
import placesRaw from './places.json';
import localTipsRaw from './localTips.json';
import type { QuizInterest, QuizDiscovery } from '../context/TripContext';

export interface CityEntry {
  id: string;
  city: string;
  country: string;
  currencyCode: string;
}

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

/** Autocomplete real: 2+ letras, ignora acento/caixa, casa cidade ou país. */
export function searchCities(query: string, excludeIds: Set<string> = new Set()): CityEntry[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return cities
    .filter((c) => !excludeIds.has(c.id))
    .filter((c) => normalize(c.city).includes(q) || normalize(c.country).includes(q))
    .slice(0, 8);
}

export function getCurrency(code: string): CurrencyEntry | undefined {
  return currencies.find((c) => c.code === code);
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
}

export const places: PlaceEntry[] = placesRaw as PlaceEntry[];

export function getPlacesForCity(cityId: string): PlaceEntry[] {
  return places.filter((p) => p.cityId === cityId);
}

export function getPlaceById(id: string): PlaceEntry | undefined {
  return places.find((p) => p.id === id);
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
