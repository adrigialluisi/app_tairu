import { ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ExamplePhoto } from '../../data/examplePastTrips';
import { shortName } from '../../utils/pastTrip';
import { Icon } from '../shell/Icon';
import { TravelerAvatar } from './TravelerAvatar';

interface ExamplePhotoDialogProps {
  photo: ExamplePhoto | null;
  placeName: string;
  onClose: () => void;
}

/**
 * Foto de exemplo da viagem passada em tela cheia (docs/ajustes-78-... item 2 e
 * ajustes-79 item 2): nome do lugar, quem adicionou e o crédito obrigatório do
 * Wikimedia Commons com link pra página do arquivo. Dialog do shadcn (Esc fecha,
 * foco preso); fundo stone-900, texto branco (17.49:1; o secundário em branco
 * 80%, ≥ 11:1).
 */
export function ExamplePhotoDialog({ photo, placeName, onClose }: ExamplePhotoDialogProps) {
  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      {photo && (
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-foreground p-0 text-white ring-0 sm:max-w-none"
        >
          <div className="flex justify-end p-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar foto"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[22px] text-white"
            >
              <Icon icon={X} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img src={photo.url} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <DialogTitle className="m-0 text-(length:--text-lg) leading-snug font-semibold text-white">{placeName}</DialogTitle>
            <p className="m-0 flex items-center gap-2 text-(length:--text-base) text-white">
              <TravelerAvatar travelerId={photo.addedBy} />
              Adicionada por {shortName(photo.addedBy)}
            </p>
            <DialogDescription className="m-0 text-(length:--text-sm) text-white/80">
              Foto: {photo.author} · {photo.license} ·{' '}
              <a
                href={photo.sourcePage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1 font-medium text-white underline underline-offset-4"
              >
                Wikimedia Commons <Icon icon={ExternalLink} />
              </a>
            </DialogDescription>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
