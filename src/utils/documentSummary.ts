import type { PersonalDocType, PersonalDocument } from '../context/DocumentsContext';

const TYPE_LABELS: Record<PersonalDocType, string> = {
  passaporte: 'Passaporte',
  rg: 'RG',
  cnh: 'CNH',
  pid: 'Permissão Internacional para Dirigir',
  visto: 'Visto',
  vacina: 'Certificado de vacina',
  outro: 'Outro',
};

const TYPE_SHORT: Record<PersonalDocType, string> = { ...TYPE_LABELS, pid: 'PID (carta internacional)' };

const TYPE_ICONS: Record<PersonalDocType, string> = {
  passaporte: '🛂',
  rg: '🪪',
  cnh: '🚗',
  pid: '🌎',
  visto: '📑',
  vacina: '💉',
  outro: '📄',
};

export const DOC_TYPES: PersonalDocType[] = ['passaporte', 'rg', 'cnh', 'pid', 'visto', 'vacina', 'outro'];

export const docTypeLabel = (t: PersonalDocType) => TYPE_LABELS[t];
export const docTypeShort = (t: PersonalDocType) => TYPE_SHORT[t];
export const docTypeIcon = (t: PersonalDocType) => TYPE_ICONS[t];

export function documentTitle(doc: PersonalDocument): string {
  if ((doc.type === 'outro' || doc.type === 'visto' || doc.type === 'vacina') && doc.title.trim()) {
    return doc.title.trim();
  }
  return TYPE_LABELS[doc.type];
}

/** "•••• 4821" — últimos 4 caracteres alfanuméricos; número curto mostra só os pontos. */
export function maskDocNumber(value: string): string {
  const clean = value.replace(/[^0-9a-zA-Z]/g, '');
  if (!clean) return '';
  return clean.length <= 4 ? '••••' : `•••• ${clean.slice(-4)}`;
}

/** "dd/mm/aaaa" → Date (meio-dia local, evita problema de fuso) ou null se incompleto/inválido. */
export function parseDisplayDate(value: string): Date | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12);
  return d.getMonth() === Number(mm) - 1 ? d : null;
}

export type ExpiryStatus =
  | { kind: 'none' }
  | { kind: 'ok' }
  | { kind: 'expired' }
  | { kind: 'before-trip-end' }
  | { kind: 'soon' };

/**
 * Só compara datas — não afirma regra de nenhum país.
 * tripEndISO: último dateEnd dos destinos da viagem atual, se existir.
 */
export function expiryStatus(doc: PersonalDocument, tripEndISO: string | null, today = new Date()): ExpiryStatus {
  const expiry = parseDisplayDate(doc.expiryDate);
  if (!expiry) return { kind: 'none' };
  if (expiry < today) return { kind: 'expired' };
  if (tripEndISO) {
    const [y, m, d] = tripEndISO.split('-').map(Number);
    if (expiry < new Date(y, m - 1, d, 12)) return { kind: 'before-trip-end' };
  }
  const sixMonths = new Date(today);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (expiry < sixMonths) return { kind: 'soon' };
  return { kind: 'ok' };
}

export function expiryStatusLabel(status: ExpiryStatus): string | null {
  switch (status.kind) {
    case 'expired':
      return 'Vencido';
    case 'before-trip-end':
      return 'Vence antes do fim da viagem';
    case 'soon':
      return 'Vence em menos de 6 meses';
    default:
      return null;
  }
}
