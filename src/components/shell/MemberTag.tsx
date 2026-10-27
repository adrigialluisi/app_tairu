import type { Member } from '../../utils/costs';
import { MemberAvatars } from './MemberAvatars';

/**
 * Tag de quem sugeriu (ajustes-94, item 3): avatar + primeiro nome, fundo na cor da pessoa e texto
 * branco (≥ 5.47:1, ver --member-* em tokens.css). Vai no canto superior direito da parada do
 * Roteiro e do cartão das Sugestões. O nome por escrito garante que a cor nunca fica sozinha.
 */
export function MemberTag({ member, className = '' }: { member: Member; className?: string }) {
  return (
    <span
      className={`inline-flex max-w-full flex-none items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-(length:--text-sm) leading-tight font-semibold text-white ${className}`}
      style={{ background: member.color ?? 'var(--muted)' }}
    >
      <span aria-hidden="true" className="inline-flex">
        <MemberAvatars members={[member]} />
      </span>
      <span className="truncate">
        <span className="visually-hidden">Sugerido por </span>
        {member.shortName}
      </span>
    </span>
  );
}
