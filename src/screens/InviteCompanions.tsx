import { Check, Clock, MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { SaveToast } from '../components/shell/SaveToast';
import { TextField } from '../components/inputs/TextField';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { getMembers, YOU } from '../utils/costs';
import { placesWantedBy } from '../utils/mockContributions';
import { useTrip, type TripCompanion } from '../context/TripContext';
import { useSaveToast, withOffline } from '../hooks/useSaveToast';
import { Icon } from '../components/shell/Icon';
import styles from './InviteCompanions.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_ERROR = 'Digite um e-mail válido, no formato nome@exemplo.com.';

/** último aviso de entrada já mostrado — evita repetir o toast ao voltar pra tela */
let lastShownJoinSeq = 0;

/* classes dos componentes do shadcn adicionados no ajustes-83, pra seguirem o padrão do Tairu:
   alvo de 44px, texto 15px, foco pelo anel global (ring do shadcn desligado) */
const MENU_ITEM = 'min-h-11 px-3 text-(length:--text-base)';
const DIALOG_BUTTON = 'h-auto min-h-11 rounded-md px-4 text-(length:--text-base) font-medium focus-visible:ring-0';

function companionName(c: TripCompanion): string {
  return c.name ?? c.email;
}

/**
 * Convidados (rota /convidar) — docs/ajustes-83-convidados-so-convites-e-membros.md:
 * só convites e quem está na viagem. "Convidar" (e-mail), "Na viagem" (você +
 * quem entrou, com "Remover da viagem" num menu) e "Convites enviados" (pendentes,
 * com reenviar, corrigir e-mail e cancelar). "Documentos do grupo" saiu.
 */
export function InviteCompanions() {
  const trip = useTrip();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TripCompanion | null>(null);
  // "Corrigir e-mail": o foco vai pro campo (autoFocus), então o menu não devolve o foco pro botão dele
  const skipMenuFocusRef = useRef(false);
  const { message, visible, show, action, hide } = useSaveToast();

  const members = getMembers(trip);
  const you = members.find((m) => m.id === YOU)!;
  const joined = trip.companions.filter((c) => c.status === 'entrou');
  const pending = trip.companions.filter((c) => c.status === 'convite-enviado');
  const peopleCount = 1 + joined.length;

  // SIMULAÇÃO (ajustes-67): "Marina Duarte entrou na viagem e sugeriu N lugares"
  const notice = trip.companionJoinNotice;
  useEffect(() => {
    if (notice && notice.seq > lastShownJoinSeq) {
      lastShownJoinSeq = notice.seq;
      show(notice.message);
    }
    // só um aviso novo dispara o toast (`show` é recriado a cada render)
  }, [notice]);

  function handleChange(value: string) {
    setEmail(value);
    if (error) setError(null);
  }

  function handleAdd() {
    const trimmed = email.trim();
    if (trimmed.length === 0) return;
    if (!EMAIL_RE.test(trimmed)) {
      setError(EMAIL_ERROR);
      return;
    }
    trip.addCompanion(trimmed);
    setEmail('');
    setError(null);
    show(withOffline('Convite adicionado'));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function startEdit(c: TripCompanion) {
    skipMenuFocusRef.current = true;
    setEditingId(c.id);
    setEditEmail(c.email);
    setEditError(null);
  }

  function saveEdit(c: TripCompanion) {
    const trimmed = editEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEditError(EMAIL_ERROR);
      return;
    }
    if (trimmed !== c.email) {
      trip.updateCompanionEmail(c.id, trimmed);
      show(withOffline('E-mail do convite corrigido'));
    }
    setEditingId(null);
  }

  function cancelInvite(c: TripCompanion) {
    trip.removeCompanion(c.id);
    // sem confirmação; o "Desfazer" convida o mesmo e-mail de novo
    show('Convite cancelado', { label: 'Desfazer', onClick: () => trip.addCompanion(c.email) });
  }

  function confirmRemove() {
    if (!removing) return;
    trip.removeCompanion(removing.id);
    show(`${companionName(removing)} saiu da viagem`);
    setRemoving(null);
  }

  function menuTrigger(label: string) {
    return (
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          iconOnly
          aria-label={label}
          className="text-muted-foreground hover:bg-muted hover:text-foreground hover:no-underline"
        >
          <Icon icon={MoreVertical} />
        </Button>
      </DropdownMenuTrigger>
    );
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Convidados" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={<BottomNav />}
      toast={<SaveToast visible={visible} message={message} action={action} onDone={hide} />}
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

      <Button variant="secondary" fullWidth onClick={handleAdd} disabled={email.trim().length === 0}>
        Convidar
      </Button>

      <section aria-labelledby="na-viagem-title" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="na-viagem-title" className="m-0 text-(length:--text-lg) font-semibold text-foreground">
            Na viagem
          </h2>
          <span className="text-(length:--text-sm) text-muted-foreground">
            {peopleCount} {peopleCount === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>
        <Card className="gap-0 py-0">
          <ul className="m-0 list-none p-0">
            <li className={styles.row}>
              <MemberAvatars members={[you]} size="md" />
              <span className={styles.info}>
                <span className={styles.name}>Você</span>
              </span>
              <Badge variant="accent">Organizador(a)</Badge>
            </li>
            {joined.map((c) => {
              const member = members.find((m) => m.id === c.id);
              const suggested = placesWantedBy(trip.selectedPlaces, c.id);
              const paid = trip.expenses.filter((e) => e.paidBy === c.id).length;
              const summary = [
                suggested > 0 ? `sugeriu ${suggested} ${suggested === 1 ? 'lugar' : 'lugares'}` : '',
                paid > 0 ? `pagou ${paid} ${paid === 1 ? 'gasto' : 'gastos'}` : '',
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={c.id} className={styles.row}>
                  {member && <MemberAvatars members={[member]} size="md" />}
                  <span className={styles.info}>
                    <span className={styles.name}>{companionName(c)}</span>
                    {c.name && <span className={styles.meta}>{c.email}</span>}
                    {summary && <span className={styles.meta}>{summary}</span>}
                    <Badge variant="success" className="mt-1 self-start">
                      <Icon icon={Check} /> Na viagem
                    </Badge>
                  </span>
                  {/* não modal: o menu abre um AlertDialog, e dois modais do Radix em sequência travam o toque na tela */}
                  <DropdownMenu modal={false}>
                    {menuTrigger(`Opções de ${companionName(c)}`)}
                    <DropdownMenuContent align="end" className="w-auto min-w-48">
                      <DropdownMenuItem variant="destructive" className={MENU_ITEM} onSelect={() => setRemoving(c)}>
                        Remover da viagem
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        </Card>
        {trip.companions.length === 0 && (
          <p className="m-0 text-(length:--text-sm) text-muted-foreground">
            Convide quem vai com você. Cada um pode sugerir lugares e lançar gastos.
          </p>
        )}
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="convites-title" className="flex flex-col gap-3">
          <h2 id="convites-title" className="m-0 text-(length:--text-lg) font-semibold text-foreground">
            Convites enviados
          </h2>
          <Card className="gap-0 py-0">
            <ul className="m-0 list-none p-0">
              {pending.map((c) =>
                editingId === c.id ? (
                  <li key={c.id} className={`${styles.row} flex-col items-stretch`}>
                    <TextField
                      id={`edit-email-${c.id}`}
                      label="Corrigir e-mail"
                      type="email"
                      inputMode="email"
                      value={editEmail}
                      onChange={(v) => {
                        setEditEmail(v);
                        if (editError) setEditError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveEdit(c);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      error={editError}
                      autoComplete="off"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button className="min-w-0 flex-1" onClick={() => saveEdit(c)}>
                        Salvar
                      </Button>
                      <Button variant="secondary" className="min-w-0 flex-1" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li key={c.id} className={styles.row}>
                    <span className={styles.info}>
                      <span className={styles.name}>{c.email}</span>
                      <span className={styles.meta}>enviado hoje</span>
                      <Badge variant="neutral" className="mt-1 self-start">
                        <Icon icon={Clock} /> Aguardando resposta
                      </Badge>
                    </span>
                    <DropdownMenu>
                      {menuTrigger(`Opções do convite para ${c.email}`)}
                      <DropdownMenuContent
                        align="end"
                        className="w-auto min-w-48"
                        onCloseAutoFocus={(e) => {
                          if (skipMenuFocusRef.current) e.preventDefault();
                          skipMenuFocusRef.current = false;
                        }}
                      >
                        <DropdownMenuItem
                          className={MENU_ITEM}
                          onSelect={() => show(`Convite reenviado para ${c.email}`)}
                        >
                          Reenviar convite
                        </DropdownMenuItem>
                        <DropdownMenuItem className={MENU_ITEM} onSelect={() => startEdit(c)}>
                          Corrigir e-mail
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" className={MENU_ITEM} onSelect={() => cancelInvite(c)}>
                          Cancelar convite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ),
              )}
            </ul>
          </Card>
        </section>
      )}

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-(length:--text-lg) font-semibold">
              Remover {removing && companionName(removing)} da viagem?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-(length:--text-base)">
              Os lugares e gastos que {removing && companionName(removing)} adicionou continuam no roteiro e em Custos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={`${DIALOG_BUTTON} border-primary bg-background text-(--accent-dark) hover:bg-accent-soft`}
            >
              Cancelar
            </AlertDialogCancel>
            {/* branco sobre --destructive 6.57:1 (hover --accent-dark, 9.67:1) */}
            <AlertDialogAction
              className={`${DIALOG_BUTTON} bg-destructive text-white hover:bg-(--accent-dark)`}
              onClick={confirmRemove}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenShell>
  );
}
