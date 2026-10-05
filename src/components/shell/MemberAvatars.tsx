import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Member } from '../../utils/costs';

interface MemberAvatarsProps {
  members: Member[];
  /** 24px (padrão, sobrepostos) ou 32px (linha de Convidados) */
  size?: 'sm' | 'md';
}

/**
 * Círculos com iniciais, sobrepostos. "Você" = "EU". O aria-label lista os nomes (nunca só a sigla).
 * Miolo: Avatar do shadcn (ver docs/ajustes-70-...md). O grupo é um <span> com as mesmas classes do
 * AvatarGroup (que é <div>) porque o componente aparece dentro de <p>.
 * --text sobre --bg-low (stone-200): 13.93:1; borda branca de 2px separa um círculo do outro.
 */
export function MemberAvatars({ members, size = 'sm' }: MemberAvatarsProps) {
  if (members.length === 0) return null;
  return (
    <span
      className="inline-flex flex-none items-center -space-x-2"
      role="img"
      aria-label={members.map((m) => m.label).join(', ')}
    >
      {members.map((m) => (
        <Avatar
          key={m.id}
          size={size === 'md' ? 'default' : 'sm'}
          className="border-2 border-card after:hidden"
          aria-hidden="true"
        >
          <AvatarFallback
            className={`bg-(--bg-low) font-semibold tracking-[0.02em] text-foreground ${size === 'md' ? 'text-xs' : 'text-[10px]'} group-data-[size=sm]/avatar:text-[10px]`}
          >
            {m.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </span>
  );
}
