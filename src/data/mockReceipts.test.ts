/*
  Leitura simulada da nota pelo contexto (ajustes-96). No teste pelo celular, a foto do kit chega
  pela galeria com outro nome (IMG_0001.jpg): em "Lançar gasto" ela vira a nota do Don Julio.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readReceiptFile } from './mockReceipts.ts';

test('IMG_0001.jpg em Lançar gasto → nota do Don Julio (ARS 120.000, 15/11)', () => {
  const read = readReceiptFile({ name: 'IMG_0001.jpg' });
  assert.equal(read?.amount, '120000');
  assert.equal(read?.currencyCode, 'ARS');
  assert.equal(read?.dateISO, '2026-11-15');
});

test('foto qualquer com "Onde foi?" em Santiago → nota do Bocanáriz', () => {
  assert.equal(readReceiptFile({ name: 'IMG_0002.jpg' }, { cityId: 'santiago-cl' })?.currencyCode, 'CLP');
});

test('nome da nota do kit vale mais que o contexto', () => {
  assert.equal(readReceiptFile({ name: 'NOTA-BOCANARIZ-SANTIAGO.jpg' }, { cityId: 'buenos-aires-ar' })?.amount, '89900');
});

test('aberto pela parada do Roteiro, foto qualquer não inventa o valor', () => {
  assert.equal(readReceiptFile({ name: 'IMG_0003.jpg' }, { fromStop: true }), null);
});
