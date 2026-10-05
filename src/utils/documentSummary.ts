import { BookUser, Car, FileText, Globe, IdCard, ShieldCheck, Stamp, Syringe, type LucideIcon } from 'lucide-react';
import type { PersonalDocType, PersonalDocument, ReminderLead } from '../context/DocumentsContext';

const TYPE_LABELS: Record<PersonalDocType, string> = {
  passaporte: 'Passaporte',
  rg: 'RG',
  cnh: 'CNH',
  pid: 'Permissão Internacional para Dirigir',
  visto: 'Visto',
  vacina: 'Certificado de vacina',
  'seguro-anual': 'Seguro viagem anual',
  outro: 'Outro',
};

const TYPE_SHORT: Record<PersonalDocType, string> = {
  ...TYPE_LABELS,
  pid: 'PID (carta internacional)',
  'seguro-anual': 'Seguro anual',
};

const TYPE_ICONS: Record<PersonalDocType, LucideIcon> = {
  passaporte: BookUser,
  rg: IdCard,
  cnh: Car,
  pid: Globe,
  visto: Stamp,
  vacina: Syringe,
  'seguro-anual': ShieldCheck,
  outro: FileText,
};

/** Também é a ordem de exibição — o que mais importa pra viagem internacional vem primeiro. */
export const DOC_TYPES: PersonalDocType[] = [
  'passaporte',
  'visto',
  'vacina',
  'seguro-anual',
  'rg',
  'cnh',
  'pid',
  'outro',
];

export const docTypeLabel = (t: PersonalDocType) => TYPE_LABELS[t];
export const docTypeShort = (t: PersonalDocType) => TYPE_SHORT[t];
export const docTypeIcon = (t: PersonalDocType) => TYPE_ICONS[t];

export function documentTitle(doc: PersonalDocument): string {
  const usesTitle =
    doc.type === 'outro' || doc.type === 'visto' || doc.type === 'vacina' || doc.type === 'seguro-anual';
  if (usesTitle && doc.title.trim()) {
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

const REMINDER_MONTHS: Record<Exclude<ReminderLead, 'off'>, 6 | 3 | 1> = { '6m': 6, '3m': 3, '1m': 1 };

export type ExpiryStatus =
  | { kind: 'none' }
  | { kind: 'ok' }
  | { kind: 'expired' }
  | { kind: 'before-trip-end' }
  | { kind: 'soon'; months: 6 | 3 | 1 };

/**
 * Só compara datas — não afirma regra de nenhum país.
 * tripEndISO: último dateEnd dos destinos da viagem atual, se existir.
 * 'expired' e 'before-trip-end' valem sempre; o limite do 'soon' vem do
 * lembrete escolhido pela pessoa (`remindBefore`), e com 'off' nunca dispara.
 */
export function expiryStatus(doc: PersonalDocument, tripEndISO: string | null, today = new Date()): ExpiryStatus {
  const expiry = parseDisplayDate(doc.expiryDate);
  if (!expiry) return { kind: 'none' };
  if (expiry < today) return { kind: 'expired' };
  if (tripEndISO) {
    const [y, m, d] = tripEndISO.split('-').map(Number);
    if (expiry < new Date(y, m - 1, d, 12)) return { kind: 'before-trip-end' };
  }
  if (doc.remindBefore !== 'off') {
    const months = REMINDER_MONTHS[doc.remindBefore];
    const limit = new Date(today);
    limit.setMonth(limit.getMonth() + months);
    if (expiry < limit) return { kind: 'soon', months };
  }
  return { kind: 'ok' };
}

export function expiryStatusLabel(status: ExpiryStatus): string | null {
  switch (status.kind) {
    case 'expired':
      return 'Vencido';
    case 'before-trip-end':
      return 'Vence antes do fim da viagem';
    case 'soon':
      return status.months === 1 ? 'Vence em menos de 1 mês' : `Vence em menos de ${status.months} meses`;
    default:
      return null;
  }
}

/** expired | before-trip-end | soon → precisa de atenção (alimenta a Início) */
export function needsAttention(doc: PersonalDocument, tripEndISO: string | null): boolean {
  const kind = expiryStatus(doc, tripEndISO).kind;
  return kind === 'expired' || kind === 'before-trip-end' || kind === 'soon';
}

/** "Passaporte vence antes do fim da viagem" — título do documento + texto do selo em minúsculas */
export function attentionText(doc: PersonalDocument, status: ExpiryStatus): string {
  const label = expiryStatusLabel(status);
  return label ? `${documentTitle(doc)} ${label.charAt(0).toLowerCase()}${label.slice(1)}` : documentTitle(doc);
}

/** Ordem de exibição: a mesma de DOC_TYPES (o que mais importa pra viagem internacional primeiro). */
export function sortDocuments(documents: PersonalDocument[]): PersonalDocument[] {
  return [...documents].sort((a, b) => DOC_TYPES.indexOf(a.type) - DOC_TYPES.indexOf(b.type));
}
