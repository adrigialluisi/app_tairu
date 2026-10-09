import type { ReactNode } from 'react';

/** O mínimo de uma foto pra virar miniatura — TripPhoto (ajustes-75) e foto de exemplo da viagem passada (ajustes-78) */
export interface StopPhotoItem {
  id: string;
  url: string;
  caption?: string;
  /** nome acessível completo da miniatura (ex.: "Torre de Belém, foto adicionada por Camila"); sem ele, usa legenda/posição */
  label?: string;
  /** selo no canto inferior esquerdo (ex.: avatar de quem adicionou, ajustes-79) — decorativo, o `label` diz o que é */
  badge?: ReactNode;
}

interface StopPhotosProps {
  photos: StopPhotoItem[];
  /** nome do lugar/evento — vai no nome acessível das miniaturas */
  placeName: string;
  /** abre o visualizador nessa foto */
  onOpen: (photoId: string) => void;
}

const MAX_THUMBS = 4;

/**
 * Fotos tiradas numa parada do Roteiro (docs/ajustes-75-fotos-por-atracao.md, 3):
 * até 4 miniaturas quadradas de 56px; com mais, a 4ª mostra "+N" por cima.
 * Sem fotos, não aparece nada.
 */
export function StopPhotos({ photos, placeName, onOpen }: StopPhotosProps) {
  if (photos.length === 0) return null;
  const shown = photos.slice(0, MAX_THUMBS);
  const extra = photos.length - MAX_THUMBS;

  return (
    <ul className="m-0 flex list-none flex-wrap gap-1 p-0" aria-label={`Fotos de ${placeName}`}>
      {shown.map((p, i) => {
        const isMore = i === MAX_THUMBS - 1 && extra > 0;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              aria-label={
                isMore
                  ? `Ver as ${photos.length} fotos de ${placeName}`
                  : (p.label ?? `${p.caption || `Foto ${i + 1} de ${photos.length}`} — ${placeName}`)
              }
              className="relative block size-14 cursor-pointer overflow-hidden rounded-md border-0 bg-(--placeholder) p-0"
            >
              <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
              {p.badge && !isMore && <span className="absolute bottom-1 left-1 flex">{p.badge}</span>}
              {isMore && (
                // escuro a 60% (o spec dizia 50%): sobre uma foto branca, 50% deixaria o "+N" branco
                // em 3.95:1; 60% garante 5.74:1 mesmo no pior caso
                <span
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-(length:--text-base) font-semibold text-white"
                  aria-hidden="true"
                >
                  +{extra + 1}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
