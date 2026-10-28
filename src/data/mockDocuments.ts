import type { PersonalDocType, PersonalDocument } from '../context/DocumentsContext';
import type { ReadResult } from './mockVouchers';

/*
  Leitura simulada de documento pessoal (ajustes-84), separada do mockVouchers.ts no ajustes-99b pra
  rodar no `node --test` (mockDocuments.test.ts) — só imports de tipo, que somem na execução.
  Mesmos 2 níveis dos vouchers: o nome de um arquivo de exemplo conhecido do tipo escolhido, senão o
  contexto (o tipo do documento). No teste pelo celular, a foto do passaporte do kit chega pela
  galeria com outro nome (IMG_0002.jpg) e vira o passaporte de exemplo — validade 10/03/2027, pra
  tarefa do aviso de validade. O lembrete "Me avisar" nunca vem do arquivo: é escolha da pessoa.
*/

export type DocumentReadFields = Partial<
  Pick<
    PersonalDocument,
    'title' | 'fullName' | 'number' | 'issuer' | 'issueDate' | 'expiryDate' | 'visaEntries' | 'maxStayDays' | 'vaccineDose' | 'emergencyPhone'
  >
>;

const TEST_NAME = 'PARTICIPANTE DO TESTE';

/** exemplo por tipo — passaporte igual ao arquivo de exemplo, pra tarefa do aviso de validade funcionar com qualquer foto */
const DOCUMENT_EXAMPLES: Record<Exclude<PersonalDocType, 'outro'>, DocumentReadFields> = {
  passaporte: { fullName: TEST_NAME, number: 'XX0000000', issuer: 'Brasil', issueDate: '10/03/2017', expiryDate: '10/03/2027' },
  rg: { fullName: TEST_NAME, number: '00.000.000-0', issuer: 'SSP-SP', issueDate: '01/01/2015' },
  cnh: { fullName: TEST_NAME, number: '00000000000', issuer: 'SP', expiryDate: '01/01/2030' },
  pid: { fullName: TEST_NAME, number: 'PID-0000', issuer: 'Brasil', expiryDate: '01/01/2027' },
  visto: {
    title: 'Visto (exemplo)',
    fullName: TEST_NAME,
    issuer: 'Estados Unidos',
    expiryDate: '01/01/2030',
    visaEntries: 'multipla',
    maxStayDays: '90',
  },
  vacina: { title: 'Febre amarela', fullName: TEST_NAME, vaccineDose: 'Dose única', issueDate: '15/08/2019', expiryDate: '' },
  'seguro-anual': {
    title: 'Seguro anual (exemplo)',
    issuer: 'Seguradora (exemplo)',
    number: 'EX-000000',
    expiryDate: '31/12/2026',
    emergencyPhone: '+55 11 0000-0000',
  },
};

const MOCK_DOCUMENT_FILES: Record<string, { type: PersonalDocType; fields: DocumentReadFields }> = {
  'passaporte-exemplo.png': { type: 'passaporte', fields: DOCUMENT_EXAMPLES.passaporte },
  // a mesma imagem do kit do participante, em JPG (ajustes-99b)
  'passaporte-exemplo.jpg': { type: 'passaporte', fields: DOCUMENT_EXAMPLES.passaporte },
  // vale por toda a vida: validade em branco (o card mostra "Sem validade")
  'certificado-vacina-febre-amarela-exemplo.png': { type: 'vacina', fields: DOCUMENT_EXAMPLES.vacina },
};

/**
 * Arquivo de exemplo conhecido do tipo escolhido → os dados dele; qualquer outro arquivo (foto do
 * celular, PDF) → o exemplo do tipo. Sempre preenche.
 */
export function readDocumentFile(file: Pick<File, 'name'>, docType: PersonalDocType): ReadResult<DocumentReadFields> {
  const known = MOCK_DOCUMENT_FILES[file.name.toLowerCase()];
  if (known && known.type === docType) return { fields: known.fields, source: 'reconhecido' };
  if (docType === 'outro') return { fields: { title: file.name.replace(/\.[^.]+$/, '') }, source: 'exemplo' };
  return { fields: DOCUMENT_EXAMPLES[docType], source: 'exemplo' };
}
