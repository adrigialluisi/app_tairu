import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ExamplePhoto } from '../../data/examplePastTrips';
import { shortName } from '../../utils/pastTrip';
import { Icon } from '../shell/Icon';
import { TravelerAvatar } from './TravelerAvatar';

/** foto do álbum da viagem passada: de exemplo (Wikimedia Commons) ou adicionada agora, do celular */
export interface AlbumPhoto extends ExamplePhoto {
  /** adicionada nesta sessão ("Adicionar foto"): só no aparelho, sem crédito */
  local?: boolean;
}

export interface AlbumPhotoItem {
  photo: AlbumPhoto;
  placeName: string;
  /** "Dia 2 · Dom, 11/05" */
  dayLabel: string;
}

interface ExamplePhotoDialogProps {
  /** fotos do mesmo dia, na ordem do álbum — deslizar/setas passam entre elas */
  items: AlbumPhotoItem[];
  /** foto aberta (índice em `items`), ou null = fechado */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** deslize horizontal mínimo pra trocar de foto */
const SWIPE_PX = 50;

/**
 * Foto do álbum da viagem passada em tela cheia (ajustes-78/79; navegação no ajustes-91): lugar,
 * dia, quem adicionou e — na foto de exemplo — a marca "Foto de exemplo · Wikimedia Commons" (o
 * crédito com autor, licença e link fica na tela /creditos desde o ajustes-99c). Deslizar, as setas ‹ › (44px) ou ← → do teclado passam pra foto seguinte do mesmo dia.
 * Dialog do shadcn (Esc fecha, foco preso); fundo stone-900, texto branco (17.49:1; o secundário
 * em branco 80%, ≥ 11:1).
 */
export function ExamplePhotoDialog({ items, index, onIndexChange, onClose }: ExamplePhotoDialogProps) {
  const startX = useRef<number | null>(null);
  const item = index !== null ? items[index] : undefined;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  function go(delta: -1 | 1) {
    if (index === null) return;
    const next = index + delta;
    if (next >= 0 && next < items.length) onIndexChange(next);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  }

  function handlePointerUp(e: PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx <= -SWIPE_PX) go(1);
    else if (dx >= SWIPE_PX) go(-1);
  }

  const navButton =
    'absolute top-1/2 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-[22px] text-white disabled:hidden';

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      {item && (
        <DialogContent
          showCloseButton={false}
          onKeyDown={handleKeyDown}
          className="inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-foreground p-0 text-white ring-0 sm:max-w-none"
        >
          <div className="flex items-center justify-between gap-2 p-2 pl-4">
            <span className="text-(length:--text-sm) text-white/80">
              {item.dayLabel} · {index! + 1} de {items.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar foto"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[22px] text-white"
            >
              <Icon icon={X} />
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center"
            onPointerDown={(e) => (startX.current = e.clientX)}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => (startX.current = null)}
          >
            <img src={item.photo.url} alt="" draggable={false} className="max-h-full max-w-full object-contain select-none" />
            <button type="button" className={`${navButton} left-2`} disabled={!hasPrev} onClick={() => go(-1)} aria-label="Foto anterior">
              <Icon icon={ChevronLeft} />
            </button>
            <button type="button" className={`${navButton} right-2`} disabled={!hasNext} onClick={() => go(1)} aria-label="Próxima foto">
              <Icon icon={ChevronRight} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <DialogTitle className="m-0 text-(length:--text-lg) leading-snug font-semibold text-white">{item.placeName}</DialogTitle>
            <p className="m-0 flex items-center gap-2 text-(length:--text-base) text-white">
              <TravelerAvatar travelerId={item.photo.addedBy} />
              Adicionada por {shortName(item.photo.addedBy)}
            </p>
            <DialogDescription className="m-0 text-(length:--text-sm) text-white/80">
              {item.photo.local ? (
                'Foto do seu celular — fica só neste aparelho.'
              ) : (
                // crédito (autor, licença, link) centralizado na tela /creditos (ajustes-99c); aqui só a marca de exemplo
                'Foto de exemplo · Wikimedia Commons'
              )}
            </DialogDescription>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
