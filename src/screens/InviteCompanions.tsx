import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { SaveToast } from '../components/shell/SaveToast';
import { TextField } from '../components/inputs/TextField';
import { useTrip } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import styles from './InviteCompanions.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteCompanions() {
  const trip = useTrip();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { message, visible, show } = useSaveToast();

  const hasCompanions = trip.companions.length > 0;

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
          {trip.companions.map((c) => (
            <li key={c.id} className={styles.companionRow}>
              <span className={styles.companionEmail}>{c.email}</span>
              <span className={styles.companionStatus}>
                <span aria-hidden="true">✓</span> Convite enviado
              </span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => trip.removeCompanion(c.id)}
                aria-label={`Remover convite de ${c.email}`}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
