/*
  Planos dos convidados no bloco "Sugestões dos convidados" (ajustes-101f). Usa o fluxo real: a
  simulação "uma semana antes da viagem" (applyMockContributions) cria os planos da Marina e do
  Rodrigo, e groupPlansOfCity monta as linhas do bloco. Roda com o carregador do `npm test`
  (scripts/test-loader.mjs), que resolve os imports sem extensão e os JSON como no Vite.
  Cenário fixo de 14 a 27/11/2026 (ajustes-92).
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TripCompanion, TripDestination, TripPlaceSelection } from '../context/TripContext.tsx';
import { applyMockContributions } from './mockContributions.ts';
import { groupPlansOfCity, isMyPlace, proximityOptionsFor, splitDaysByDestination } from './itinerary.ts';

const BA = 'buenos-aires-ar';

const DESTINATIONS: TripDestination[] = [
  { id: 'd-ba', city: 'Buenos Aires', cityId: BA, dateStart: '2026-11-14', dateEnd: '2026-11-19', currencyCode: 'ARS' },
  { id: 'd-sc', city: 'Santiago', cityId: 'santiago-cl', dateStart: '2026-11-19', dateEnd: '2026-11-23', currencyCode: 'CLP' },
  {
    id: 'd-at',
    city: 'San Pedro de Atacama',
    cityId: 'san-pedro-de-atacama-cl',
    dateStart: '2026-11-23',
    dateEnd: '2026-11-27',
    currencyCode: 'CLP',
  },
] as TripDestination[];

const JOINED = [
  { id: 'c-marina', email: 'marina.duarte@email.com', status: 'entrou' },
  { id: 'c-rodrigo', email: 'rodrigo.antunes@email.com', status: 'entrou' },
] as TripCompanion[];

const mine = (placeId: string, destinationId = 'd-ba'): TripPlaceSelection =>
  ({
    id: `sel-${placeId}`,
    destinationId,
    placeId,
    customLabel: null,
    categories: [],
    addedBy: 'voce',
    alsoWantedBy: [],
  }) as TripPlaceSelection;

function simulate(destinations: TripDestination[], selectedPlaces: TripPlaceSelection[]) {
  return applyMockContributions({
    destinations,
    joined: JOINED,
    selectedPlaces,
    expenses: [],
    transportItems: [],
    stayItems: [],
    dismissedMockKeys: [],
  }).selectedPlaces;
}

const blockOf = (destinations: TripDestination[], places: TripPlaceSelection[]) =>
  groupPlansOfCity(BA, destinations, places, [], (id) =>
    proximityOptionsFor({ destinations, transportItems: [], stayItems: [] }, id),
  );

test('ajustes-101f: os planos da Marina e do Rodrigo em Buenos Aires aparecem os dois no bloco', () => {
  // a participante já tinha Don Julio, Bombonera e River: Marina vai de reserva (La Cabrera) e Rodrigo também (Teatro Colón)
  const places = simulate(DESTINATIONS, [mine('ba-don-julio'), mine('ba-la-bombonera'), mine('ba-monumental-river')]);
  const block = blockOf(DESTINATIONS, places);
  const byWho = Object.fromEntries(block.map((p) => [p.selection.addedBy, p.selection.placeId]));
  assert.deepEqual(byWho, { 'c-marina': 'ba-la-cabrera', 'c-rodrigo': 'ba-teatro-colon' });
  const baDays = splitDaysByDestination(DESTINATIONS).find((r) => r.destinationId === 'd-ba')!.globalDayIndexes;
  for (const plan of block) assert.ok(plan.globalDay !== null && baDays.includes(plan.globalDay), `${plan.selection.placeId} sem dia de Buenos Aires`);
});

test('ajustes-101f: plano que não cabe em dia nenhum da proximidade entra no 1º dia da cidade', () => {
  // escrito à mão pelo convidado, sem coordenada: a proximidade não tem como encaixar pela distância
  const handwritten = {
    ...mine('x'),
    id: 'plano-sem-lugar',
    placeId: null,
    customLabel: 'Bar que a Marina conhece',
    addedBy: 'c-marina',
  } as TripPlaceSelection;
  const block = blockOf(DESTINATIONS, [handwritten]);
  assert.equal(block.length, 1);
  assert.equal(block[0].globalDay, 0, 'Buenos Aires começa no dia 0 (14/11)');
});

test('ajustes-101f: com a cidade repetida num destino sem datas, o plano vai pro destino com datas e aparece', () => {
  const withDuplicate = [
    { id: 'd-ba-sem-data', city: 'Buenos Aires', cityId: BA, dateStart: null, dateEnd: null, currencyCode: 'ARS' },
    ...DESTINATIONS,
  ] as TripDestination[];
  const places = simulate(withDuplicate, []);
  const marina = places.find((p) => p.addedBy === 'c-marina' && p.placeId === 'ba-don-julio');
  assert.equal(marina?.destinationId, 'd-ba');
  const block = blockOf(withDuplicate, places);
  assert.deepEqual(block.map((p) => p.selection.placeId).sort(), ['ba-don-julio', 'ba-la-bombonera']);
});

test('ajustes-101f: o plano em que a participante já entrou sai do bloco (é parada dela)', () => {
  const places = simulate(DESTINATIONS, []).map((p) =>
    p.addedBy === 'c-marina' && p.placeId === 'ba-don-julio' ? { ...p, alsoWantedBy: ['voce'] } : p,
  );
  const block = blockOf(DESTINATIONS, places);
  assert.ok(block.every((p) => !isMyPlace(p.selection)));
  assert.deepEqual(block.map((p) => p.selection.placeId), ['ba-la-bombonera']);
});
