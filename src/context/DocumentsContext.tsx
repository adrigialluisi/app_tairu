import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Attachment } from './TripContext';

export type PersonalDocType =
  | 'passaporte' | 'rg' | 'cnh' | 'pid' | 'visto' | 'vacina' | 'seguro-anual' | 'outro';

export type ReminderLead = '6m' | '3m' | '1m' | 'off';

export interface PersonalDocument {
  id: string;
  type: PersonalDocType;
  /** título livre — usado em "Outro" e opcional em Visto/Vacina/Seguro anual (ex.: "Visto americano", "Febre amarela") */
  title: string;
  number: string;
  /** país emissor (passaporte, visto, PID) ou órgão/UF (RG, CNH) */
  issuer: string;
  /** "dd/mm/aaaa" ou "" */
  issueDate: string;
  /** "dd/mm/aaaa" ou "" */
  expiryDate: string;
  attachments: Attachment[];
  /**
   * nome como está no documento (todos os tipos desde o ajustes-82, que tirou o "De quem é"): no
   * passaporte tem que bater com a passagem; na vacina é quem tomou; no seguro, o titular
   */
  fullName: string;
  /** visto: '' (não informado) | 'unica' | 'multipla' */
  visaEntries: '' | 'unica' | 'multipla';
  /** visto: permanência máxima por entrada, em dias (texto numérico) */
  maxStayDays: string;
  /** vacina: "1ª dose", "reforço", "dose única"… */
  vaccineDose: string;
  /** seguro anual: telefone da central 24h */
  emergencyPhone: string;
  /** com quanto tempo de antecedência avisar antes da validade; padrão '6m' */
  remindBefore: ReminderLead;
}

interface DocumentsContextValue {
  documents: PersonalDocument[];
  saveDocument: (doc: PersonalDocument) => void;
  removeDocument: (id: string) => void;
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<PersonalDocument[]>([]);

  const value = useMemo<DocumentsContextValue>(
    () => ({
      documents,
      saveDocument: (doc) =>
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === doc.id);
          return exists ? prev.map((d) => (d.id === doc.id ? doc : d)) : [...prev, doc];
        }),
      removeDocument: (id) =>
        setDocuments((prev) => {
          prev.find((d) => d.id === id)?.attachments.forEach((a) => URL.revokeObjectURL(a.url));
          return prev.filter((d) => d.id !== id);
        }),
    }),
    [documents],
  );

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocuments(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments precisa estar dentro de <DocumentsProvider>');
  return ctx;
}
