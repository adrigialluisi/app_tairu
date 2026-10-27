import { haversineKm } from './geo.ts';

/*
  Módulo puro (só depende de geo.ts, com a extensão no import) pra rodar no teste automatizado
  com o `node --test` nativo, sem Vite — ver src/utils/proximityDays.test.ts e `npm test`.
  O itinerary.ts reexporta daqui; quem usa continua importando de lá.
*/

export interface ProximityItem {
  id: string;
  lat?: number | null;
  lng?: number | null;
  /** lugar de comer (categoria `gastronomia`): no máximo 1 por dia enquanto houver dia sem (ajustes-88) */
  meal?: boolean;
  /** dias da semana em que funciona (0 = domingo … 6 = sábado), ex.: Feria de Mataderos [0] (ajustes-95) */
  openDays?: number[];
}

export interface ProximityOptions {
  /**
   * dias (índice local, 0-based) com voo, ônibus ou trem saindo ou chegando: recebem no máximo
   * metade da média de lugares por dia (ajustes-88, item 4)
   */
  lightDays?: number[];
  /** de onde o dia começa (hotel do destino, quando a Central tem um com coordenada); sem ele, o lugar mais ao norte */
  start?: { lat: number; lng: number } | null;
  /** dia da semana de cada dia local (0 = domingo), pra respeitar `openDays` (ajustes-95) */
  weekdays?: number[];
}

type Located = ProximityItem & { lat: number; lng: number };

/** lugares a menos disso entre si (todos com todos) andam juntos: "o mesmo quarteirão" */
const BLOCK_KM = 1;
/** lugares até essa distância média entre si formam um bairro, que vira um dia (ajustes-92) */
const NEIGHBORHOOD_KM = 2.5;
/** desvio aceito pra equilibrar: a distância nova até ≤ 1,5× a atual (ajustes-88, item 2) */
const BALANCE_RATIO = 1.5;
/** ou até isso a mais de caminhada: no centro, 1,5× de 200 m não move nada (ajustes-92) */
const BALANCE_EXTRA_KM = 1;
/** diferença de lugares aceita entre os dias (ajustes-88, item 2) */
const BALANCE_SLACK = 2;
const EPS = 1e-9;

function hasCoords(item: ProximityItem): item is Located {
  return typeof item.lat === 'number' && typeof item.lng === 'number';
}

/** mais ao norte; empate: mais a oeste — referência fixa, pra o resultado ser determinístico */
function northmost<T extends { lat: number; lng: number }>(list: T[]): T {
  return list.reduce((best, p) => (p.lat > best.lat || (p.lat === best.lat && p.lng < best.lng) ? p : best));
}

/**
 * Quarteirão: lugares a menos de BLOCK_KM uns dos outros (Casa Rosada e Café Tortoni, Caminito e
 * La Bombonera). É a unidade que os passos de equilíbrio movem — assim um ajuste nunca separa dois
 * lugares vizinhos. Dois restaurantes nunca ficam no mesmo quarteirão (senão a regra de 1 refeição
 * por dia não teria como separá-los).
 */
interface Block {
  items: Located[];
  lat: number;
  lng: number;
  size: number;
  meals: number;
}

function makeBlock(items: Located[]): Block {
  return {
    items,
    lat: items.reduce((acc, p) => acc + p.lat, 0) / items.length,
    lng: items.reduce((acc, p) => acc + p.lng, 0) / items.length,
    size: items.length,
    meals: items.filter((p) => p.meal).length,
  };
}

