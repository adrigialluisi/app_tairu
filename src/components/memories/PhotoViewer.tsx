import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Star, Tag, X } from 'lucide-react';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { useTrip, type TripPhoto } from '../../context/TripContext';
import { cityForDay, dayStops, photoPlaceName, photoTargetKey, type PhotoTarget } from '../../utils/photos';
import { formatISOToShortDay } from '../../utils/dateMask';
import { Icon } from '../shell/Icon';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import styles from './PhotoViewer.module.css';

interface PhotoViewerProps {
  photo: TripPhoto;
  /** fotos do filtro atual, na ordem da galeria — pras setas ‹ › */
  sequence: TripPhoto[];
  /** dias da viagem (ISO), pro select "Dia" */
  days: string[];
  onNavigate: (photoId: string) => void;
  onRemove: (photo: TripPhoto) => void;
  onClose: () => void;
}

const OTHER = '__outro__';
const NO_DAY = '';

/**
 * Foto aberta por cima da tela (docs/ajustes-64-memorias-fotos.md, 4.4), em
 * Dialog do shadcn em tela cheia (docs/ajustes-74-...md): o Radix prende o
 * foco, fecha com Esc e devolve o foco à foto que abriu. Fundo escuro, X de
 * 44px, setas ‹ › (também ← → do teclado, fora dos campos). Mudanças salvam
 * na hora (updatePhoto), sem "Salvar".
 */
