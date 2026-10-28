/*
  Passaporte reconhecido por imagem (ajustes-99b): a foto do kit chega pela galeria do celular com
  outro nome (IMG_0002.jpg) e, num documento do tipo Passaporte, preenche o passaporte de exemplo.
*/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDocumentFile } from './mockDocuments.ts';

test('IMG_0002.jpg num Passaporte → passaporte de exemplo, validade 10/03/2027', () => {
  const read = readDocumentFile({ name: 'IMG_0002.jpg' }, 'passaporte');
  assert.equal(read.fields.expiryDate, '10/03/2027');
  assert.equal(read.fields.fullName, 'PARTICIPANTE DO TESTE');
  assert.equal(read.fields.number, 'XX0000000');
  assert.equal(read.source, 'exemplo');
});

test('passaporte-exemplo.jpg do kit é reconhecido pelo nome (maiúsculas não importam)', () => {
  const read = readDocumentFile({ name: 'Passaporte-Exemplo.JPG' }, 'passaporte');
  assert.equal(read.source, 'reconhecido');
  assert.equal(read.fields.expiryDate, '10/03/2027');
});

test('o arquivo nunca traz o lembrete "Me avisar"', () => {
  const read = readDocumentFile({ name: 'IMG_0002.jpg' }, 'passaporte');
  assert.equal('remindBefore' in read.fields, false);
});

test('a foto do passaporte num documento de outro tipo usa o exemplo daquele tipo', () => {
  const read = readDocumentFile({ name: 'passaporte-exemplo.jpg' }, 'cnh');
  assert.equal(read.source, 'exemplo');
  assert.equal(read.fields.expiryDate, '01/01/2030');
});
