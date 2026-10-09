import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { travelerById } from '../../data/examplePastTrips';

interface TravelerAvatarProps {
  /** ExampleTraveler.id */
  travelerId: string;
  className?: string;
}

/**
 * Quem adicionou a foto (docs/ajustes-79-fotos-do-grupo-na-recordacao.md):
 * Avatar do shadcn de 20px, iniciais brancas sobre bordô (6.08:1), contorno
 * branco de 2px pra se destacar sobre qualquer foto. Decorativo: o nome vai
 * no rótulo acessível de quem usa o avatar.
 */
export function TravelerAvatar({ travelerId, className }: TravelerAvatarProps) {
  const traveler = travelerById(travelerId);
  if (!traveler) return null;
  return (
    <Avatar aria-hidden="true" className={cn('size-5 ring-2 ring-white after:hidden', className)}>
      <AvatarFallback className="bg-primary text-[9px] leading-none font-semibold text-primary-foreground">
        {traveler.initials}
      </AvatarFallback>
    </Avatar>
  );
}
