import { Check, FolderOpen } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { SaveToast } from '../components/shell/SaveToast';
import { TextField } from '../components/inputs/TextField';
import { DocumentCard } from '../components/documents/DocumentCard';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { getMembers } from '../utils/costs';
import { placesWantedBy } from '../utils/mockContributions';
import { useTrip } from '../context/TripContext';
import { useDocuments } from '../context/DocumentsContext';
import { sortDocuments } from '../utils/documentSummary';
import { getTripEndISO } from '../utils/itinerary';
import { useSaveToast } from '../hooks/useSaveToast';
import { Icon } from '../components/shell/Icon';
import styles from './InviteCompanions.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** último aviso de entrada já mostrado — evita repetir o toast ao voltar pra tela */
let lastShownJoinSeq = 0;

export function InviteCompanions() {
  const trip = useTrip();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { message, visible, show } = useSaveToast();

  const docs = useDocuments();
  const members = getMembers(trip);

  // SIMULAÇÃO (ajustes-67): "Marina Duarte entrou na viagem e sugeriu N lugares"
  const notice = trip.companionJoinNotice;
  useEffect(() => {
    if (notice && notice.seq > lastShownJoinSeq) {
      lastShownJoinSeq = notice.seq;
      show(notice.message);
    }
    // só um aviso novo dispara o toast (`show` é recriado a cada render)
  }, [notice]);
  const hasCompanions = trip.companions.length > 0;
  // só os que a própria pessoa compartilhou — documentos de convidados não são simulados
  const sharedDocs = sortDocuments(docs.documents.filter((d) => trip.sharedDocumentIds.includes(d.id)));
  const tripEndISO = getTripEndISO(trip.destinations);

  function handleChange(value: string) {
    setEmail(value);
    if (error) setError(null);
  }

  function handleAdd() {
    const trimmed = email.trim();
    if (trimmed.length === 0) return;
    if (!EMAIL_RE.test(trimmed)) {
      setError('Digite um e-mail válido, no formato nome@exemplo.com.');
      return;
    }
    trip.addCompanion(trimmed);
    setEmail('');
    setError(null);
    show('Convite adicionado');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Convidar companheiros" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={<BottomNav />}
      toast={<SaveToast visible={visible} message={message} />}
    >
      <div className={styles.intro}>
        <h2 className={styles.title}>Quem mais vai?</h2>
        <p className={styles.subtitle}>
          Convide quem quiser, quando quiser — volte aqui a qualquer momento pra adicionar mais gente.
        </p>
      </div>

      <TextField
        id="companion-email"
        label="E-mail do convidado"
        type="email"
        inputMode="email"
        placeholder="email@exemplo.com"
        value={email}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        error={error}
        autoComplete="off"
      />

      <Button
        variant="secondary"
        fullWidth
        onClick={handleAdd}
        disabled={email.trim().length === 0}
      >
        Convidar
      </Button>

      {hasCompanions && (
        <ul className={styles.companionList}>
          {trip.companions.map((c) => {
            const member = members.find((m) => m.id === c.id);
            const joined = c.status === 'entrou';
            const suggested = placesWantedBy(trip.selectedPlaces, c.id);
            const paid = trip.expenses.filter((e) => e.paidBy === c.id).length;
            const summary = [
              suggested > 0 ? `sugeriu ${suggested} ${suggested === 1 ? 'lugar' : 'lugares'}` : '',
              paid > 0 ? `pagou ${paid} ${paid === 1 ? 'gasto' : 'gastos'}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <li key={c.id} className={styles.companionRow}>
                {joined && member && <MemberAvatars members={[member]} size="md" />}
                <span className={styles.companionInfo}>
                  {joined && c.name && <span className={styles.companionName}>{c.name}</span>}
                  <span className={styles.companionEmail}>{c.email}</span>
                  {joined ? (
                    <>
                      <span className={styles.companionStatus}>
                        <Icon icon={Check} /> Entrou na viagem
                      </span>
                      {summary && <span className={styles.companionSummary}>{summary}</span>}
                    </>
                  ) : (
                    <span className={styles.companionStatus}>
                      <Icon icon={Check} /> Convite enviado
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => trip.removeCompanion(c.id)}
                  aria-label={`Remover convite de ${c.name ?? c.email}`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section className={styles.groupDocs} aria-labelledby="group-docs-title">
        <div className={styles.groupDocsHeader}>
          <h2 id="group-docs-title" className={styles.groupDocsTitle}>
            <Icon icon={FolderOpen} />{' '}Documentos do grupo
          </h2>
          <p className={styles.groupDocsHint}>
            Documentos que cada pessoa escolheu compartilhar nesta viagem. Os dos convidados aparecem aqui quando eles
            entrarem.
          </p>
        </div>
        {sharedDocs.length === 0 ? (
          <p className={styles.groupDocsEmpty}>
            Nenhum documento compartilhado ainda.{' '}
            <button type="button" className={styles.inlineLink} onClick={() => navigate('/documentos')}>
              Escolher em Meus documentos
            </button>
          </p>
        ) : (
          <ul className={styles.groupDocsList}>
            {sharedDocs.map((doc) => (
              <li key={doc.id}>
                <DocumentCard
                  doc={doc}
                  tripEndISO={tripEndISO}
                  readOnly
                  shared
                  fromLabel={doc.holderName || 'Você'}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </ScreenShell>
  );
}
