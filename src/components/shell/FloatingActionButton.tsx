import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Icon } from './Icon';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** toast aberto: sobe pra não ficar por cima da mensagem */
  raised?: boolean;
}

/**
 * Botão flutuante ("Adicionar lugares" no Roteiro, ajustes-97): bordô, 48px, ícone + texto, no
 * canto inferior direito da folha da tela. Fica SEMPRE visível (ajustes-99: no 97 ele sumia ao
 * rolar pra baixo e a pessoa não o achava). Mora dentro da folha do ScreenShell, que termina em cima
 * do menu fixo — e o menu já guarda a área segura do iPhone, então o botão nunca fica atrás da barra
 * de gestos. A tela deixa um espaço no fim pra ele não tapar o último item. É o Button primary
 * (branco no bordô, 6.08:1), só com o formato de pílula e a sombra média de quem flutua.
 */
export function FloatingActionButton({ icon, label, onClick, raised = false }: FloatingActionButtonProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-4 bottom-4 z-30 transition-[translate] duration-200 motion-reduce:transition-none',
        raised && '-translate-y-14',
      )}
    >
      <Button className="pointer-events-auto h-12 rounded-full px-5 shadow-md" onClick={onClick}>
        <Icon icon={icon} /> {label}
      </Button>
    </div>
  );
}