/** junta por ligação completa (todos com todos a < BLOCK_KM), sempre o par mais perto primeiro */
function buildBlocks(items: Located[]): Block[] {
  let blocks = items.map((p) => makeBlock([p]));
  const farthest = (a: Block, b: Block) => Math.max(...a.items.flatMap((p) => b.items.map((q) => haversineKm(p, q))));
  for (;;) {
    let best: [number, number] | null = null;
    let bestDist = BLOCK_KM;
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i].meals + blocks[j].meals > 1) continue;
        const d = farthest(blocks[i], blocks[j]);
        if (d < bestDist - EPS) {
          best = [i, j];
          bestDist = d;
        }
      }
    }
    if (!best) return blocks;
    const [i, j] = best;
    const merged = makeBlock([...blocks[i].items, ...blocks[j].items]);
    blocks = [...blocks.filter((_, k) => k !== i && k !== j), merged];
    // ordem estável: a do primeiro lugar de cada quarteirão na entrada
    blocks.sort((a, b) => items.indexOf(a.items[0]) - items.indexOf(b.items[0]));
  }
}

/** grupo = um dia */
interface Group {
  center: Block;
  blocks: Block[];
}

const sizeOf = (g: Group) => g.blocks.reduce((acc, b) => acc + b.size, 0);
const mealsOf = (g: Group) => g.blocks.reduce((acc, b) => acc + b.meals, 0);

/** o quarteirão com a menor soma de distâncias (pesada pelo tamanho) aos outros do grupo */
function centerOf(blocks: Block[]): Block {
  let best = blocks[0];
  let bestSum = Infinity;
  for (const b of blocks) {
    const sum = blocks.reduce((acc, o) => acc + haversineKm(b, o) * o.size, 0);
    if (sum < bestSum - EPS) {
      best = b;
      bestSum = sum;
    }
  }
  return best;
}

function moveBlock(block: Block, from: Group, to: Group) {
  from.blocks.splice(from.blocks.indexOf(block), 1);
  to.blocks.push(block);
}

/** distância média entre os lugares de dois grupos (ligação média — não "encadeia" bairros) */
function groupDistance(a: Group, b: Group): number {
  const pa = a.blocks.flatMap((x) => x.items);
  const pb = b.blocks.flatMap((x) => x.items);
  let sum = 0;
  for (const p of pa) for (const q of pb) sum += haversineKm(p, q);
  return sum / (pa.length * pb.length);
}

function mergeGroups(groups: Group[], i: number, j: number) {
  const merged = { center: groups[i].center, blocks: [...groups[i].blocks, ...groups[j].blocks] };
  merged.center = centerOf(merged.blocks);
  groups.splice(j, 1);
  groups.splice(i, 1, merged);
}

/** o par de grupos mais perto que `allowed` aceita (empate: o primeiro na ordem) */
function closestPair(groups: Group[], allowed: (a: Group, b: Group, d: number) => boolean): [number, number] | null {
  let best: [number, number] | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const d = groupDistance(groups[i], groups[j]);
      if (d < bestDist - EPS && allowed(groups[i], groups[j], d)) {
        best = [i, j];
        bestDist = d;
      }
    }
  }
  return best;
}

/**
 * 1. bairros: junta os quarteirões mais perto primeiro, enquanto estiverem a até NEIGHBORHOOD_KM,
 * sem passar do tamanho de um dia cheio (`cap`) e sem pôr 2 refeições juntas (`mealCap`). Um dia
 * não é dividido só pra ocupar todos os dias da viagem: dia sem lugar fica livre.
 */
function buildNeighborhoods(blocks: Block[], cap: number, mealCap: number): Group[] {
  const groups: Group[] = blocks.map((b) => ({ center: b, blocks: [b] }));
  for (;;) {
    const pair = closestPair(
      groups,
      (a, b, d) => d <= NEIGHBORHOOD_KM && sizeOf(a) + sizeOf(b) <= cap && mealsOf(a) + mealsOf(b) <= mealCap,
    );
    if (!pair) return groups;
    mergeGroups(groups, ...pair);
  }
}

/**
 * mais bairros que dias: junta os mais perto — de preferência sem passar de um dia cheio e sem 2
 * refeições no dia; só sem saída abre mão dessas preferências, nessa ordem
 */
