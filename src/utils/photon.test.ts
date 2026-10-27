/*
  Leitura da busca ao vivo do Photon (ajustes-97): filtro de 40 km do centro da cidade, sem repetir o
  que já apareceu nos grupos do app (mesmo nome a menos de 150 m) e a categoria pelo osm_value.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuery, parsePhoton, photonCategory } from './photon.ts';

const BA = { lat: -34.6037, lng: -58.3816 };

const feature = (name: string, lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  geometry: { coordinates: [lng, lat] },
  properties: { name, osm_id: Math.round(Math.abs(lat * 1e6)), osm_type: 'N', ...extra },
});

test('Café de los Angelitos: nome, endereço e categoria gastronomia', () => {
  const [place] = parsePhoton(
    {
      features: [
        feature('Café de los Angelitos', -34.6096, -58.3926, {
          osm_key: 'amenity',
          osm_value: 'cafe',
          street: 'Avenida Rivadavia',
          housenumber: '2100',
          suburb: 'Balvanera',
        }),
      ],
    },
    BA,
  );
  assert.equal(place.name, 'Café de los Angelitos');
  assert.equal(place.category, 'gastronomia');
  assert.equal(place.address, 'Avenida Rivadavia 2100, Balvanera');
});

test('descarta o que fica a mais de 40 km do centro da cidade', () => {
  // Café de los Angelitos de Montevidéu (~200 km)
  const result = parsePhoton({ features: [feature('Café de los Angelitos', -34.9058, -56.1913)] }, BA);
  assert.deepEqual(result, []);
});

test('descarta o que já apareceu nos grupos do app (mesmo nome a menos de 150 m)', () => {
  const result = parsePhoton(
    { features: [feature('Café Tortoni', -34.6087, -58.3787), feature('Café Tortoni', -34.62, -58.38)] },
    BA,
    [{ name: 'Cafe Tortoni', lat: -34.6088, lng: -58.3788 }],
  );
  // o de 150 m some; o homônimo a ~1 km fica
  assert.equal(result.length, 1);
  assert.equal(result[0].lat, -34.62);
});

test('resposta quebrada ou vazia não derruba a busca', () => {
  assert.deepEqual(parsePhoton(null, BA), []);
  assert.deepEqual(parsePhoton({ features: [{ properties: {} }] }, BA), []);
});

test('categoria pelo osm_value; loja qualquer é compras; o resto é "lugar"', () => {
  assert.equal(photonCategory('tourism', 'museum'), 'cultura');
  assert.equal(photonCategory('leisure', 'park'), 'natureza');
  assert.equal(photonCategory('shop', 'books'), 'compras');
  assert.equal(photonCategory('highway', 'bus_stop'), 'lugar');
});

/*
  Só o que tem a ver com o texto (ajustes-99): o Photon devolve parecidos por conta própria — "malba"
  trazia "Malta". O nome precisa conter o texto (sem acento nem maiúscula); 1 erro só com 6+ letras.
*/
test('"malba" não traz "Malta"; traz "MALBA" e "Museo MALBA"', () => {
  assert.equal(matchesQuery('Malta', 'malba'), false);
  assert.equal(matchesQuery('MALBA', 'malba'), true);
  assert.equal(matchesQuery('Museo de Arte Latinoamericano (MALBA)', 'malba'), true);
});

test('sem acento nem maiúscula, e o nome pode só começar com o texto', () => {
  assert.equal(matchesQuery('Café de los Angelitos', 'cafe de los'), true);
  assert.equal(matchesQuery('Confitería Ideal', 'CONFITERIA'), true);
});

test('1 erro de digitação só com 6+ letras', () => {
  assert.equal(matchesQuery('Café Tortoni', 'tortonni'), true);
  assert.equal(matchesQuery('Café de los Angelitos', 'angelitoss'), true);
  assert.equal(matchesQuery('Malta', 'malba'), false);
  assert.equal(matchesQuery('Tigre', 'tigra'), false);
});

test('parsePhoton descarta o que não bate com o texto', () => {
  const result = parsePhoton(
    { features: [feature('Malta', -34.6, -58.38), feature('MALBA', -34.5769, -58.4035)] },
    BA,
    [],
    'malba',
  );
  assert.deepEqual(result.map((p) => p.name), ['MALBA']);
});
