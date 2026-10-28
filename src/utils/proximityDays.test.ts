/*
  Teste automatizado da divisão dos dias (ajustes-88, item 1; cenário novo no ajustes-92).
  Roda com o test runner nativo do Node (`npm test`), sem dependência nova.
  Cenário de 14 a 27/11/2026: Buenos Aires de 14 a 19/11. No app, o dia de fronteira fica com quem
  chega (splitDaysByDestination), então Buenos Aires tem 5 dias, 14 a 18/11, e o 19 (voo pra
  Santiago) é de Santiago; o dia de deslocamento de Buenos Aires é o 14, da chegada de São Paulo.
  Os mesmos 7 lugares do teste de 13/out e os 4 critérios de aceite do ajuste 88.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeProximityDays, type ProximityItem } from './proximityDays.ts';

interface RawPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  categories: string[];
}

const places: RawPlace[] = JSON.parse(readFileSync(new URL('../data/places.json', import.meta.url), 'utf8'));

const SCENARIO = [
  'ba-la-boca-caminito',
  'ba-la-brigada',
  'ba-casa-rosada',
  'ba-cafe-tortoni',
  'ba-recoleta-cemiterio',
  'ba-malba',
  'ba-la-bombonera',
];

function itemsOf(ids: string[]): ProximityItem[] {
  return ids.map((id) => {
    const p = places.find((x) => x.id === id);
    assert.ok(p, `lugar ${id} existe no places.json`);
    return { id: p.id, lat: p.lat, lng: p.lng, meal: p.categories.includes('gastronomia') };
  });
}

const nameOf = (id: string) => places.find((p) => p.id === id)!.name;

/** os 4 critérios de aceite do item 1 + todo lugar com dia */
function acceptance(days: Map<string, { day: number; order: number }>) {
  const dayOf = (id: string) => days.get(id)?.day;
  for (const id of SCENARIO) assert.notEqual(dayOf(id), undefined, `${id} sem dia`);
  assert.equal(dayOf('ba-cafe-tortoni'), dayOf('ba-casa-rosada'), 'Café Tortoni no mesmo dia da Casa Rosada');
  assert.equal(dayOf('ba-la-brigada'), dayOf('ba-la-boca-caminito'), 'La Brigada no mesmo dia do Caminito');
  assert.equal(dayOf('ba-la-brigada'), dayOf('ba-la-bombonera'), 'La Brigada no mesmo dia de La Bombonera');
  assert.equal(dayOf('ba-malba'), dayOf('ba-recoleta-cemiterio'), 'MALBA no mesmo dia do Cemitério da Recoleta');
  assert.notEqual(dayOf('ba-cafe-tortoni'), dayOf('ba-la-brigada'), 'Café Tortoni e La Brigada em dias diferentes');
}

function print(days: Map<string, { day: number; order: number }>, labels: string[]) {
  labels.forEach((label, d) => {
    const list = SCENARIO.filter((id) => days.get(id)?.day === d)
      .sort((a, b) => days.get(a)!.order - days.get(b)!.order)
      .map(nameOf);
    console.log(`${label}: ${list.length ? list.join(' → ') : '(nenhum lugar)'}`);
  });
}

const BA_LABELS = ['Sáb 14/11 (chegada)', 'Dom 15/11', 'Seg 16/11', 'Ter 17/11', 'Qua 18/11'];

// --- cenário do app (ajustes-92): Buenos Aires com 5 dias, o 1º de deslocamento ---
const appDays = computeProximityDays(itemsOf(SCENARIO), 5, { lightDays: [0] });

test('app (5 dias, 14/11 de chegada): Café Tortoni no mesmo dia da Casa Rosada', () => {
  assert.equal(appDays.get('ba-cafe-tortoni')?.day, appDays.get('ba-casa-rosada')?.day);
});

test('app (5 dias): La Brigada no mesmo dia do Caminito e de La Bombonera', () => {
  assert.equal(appDays.get('ba-la-brigada')?.day, appDays.get('ba-la-boca-caminito')?.day);
  assert.equal(appDays.get('ba-la-brigada')?.day, appDays.get('ba-la-bombonera')?.day);
});

test('app (5 dias): MALBA no mesmo dia do Cemitério da Recoleta', () => {
  assert.equal(appDays.get('ba-malba')?.day, appDays.get('ba-recoleta-cemiterio')?.day);
});

test('app (5 dias): Café Tortoni e La Brigada em dias diferentes', () => {
  assert.notEqual(appDays.get('ba-cafe-tortoni')?.day, appDays.get('ba-la-brigada')?.day);
});

test('app (5 dias): todo lugar tem dia e o dia da chegada fica com no máximo metade da média', () => {
  for (const id of SCENARIO) assert.notEqual(appDays.get(id), undefined, id);
  const cap = Math.floor(SCENARIO.length / 5 / 2);
  assert.ok(SCENARIO.filter((id) => appDays.get(id)?.day === 0).length <= cap);
});

test('determinístico: mesma entrada, mesmo resultado', () => {
  const again = computeProximityDays(itemsOf(SCENARIO), 5, { lightDays: [0] });
  assert.deepEqual([...again.entries()].sort(), [...appDays.entries()].sort());
});

// --- leitura literal do documento: 5 dias, o último (19/11) de deslocamento ---
const docDays = computeProximityDays(itemsOf(SCENARIO), 5, { lightDays: [4] });

test('documento (5 dias, 19/11 de deslocamento): os 4 critérios valem', () => acceptance(docDays));

