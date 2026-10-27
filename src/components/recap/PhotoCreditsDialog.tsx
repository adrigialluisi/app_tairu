import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ExamplePhoto } from '../../data/examplePastTrips';

/**
 * "Créditos das fotos" da viagem passada de exemplo (ajustes-95): saiu do último cartão da
 * recordação e virou um link discreto no rodapé da tela, que abre a lista num Dialog. Os créditos
 * continuam obrigatórios pelas licenças (CC BY / CC BY-SA): lugar, autor, licença e link pra página
 * da foto no Wikimedia Commons. --muted no branco 7.63:1; link --accent-dark 9.67:1.
 */
export function PhotoCreditsDialog({ photos }: { photos: { placeName: string; photo: ExamplePhoto }[] }) {
  const [open, setOpen] = useState(false);
  if (photos.length === 0) return null;
  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer items-center self-start border-0 bg-transparent p-0 text-(length:--text-sm) text-muted-foreground underline underline-offset-4"
        onClick={() => setOpen(true)}
      >
        Créditos das fotos
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-3">
          <DialogTitle className="m-0 text-(length:--text-lg) font-semibold text-foreground">Créditos das fotos</DialogTitle>
          <DialogDescription className="m-0 text-(length:--text-sm) text-muted-foreground">
            Fotos de exemplo · Wikimedia Commons
          </DialogDescription>
          <ul className="m-0 flex min-h-0 list-none flex-col gap-2 overflow-y-auto p-0 text-(length:--text-sm) text-foreground">
            {photos.map(({ placeName, photo }) => (
              <li key={photo.id}>
                <span className="font-medium">{placeName}</span> — {photo.author} · {photo.license} ·{' '}
                <a href={photo.sourcePage} target="_blank" rel="noreferrer" className="text-(--accent-dark) underline">
                  Wikimedia Commons
                  <span className="visually-hidden"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