export function PhotoViewer({ photo, sequence, days, onNavigate, onRemove, onClose }: PhotoViewerProps) {
  const trip = useTrip();
  const baseId = useId();
  const [otherOpen, setOtherOpen] = useState(false);

  // "Outro" aberto vale só pra foto em que foi aberto
  useEffect(() => setOtherOpen(false), [photo.id]);

  // "Onde foi?": paradas e eventos do dia (ajustes-75) — a foto passa a se ligar a eles, não só a um texto
  const currentKey = photoTargetKey(photo);
  const targets: PhotoTarget[] = photo.dayISO ? dayStops(photo.dayISO, trip) : [];
  // parada que mudou de dia continua ligada: aparece como opção pra seguir marcada
  if (currentKey && !targets.some((t) => t.key === currentKey)) {
    targets.push({
      key: currentKey,
      label: photoPlaceName(photo, trip) ?? 'Lugar',
      placeSelectionId: photo.placeSelectionId,
      eventId: photo.eventId,
      skipped: false,
    });
  }
  const placeIsCustom = !currentKey && photo.placeLabel !== null;
  const showOtherField = otherOpen || placeIsCustom;
  const city = photo.dayISO ? cityForDay(photo.dayISO, trip.destinations) : null;
  const index = sequence.findIndex((p) => p.id === photo.id);
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  function update(changes: Partial<TripPhoto>) {
    trip.updatePhoto({ ...photo, ...changes });
  }

  const unlinked = { placeSelectionId: null, eventId: null } as const;

  function handlePlaceChip(value: string) {
    if (value === OTHER) {
      setOtherOpen(true);
      if (!placeIsCustom) update({ ...unlinked, placeLabel: null });
      return;
    }
    setOtherOpen(false);
    // tocar de novo no lugar marcado desmarca (campo opcional)
    const target = targets.find((t) => t.key === value);
    if (!target || value === currentKey) {
      update({ ...unlinked, placeLabel: null });
      return;
    }
    update({ placeSelectionId: target.placeSelectionId, eventId: target.eventId, placeLabel: target.label });
  }

  /** trocar o dia limpa o lugar ligado se ele não for daquele dia (texto livre de "Outro" fica) */
  function handleDayChange(nextDay: string | null) {
    setOtherOpen(false);
    const stillThere = nextDay !== null && currentKey !== null && dayStops(nextDay, trip).some((t) => t.key === currentKey);
    update({
      dayISO: nextDay,
      dayManual: true,
      ...(currentKey && !stillThere ? { ...unlinked, placeLabel: null } : {}),
    });
  }

  // ← → trocam de foto, mas não dentro de campo (lá elas movem o cursor do texto)
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowLeft' && prev) onNavigate(prev.id);
    else if (e.key === 'ArrowRight' && next) onNavigate(next.id);
  }

  const dayText = photo.dayISO ? formatISOToShortDay(photo.dayISO) : 'Sem dia da viagem';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onKeyDown={handleKeyDown}
        className={`${styles.overlay} inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none p-0 ring-0 sm:max-w-none`}
      >
        <DialogTitle className="sr-only">
          {photo.caption || `Foto: ${dayText}${city ? `, ${city}` : ''}`}
        </DialogTitle>
      <div className={styles.topBar}>
        <span className={styles.counter}>
          {index + 1} de {sequence.length}
        </span>
        <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar foto">
          <Icon icon={X} />
        </button>
      </div>

      <div className={styles.stage}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => prev && onNavigate(prev.id)}
          disabled={!prev}
          aria-label="Foto anterior"
        >
          <Icon icon={ChevronLeft} />
        </button>
        <img src={photo.url} alt={photo.caption || ''} className={styles.image} />
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => next && onNavigate(next.id)}
          disabled={!next}
          aria-label="Próxima foto"
        >
          <Icon icon={ChevronRight} />
        </button>
      </div>

      <div className={styles.panel}>
        <div className={styles.tagRow}>
          <p className={styles.where}>
            <Icon icon={CalendarDays} />{' '}
            {dayText}
            {city && (
              <>
                {' · '}
                <Icon icon={MapPin} />{' '}
                {city}
              </>
            )}
          </p>
          {photo.dayISO && !photo.dayManual && (
            <Badge variant="neutral">
              <Icon icon={Tag} /> Marcada automaticamente pela data
            </Badge>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${baseId}-day`} className={styles.label}>
            Dia
          </label>
          <select
            id={`${baseId}-day`}
            className={styles.select}
            value={photo.dayISO ?? NO_DAY}
            onChange={(e) => handleDayChange(e.target.value || null)}
          >
            {days.map((d) => {
              const c = cityForDay(d, trip.destinations);
              return (
                <option key={d} value={d}>
                  {formatISOToShortDay(d)}
                  {c ? ` · ${c}` : ''}
                </option>
              );
            })}
            <option value={NO_DAY}>Sem dia</option>
          </select>
        </div>

        {photo.dayISO && (
          <div className={styles.field}>
            <OptionChipGroup
              legend="Onde foi? (opcional)"
              options={[...targets.map((t) => ({ value: t.key, label: t.label })), { value: OTHER, label: 'Outro' }]}
              value={showOtherField ? OTHER : currentKey}
              onChange={handlePlaceChip}
            />
            {showOtherField && (
              <TextField
                id={`${baseId}-place`}
                label="Nome do lugar"
                value={photo.placeLabel ?? ''}
                onChange={(v) => update({ ...unlinked, placeLabel: v.trim() ? v : null })}
                autoComplete="off"
              />
            )}
          </div>
        )}

        <TextField
          id={`${baseId}-caption`}
          label="Legenda (opcional)"
          value={photo.caption}
          onChange={(v) => update({ caption: v })}
          autoComplete="off"
        />

        <div className={styles.field}>
          <Button
            variant={photo.favorite ? 'primary' : 'secondary'}
            fullWidth
            aria-pressed={photo.favorite}
            onClick={() => update({ favorite: !photo.favorite })}
          >
            <Icon icon={Star} /> Destaque da viagem
          </Button>
          <p className={styles.hint}>Os destaques entram primeiro na retrospectiva.</p>
        </div>

        <button type="button" className={styles.removeButton} onClick={() => onRemove(photo)}>
          Remover foto
        </button>
      </div>
      </DialogContent>
    </Dialog>
  );
}
