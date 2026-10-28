import { CalendarPlus, Check, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';

/** item do menu com 44px de toque (mesma classe dos menus ⋯ do Roteiro e de Convidados) */
const MENU_ITEM = 'min-h-11 px-3 text-(length:--text-base)';

interface AgendaActionProps {
  /** nome do lugar/evento, pro leitor de tela */
  name: string;
  /** já está na sua agenda */
  inAgenda: boolean;
  onAdd: () => void;
  onView: () => void;
  onRemove: () => void;
}

/**
 * Rodapé dos cartões de Sugestões (ajustes-101), no lugar do "+" do canto: "Adicionar à agenda"
 * (secundário, largura do cartão, 44px), que adiciona na hora (ajustes-101b). Já na agenda, vira
 * "✓ Na agenda" (primário, branco no bordô 6.08:1), sem o dia desde o ajustes-101c, e o toque abre
 * um menu curto: "Ver na agenda" / "Tirar da agenda" — mudar de dia é na Agenda (lista ou mapa).
 */
export function AgendaAction({ name, inAgenda, onAdd, onView, onRemove }: AgendaActionProps) {
  if (!inAgenda) {
    return (
      <Button variant="secondary" fullWidth className="mt-auto h-11" onClick={onAdd} aria-label={`Adicionar ${name} à agenda`}>
        <Icon icon={CalendarPlus} /> Adicionar à agenda
      </Button>
    );
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button fullWidth className="mt-auto h-11" aria-label={`${name} está na agenda. Opções`}>
          <Icon icon={Check} /> Na agenda
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuItem className={MENU_ITEM} onSelect={onView}>
          <Icon icon={Eye} /> Ver na agenda
        </DropdownMenuItem>
        <DropdownMenuItem className={MENU_ITEM} onSelect={onRemove}>
          <Icon icon={Trash2} /> Tirar da agenda
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