function mergeDownTo(groups: Group[], days: number, cap: number, mealCap: number) {
  const fits = (a: Group, b: Group) => sizeOf(a) + sizeOf(b) <= cap;
  const mealsOk = (a: Group, b: Group) => mealsOf(a) + mealsOf(b) <= mealCap;
  while (groups.length > days) {
    const pair =
      closestPair(groups, (a, b) => fits(a, b) && mealsOk(a, b)) ??
      closestPair(groups, fits) ??
      closestPair(groups, mealsOk) ??
      closestPair(groups, () => true);
    if (!pair) return;
    mergeGroups(groups, ...pair);
  }
}

/** 3. equilíbrio com folga: até BALANCE_SLACK lugares de diferença, só com desvio pequeno */
function balance(groups: Group[]) {
  for (let guard = 0; guard < 100; guard++) {
    const sizes = groups.map(sizeOf);
    const big = groups[sizes.indexOf(Math.max(...sizes))];
    const small = groups[sizes.indexOf(Math.min(...sizes))];
    const gap = sizeOf(big) - sizeOf(small);
    if (gap <= BALANCE_SLACK) return;
    let pick: Block | null = null;
    let pickCost = Infinity;
    for (const b of big.blocks) {
      // não move o centro nem um quarteirão que só inverteria o desequilíbrio
      if (b === big.center || b.size >= gap) continue;
      const own = haversineKm(b, big.center);
      const there = haversineKm(b, small.center);
      // "aumento pequeno": até 1,5× a distância ao próprio centro, ou até 1 km a mais
      if (there > own * BALANCE_RATIO && there - own > BALANCE_EXTRA_KM) continue;
      const cost = there - own + (b.meals > 0 ? 1000 : 0);
      if (cost < pickCost - EPS) {
        pick = b;
        pickCost = cost;
      }
    }
    if (pick) {
      moveBlock(pick, big, small);
      continue;
    }
    // nenhum quarteirão inteiro pode mudar (o dia cheio é quase todo um quarteirão só): move um
    // lugar sozinho, o que menos se afasta — melhor que um dia com 8 e outro com 2
    let single: { item: Located; from: Block; cost: number } | null = null;
    for (const blk of big.blocks) {
      for (const item of blk.items) {
        const own = haversineKm(item, big.center);
        const there = haversineKm(item, small.center);
        if (there > own * BALANCE_RATIO && there - own > BALANCE_EXTRA_KM) continue;
        // restaurante só por último: movê-lo desfaria a regra de 1 refeição por dia
        const cost = there - own + (item.meal ? 1000 : 0);
        if (!single || cost < single.cost - EPS) single = { item, from: blk, cost };
      }
    }
    if (!single) return;
    const rest = single.from.items.filter((x) => x !== single!.item);
    const idx = big.blocks.indexOf(single.from);
    if (rest.length > 0) big.blocks.splice(idx, 1, makeBlock(rest));
    else big.blocks.splice(idx, 1);
    small.blocks.push(makeBlock([single.item]));
    big.center = centerOf(big.blocks);
  }
}

/**
 * 4. refeições espalhadas: 1 por dia enquanto houver dia sem nenhuma; com mais refeições que
 * dias, o segundo restaurante do dia (almoço e jantar). Move o quarteirão com restaurante que fica
 * mais perto de um dia com menos refeições — junto com os vizinhos dele.
 */
function spreadMeals(groups: Group[]) {
  for (let guard = 0; guard < 100; guard++) {
    const counts = groups.map(mealsOf);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max - min <= 1) return;
    let best: { block: Block; from: Group; to: Group; dist: number } | null = null;
    for (const from of groups.filter((g) => mealsOf(g) === max)) {
      for (const block of from.blocks.filter((b) => b.meals > 0)) {
        for (const to of groups.filter((g) => mealsOf(g) === min)) {
          const dist = haversineKm(block, to.center);
          if (!best || dist < best.dist - EPS) best = { block, from, to, dist };
        }
      }
    }
    if (!best) return;
    moveBlock(best.block, best.from, best.to);
  }
}