// --- ajuste 88: o mesmo grupo de lugares em 2 e 3 dias ---
test('2 dias (cenário do ajuste 88): os 4 critérios valem', () => acceptance(computeProximityDays(itemsOf(SCENARIO), 2)));

test('3 dias com o último de deslocamento: os 4 critérios valem', () =>
  acceptance(computeProximityDays(itemsOf(SCENARIO), 3, { lightDays: [2] })));

test('3 dias sem deslocamento: os 4 critérios valem', () => acceptance(computeProximityDays(itemsOf(SCENARIO), 3)));

// distribuição impressa, pra conferir à mão (`npm test`)
test('distribuição por dia', () => {
  console.log('— App (Buenos Aires, 14 a 18/11):');
  print(appDays, BA_LABELS);
  console.log('— Documento (5 dias, 19/11 de deslocamento):');
  print(docDays, ['Dom 15/11', 'Seg 16/11', 'Ter 17/11', 'Qua 18/11', 'Qui 19/11 (voo)']);
});

/*
  Dia certo de funcionamento (ajustes-95): a Feria de Mataderos só acontece aos domingos. Buenos
  Aires tem 5 dias, sáb 14 a qua 18/11 — o único domingo é o 15 (dia local 1). Antes ela caía no
  sábado 14 junto com o resto do roteiro.
*/
const BA_WEEKDAYS = [6, 0, 1, 2, 3];

test('Feria de Mataderos (só aos domingos) cai no domingo 15/11', () => {
  const items = itemsOf([...SCENARIO, 'ba-feria-mataderos']).map((it) =>
    it.id === 'ba-feria-mataderos' ? { ...it, openDays: [0] } : it,
  );
  const days = computeProximityDays(items, 5, { lightDays: [0], weekdays: BA_WEEKDAYS });
  assert.equal(days.get('ba-feria-mataderos')?.day, 1);
  // os outros continuam todos com dia
  assert.equal(days.size, items.length);
});

test('sem nenhum domingo na cidade, a Feria de Mataderos vai pro primeiro dia (a tela avisa)', () => {
  const items = itemsOf([...SCENARIO, 'ba-feria-mataderos']).map((it) =>
    it.id === 'ba-feria-mataderos' ? { ...it, openDays: [0] } : it,
  );
  const days = computeProximityDays(items, 3, { weekdays: [1, 2, 3] });
  assert.equal(days.get('ba-feria-mataderos')?.day, 0);
});

/*
  Lugar fixado no dia (ajustes-97): a pessoa adicionou o Café de los Angelitos (OpenStreetMap, sem
  id do places.json) direto na quarta 18/11 — o 5º dia de Buenos Aires (índice 4). Depois de entrar
  mais 3 lugares na cidade, ele continua no dia 18; os outros se organizam em volta.
*/
const ANGELITOS: ProximityItem = { id: 'osm-angelitos', lat: -34.6096, lng: -58.3926, meal: true, fixedDay: 4 };

test('lugar fixado no dia 18 continua no dia 18 depois de adicionar 3 lugares na cidade', () => {
  const before = computeProximityDays([...itemsOf(SCENARIO), ANGELITOS], 5, { lightDays: [0] });
  assert.equal(before.get(ANGELITOS.id)?.day, 4);
  const after = computeProximityDays(
    [...itemsOf([...SCENARIO, 'ba-teatro-colon', 'ba-rosedal-palermo', 'ba-feria-san-telmo']), ANGELITOS],
    5,
    { lightDays: [0] },
  );
  assert.equal(after.get(ANGELITOS.id)?.day, 4);
  // todo lugar continua com dia
  assert.equal(after.size, SCENARIO.length + 3 + 1);
});

test('lugar fixado num dia em que não abre continua onde a pessoa pôs', () => {
  const fixedSunday: ProximityItem = { ...itemsOf(['ba-feria-mataderos'])[0], openDays: [0], fixedDay: 2 };
  const days = computeProximityDays([...itemsOf(SCENARIO), fixedSunday], 5, { weekdays: BA_WEEKDAYS });
  assert.equal(days.get('ba-feria-mataderos')?.day, 2);
});

/*
  Cidade só com lugares fixados (fix do crash "reading 'blocks'"): sem nenhum lugar livre, não
  sobra grupo pros dias normais e o equilíbrio pegava um dia que não existe. O mesmo valia pra
  cidade só com lugares escritos à mão (sem coordenada).
*/
test('cidade de 4 dias só com 1 restaurante fixado no dia 2: não quebra e ele fica no dia 2', () => {
  const restaurant: ProximityItem = { ...ANGELITOS, fixedDay: 1 };
  const days = computeProximityDays([restaurant], 4, { lightDays: [0], weekdays: [1, 2, 3, 4] });
  assert.deepEqual(days.get(restaurant.id), { day: 1, order: 0 });
  assert.equal(days.size, 1);
});

test('cidade só com lugares sem coordenada (e um fixado): não quebra e todos têm dia', () => {
  const days = computeProximityDays(
    [{ id: 'a' }, { id: 'b' }, { id: 'c', fixedDay: 3 }],
    4,
    { lightDays: [0] },
  );
  assert.equal(days.size, 3);
  assert.equal(days.get('c')?.day, 3);
  // os soltos vão pros dias normais vazios, não pro dia de deslocamento
  assert.notEqual(days.get('a')?.day, 0);
  assert.notEqual(days.get('b')?.day, 0);
});
