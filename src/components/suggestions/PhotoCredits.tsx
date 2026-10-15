import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icon } from '../shell/Icon';
import { placePhotoCredit, type PlaceEntry } from '../../data';

/**
 * Créditos das fotos de uma seção (ajustes-87): rodapé discreto e recolhido, "Créditos das fotos",
 * que abre a lista "Lugar — Foto: autor · licença · Wikimedia Commons" (ou "Foto ilustrativa"
 * quando não é do próprio lugar), cada uma com link pra página da foto no Commons.
 * --muted no stone-100 do miolo: 6.99:1.
 */
export function PhotoCredits({ places }: { places: PlaceEntry[] }) {
  const withPhoto = places.filter((p) => p.photo);
  if (withPhoto.length === 0) return null;
  return (
    <Collapsible className="-mt-2">
      <CollapsibleTrigger className="group inline-flex min-h-11 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-(length:--text-sm) text-muted-foreground">
        Créditos das fotos
        <Icon icon={ChevronDown} className="transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-(length:--text-sm) text-muted-foreground">
          {withPhoto.map((p) => (
            <li key={p.id}>
              {p.name} —{' '}
              <a href={p.photo!.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground underline">
                {placePhotoCredit(p.photo!)}
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
