import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../shell/Button';
import { Switch } from '../shell/Switch';
import { RetroCardView } from './RetroCardView';
import { useTrip } from '../../context/TripContext';
import { buildRetrospective, retroShareText, retroStats } from '../../utils/retrospective';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './RetrospectivePanel.module.css';

interface RetrospectivePanelProps {
  onToast: (message: string) => void;
}

/**
 * Aba Retrospectiva de Memórias (docs/ajustes-65-memorias-retrospectiva.md):
 * opcional (convite), montada com frases-modelo e dados reais, editável
 * inline (ordem, foto, título/texto, ocultar). Gastos escondidos por padrão.
 */
export function RetrospectivePanel({ onToast }: RetrospectivePanelProps) {
  const trip = useTrip();
  const [mode, setMode] = useState<'ver' | 'editar'>('ver');
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const retro = trip.retrospective;
  const stats = retroStats(trip);
  const hasData = stats.days > 0;

  function generate() {
    trip.setRetrospective(buildRetrospective(trip));
    trip.setRetroDismissed(false);
    setMode('ver');
    setConfirmRegenerate(false);
  }

  async function share() {
    if (!retro) return;
    const title =
      retro.cards.find((c) => c.kind === 'capa' && !c.hidden)?.title || trip.name || 'Retrospectiva da viagem';
    const text = retroShareText(retro, trip);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        return;
      } catch (err) {
        // a pessoa fechou o menu de compartilhar: não faz nada
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${title}\n${text}`);
      onToast('Resumo copiado');
    } catch {
      onToast('Não deu pra copiar o resumo');
    }
  }

  if (!retro) {
    if (!hasData) {
      return (
        <Card asChild className="px-4">
        <div className={styles.invite}>
          <span className={styles.inviteIcon} aria-hidden="true"><Icon icon={Sparkles} /></span>
          <p className={styles.inviteText}>Preencha os destinos e datas da viagem pra gerar a retrospectiva.</p>
        </div>
        </Card>
      );
    }
    if (trip.retroDismissed) {
      return (
        <p className={styles.dismissedLine}>
          Retrospectiva não gerada ·{' '}
          <button type="button" className={styles.inlineLink} onClick={generate}>
            Gerar agora
          </button>
        </p>
      );
    }
    return (
      <Card asChild className="px-4">
      <div className={styles.invite}>
        <span className={styles.inviteIcon} aria-hidden="true"><Icon icon={Sparkles} /></span>
        <h3 className={styles.inviteTitle}>Quer gerar a retrospectiva da viagem?</h3>
        <p className={styles.inviteText}>
          Juntamos fotos, lugares e números da viagem num resumo que você pode editar e compartilhar.
        </p>
        <div className={styles.inviteActions}>
          <Button variant="primary" fullWidth onClick={generate}>
            Gerar retrospectiva
          </Button>
          <button type="button" className={styles.textButton} onClick={() => trip.setRetroDismissed(true)}>
            Agora não
          </button>
        </div>
        <p className={styles.note}>
          No app de verdade, esse convite chega quando a viagem termina. No protótipo dá pra gerar a qualquer momento.
        </p>
      </div>
      </Card>
    );
  }

  const editing = mode === 'editar';
  const cards = editing ? retro.cards : retro.cards.filter((c) => !c.hidden);

  return (
    <div className={styles.wrap}>
      <div className={styles.modeToggle} role="group" aria-label="Modo da retrospectiva">
        {(['ver', 'editar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`${styles.modeButton} ${mode === m ? styles.modeButtonActive : ''}`}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m === 'ver' ? 'Ver' : 'Editar'}
          </button>
        ))}
      </div>

      {editing && (
        <div className={styles.editTools}>
          <Switch
            label="Mostrar gastos"
            checked={retro.showCosts}
            onChange={trip.setRetroShowCosts}
            hint="Desligado, ninguém vê quanto vocês gastaram."
          />

          {confirmRegenerate ? (
            <div className={styles.confirm} role="alert">
              <p className={styles.confirmText}>Isso desfaz suas edições. Gerar de novo?</p>
              <div className={styles.confirmActions}>
                <Button variant="secondary" onClick={generate}>
                  Sim, gerar de novo
                </Button>
                <button type="button" className={styles.textButton} onClick={() => setConfirmRegenerate(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.textButton} onClick={() => setConfirmRegenerate(true)}>
              <Icon icon={RefreshCw} /> Gerar de novo
            </button>
          )}
        </div>
      )}

      <ul className={styles.cards}>
        {cards.map((card) => {
          const index = retro.cards.findIndex((c) => c.id === card.id);
          return (
            <li key={card.id}>
              <RetroCardView
                card={card}
                editing={editing}
                isFirst={index === 0}
                isLast={index === retro.cards.length - 1}
                photos={trip.photos}
                destinations={trip.destinations}
                stats={stats}
                showCosts={retro.showCosts}
                onChange={trip.updateRetroCard}
                onMove={(direction) => trip.moveRetroCard(card.id, direction)}
              />
            </li>
          );
        })}
      </ul>

      {!editing && cards.length === 0 && (
        <p className={styles.note}>Todos os cards estão ocultos. Use "Editar" pra mostrar.</p>
      )}

      {!editing && cards.length > 0 && (
        <Button variant="secondary" fullWidth onClick={share}>
          Compartilhar
        </Button>
      )}
    </div>
  );
}
