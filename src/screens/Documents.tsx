import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Button } from '../components/shell/Button';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentForm } from '../components/documents/DocumentForm';
import { useDocuments, type PersonalDocument } from '../context/DocumentsContext';
import { useTrip } from '../context/TripContext';
import { DOC_TYPES } from '../utils/documentSummary';
import { getTripEndISO } from '../utils/itinerary';
import groupStyles from '../components/central/TransportDestinationGroup.module.css';
import styles from './Documents.module.css';

/**
 * Documentos saiu do menu fixo (ver docs/ajustes-26-central-inicio-documentos-splash.md)
 * — não é mais uma das seções de dentro de uma viagem, é acessível só pela
 * Início. Por isso usa `onBack` voltando pra Início, sem `bottomNav`.
 */

function sortDocuments(documents: PersonalDocument[]): PersonalDocument[] {
  return [...documents].sort((a, b) => DOC_TYPES.indexOf(a.type) - DOC_TYPES.indexOf(b.type));
}

export function Documents() {
  const navigate = useNavigate();
  const trip = useTrip();
  const docs = useDocuments();
  const [editingId, setEditingId] = useState<string | 'new' | null>(() =>
    docs.documents.length === 0 ? 'new' : null,
  );

  const tripEndISO = getTripEndISO(trip.destinations);
  const items = sortDocuments(docs.documents);

  return (
    <ScreenShell appBar={<AppBar title="Meus documentos" onBack={() => navigate('/inicio')} />}>
      <div className={styles.wrap}>
        <p className={styles.intro}>Seus documentos ficam guardados aqui e valem pra todas as suas viagens.</p>

        <div className={groupStyles.group}>
          {items.map((doc) =>
            editingId === doc.id ? (
              <DocumentForm
                key={doc.id}
                initialDoc={doc}
                tripEndISO={tripEndISO}
                onSave={(updated) => {
                  docs.saveDocument(updated);
                  setEditingId(null);
                }}
                onRemove={() => {
                  docs.removeDocument(doc.id);
                  setEditingId(null);
                }}
              />
            ) : (
              <DocumentCard key={doc.id} doc={doc} tripEndISO={tripEndISO} onEdit={() => setEditingId(doc.id)} />
            ),
          )}

          {editingId === 'new' && (
            <DocumentForm
              tripEndISO={tripEndISO}
              initialDoc={null}
              onSave={(doc) => {
                docs.saveDocument(doc);
                setEditingId(null);
              }}
            />
          )}

          {editingId === null && (
            <Button variant="secondary" onClick={() => setEditingId('new')}>
              + Adicionar documento
            </Button>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
