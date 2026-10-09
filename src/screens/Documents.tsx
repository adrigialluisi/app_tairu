import { CloudCheck, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Button } from '../components/shell/Button';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentForm } from '../components/documents/DocumentForm';
import { useDocuments, type PersonalDocument } from '../context/DocumentsContext';
import { useTrip } from '../context/TripContext';
import { sortDocuments } from '../utils/documentSummary';
import { getTripEndISO } from '../utils/itinerary';
import { Icon } from '../components/shell/Icon';
import groupStyles from '../components/central/TransportDestinationGroup.module.css';
import styles from './Documents.module.css';

/**
 * Documentos saiu do menu fixo (ver docs/ajustes-26-central-inicio-documentos-splash.md)
 * — não é mais uma das seções de dentro de uma viagem, é acessível só pela
 * Início. Por isso usa `onBack` voltando pra Início, sem `bottomNav`.
 */


export function Documents() {
  const navigate = useNavigate();
  const trip = useTrip();
  const docs = useDocuments();
  const location = useLocation();
  // Vindo de um aviso da Início: abre direto o formulário daquele documento.
  const openDocId = (location.state as { openDocId?: string } | null)?.openDocId;
  const [editingId, setEditingId] = useState<string | 'new' | null>(() => {
    if (openDocId && docs.documents.some((d) => d.id === openDocId)) return openDocId;
    return docs.documents.length === 0 ? 'new' : null;
  });
  const openedDocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openedDocRef.current?.scrollIntoView({ block: 'start' });
  }, []);

  const tripEndISO = getTripEndISO(trip.destinations);
  const items = sortDocuments(docs.documents);

  function handleSave(doc: PersonalDocument) {
    docs.saveDocument(doc);
    setEditingId(null);
  }

  function handleRemove(id: string) {
    docs.removeDocument(id);
    setEditingId(null);
  }

  const formTripProps = {
    tripEndISO,
    onSave: handleSave,
  };

  return (
    <ScreenShell appBar={<AppBar title="Meus documentos" onBack={() => navigate('/inicio')} />}>
      <div className={styles.wrap}>
        <div className={styles.introGroup}>
          <p className={styles.intro}>Seus documentos ficam guardados aqui e valem pra todas as suas viagens.</p>
          {/* offline é o padrão (ajustes-82): linha fixa, não mais uma contagem */}
          <p className={styles.offlineLine}>
            <Icon icon={CloudCheck} className="text-success" /> Seus documentos ficam salvos no celular e abrem sem
            internet.
          </p>
        </div>

        <div className={groupStyles.group}>
          {items.map((doc) =>
            editingId === doc.id ? (
              <div key={doc.id} ref={doc.id === openDocId ? openedDocRef : undefined}>
                <DocumentForm
                  {...formTripProps}
                  initialDoc={doc}
                  onRemove={() => handleRemove(doc.id)}
                />
              </div>
            ) : (
              <DocumentCard
                key={doc.id}
                doc={doc}
                tripEndISO={tripEndISO}
                onEdit={() => setEditingId(doc.id)}
              />
            ),
          )}

          {editingId === 'new' && (
            <DocumentForm {...formTripProps} initialDoc={null} />
          )}

          {editingId === null && (
            <Button variant="secondary" onClick={() => setEditingId('new')}>
              <Icon icon={Plus} /> Adicionar documento
            </Button>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