/** 5. ordem dentro do dia: vizinho mais próximo, começando pelo mais perto do hotel (ou o mais ao norte) */
function routeOf(members: Located[], start: ProximityOptions['start']): Located[] {
  if (members.length === 0) return [];
  const remaining = [...members];
  let current = start
    ? remaining.reduce((best, p) => (haversineKm(start, p) < haversineKm(start, best) - EPS ? p : best))
    : northmost(remaining);
  const route: Located[] = [];
  while (remaining.length > 0) {
    remaining.splice(remaining.indexOf(current), 1);
    route.push(current);
    if (remaining.length === 0) break;
    const from = current;
    current = remaining.reduce((best, p) => (haversineKm(from, p) < haversineKm(from, best) - EPS ? p : best));
  }
  return route;
}

/**
 * Distribui itens nos dias por PROXIMIDADE (ajustes-88, que substitui a rota cortada em pedaços
 * iguais do ajustes-80; agrupamento por bairro no ajustes-92), de forma determinística:
 * 1. junta os lugares a menos de 1 km uns dos outros em "quarteirões" (nunca 2 restaurantes no
 *    mesmo) e os quarteirões em "bairros" (até 2,5 km em média, sem passar de um dia cheio — média
 *    + 2 — nem juntar 2 refeições). Bairro vira dia; com mais dias que bairros, sobra dia livre
 *    (nunca parte o MALBA da Recoleta só pra ocupar os 5 dias de Buenos Aires);
 * 2. dia de deslocamento (`options.lightDays`) recebe no máximo metade da média de lugares — só um
 *    bairro pequeno que sobraria; senão fica livre;
 * 3. mais bairros que dias: junta os mais perto (de preferência sem 2 refeições no dia);
 * 4. equilíbrio com folga entre os dias com lugar (até 2 de diferença, desvio ≤ 1,5×) e no máximo
 *    1 refeição por dia enquanto houver dia sem — os dois movem quarteirões inteiros;
 * 5. dias com lugar em ordem do bairro mais ao norte pro mais ao sul; dentro do dia, rota pelo
 *    vizinho mais próximo a partir do hotel (`options.start`) ou do lugar mais ao norte;
 * 6. lugar com dia da semana certo (`openDays`, com `options.weekdays`) muda pra um dia permitido.
 * Item sem coordenada (lugar escrito à mão) entra no fim do dia normal com menos lugares.
 */
export function computeProximityDays(
  items: ProximityItem[],
  dayCount: number,
  options: ProximityOptions = {},
): Map<string, { day: number; order: number }> {
  const result = new Map<string, { day: number; order: number }>();
  if (items.length === 0) return result;
  const days = Math.max(1, dayCount);
  const located = items.filter(hasCoords);
  const loose = items.filter((p) => !hasCoords(p));

  const lightDays = [...new Set(options.lightDays ?? [])].filter((d) => d >= 0 && d < days).sort((a, b) => a - b);
  // todo dia é de deslocamento: não tem pra onde aliviar
  const effectiveLight = lightDays.length < days ? lightDays : [];
  const normalDays = Array.from({ length: days }, (_, d) => d).filter((d) => !effectiveLight.includes(d));
  const lightCap = Math.floor(items.length / days / 2);

  const blocks = buildBlocks(located);
  const meals = located.filter((p) => p.meal).length;
  // com mais refeições que dias livres, o 2º restaurante do dia passa a valer (almoço e jantar)
  const mealCap = meals > Math.max(1, normalDays.length) ? 2 : 1;
  // um dia cheio: a média de lugares por dia + a folga de 2 (ajustes-88, item 2)
  const cap = Math.ceil(located.length / Math.max(1, normalDays.length)) + BALANCE_SLACK;
  const neighborhoods = blocks.length > 0 ? buildNeighborhoods(blocks, cap, mealCap) : [];

  // 2. dia de deslocamento: fica com um bairro pequeno (até `lightCap` lugares) só se sobrar bairro
  // pros dias normais; senão fica livre — nunca parte um bairro pra preencher o dia do voo
  const lightGroups: Located[][] = effectiveLight.map(() => []);
  const normalGroups = [...neighborhoods];
  for (let i = 0; i < effectiveLight.length && normalGroups.length > normalDays.length; i++) {
    const fits = normalGroups.filter((g) => sizeOf(g) <= lightCap);
    if (fits.length === 0) break;
    const smallest = fits.reduce((a, b) => (sizeOf(b) < sizeOf(a) ? b : a));
    normalGroups.splice(normalGroups.indexOf(smallest), 1);
    lightGroups[i] = smallest.blocks.flatMap((b) => b.items);
  }
  mergeDownTo(normalGroups, Math.max(1, normalDays.length), cap, mealCap);
  for (const g of normalGroups) g.center = centerOf(g.blocks);

  // refeições primeiro; o equilíbrio vem depois e evita mover restaurante (senão um desfaz o outro)
  spreadMeals(normalGroups);
  balance(normalGroups);

  // 5. dias normais do grupo mais ao norte pro mais ao sul
  for (const g of normalGroups) g.center = centerOf(g.blocks);
  normalGroups.sort((a, b) => b.center.lat - a.center.lat || a.center.lng - b.center.lng);
  const byDay = new Map<number, ProximityItem[]>();
  normalDays.forEach((d, i) =>
    byDay.set(d, normalGroups[i] ? routeOf(normalGroups[i].blocks.flatMap((b) => b.items), options.start) : []),
  );
  effectiveLight.forEach((d, i) => byDay.set(d, routeOf(lightGroups[i] ?? [], options.start)));

  // sem coordenada: no fim do dia normal com menos lugares (empate: o primeiro)
  for (const item of loose) {
    const target = (normalDays.length > 0 ? normalDays : [0]).reduce((best, d) =>
      (byDay.get(d)?.length ?? 0) < (byDay.get(best)?.length ?? 0) ? d : best,
    );
    byDay.set(target, [...(byDay.get(target) ?? []), item]);
  }

  if (options.weekdays) fitOpenDays(byDay, days, options.weekdays, options.start);

  for (const [day, list] of byDay) list.forEach((item, order) => result.set(item.id, { day, order }));
  return result;
}

/**
 * 6. Lugar que só abre em alguns dias da semana (`openDays`, ajustes-95) vai pro dia permitido mais
 * perto do resto do dia (até 2,5 km de um lugar dele; senão um dia vazio; empate: o com menos
 * lugares, depois o primeiro). Se nenhum dia da cidade servir, vai pro primeiro dia — a tela avisa
 * ("Só abre aos domingos"). O dia que recebe refaz a rota.
 */
function fitOpenDays(
  byDay: Map<number, ProximityItem[]>,
  days: number,
  weekdays: number[],
  start: ProximityOptions['start'],
) {
  const allDays = Array.from({ length: days }, (_, d) => d);
  for (const day of allDays) {
    for (const item of [...(byDay.get(day) ?? [])]) {
      const open = item.openDays;
      if (!open || open.length === 0 || open.includes(weekdays[day])) continue;
      const allowed = allDays.filter((d) => weekdays[d] !== undefined && open.includes(weekdays[d]));
      const score = (d: number) => {
        const located = (byDay.get(d) ?? []).filter(hasCoords);
        if (!hasCoords(item) || located.length === 0) return NEIGHBORHOOD_KM;
        return Math.min(NEIGHBORHOOD_KM, ...located.map((p) => haversineKm(item, p)));
      };
      const target =
        allowed.length === 0
          ? 0
          : allowed.reduce((best, d) => {
              const diff = score(d) - score(best);
              if (diff < -EPS) return d;
              if (diff > EPS) return best;
              return (byDay.get(d)?.length ?? 0) < (byDay.get(best)?.length ?? 0) ? d : best;
            });
      if (target === day) continue;
      byDay.set(day, (byDay.get(day) ?? []).filter((p) => p !== item));
      const next = [...(byDay.get(target) ?? []), item];
      byDay.set(target, [...routeOf(next.filter(hasCoords), start), ...next.filter((p) => !hasCoords(p))]);
    }
  }
}
