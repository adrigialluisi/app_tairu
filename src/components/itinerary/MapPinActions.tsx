import { CalendarDays, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { OptionChipGroup } from '../quiz/OptionChipGroup';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';

interface MapPinActionsProps {
  /** nome do lugar/evento, pro leitor de tela */
  name: string;
  /** dias da cidade (índice local → "Seg 16/11"); vazio = sem "Mudar de dia" (evento, ou cidade de 1 dia) */
  days: { value: string; label: string }[];
  /** dia local atual, já marcado nas pílulas */
  currentDay: string | null;
  onMove: (localDay: number) => void;
  onRemove: () => void;
}

/**
 * Ações do pino na Agenda → Mapa (ajustes-101b): "Mudar de dia" abre ali mesmo as pílulas com os
 * dias da cidade (o atual marcado); tocar num dia move e fixa o lugar (o mesmo "Mudar de dia" da
 * lista). "Tirar da agenda" tira o lugar ou o evento. Botões de 44px, um embaixo do outro, pra
 * caberem no popup em 360px. Sem menu suspenso: o popup do Leaflet segura o mousedown/touchstart,
 * e os botões e as pílulas aqui só dependem do clique.
 */
export function MapPinActions({ name, days, currentDay, onMove, onRemove }: MapPinActionsProps) {
  const [choosing, setChoosing] = useState(false);

  if (choosing) {
    return (
      <OptionChipGroup
        legend="Mudar pra qual dia?"
        options={days}
        value={currentDay}
        onChange={(value) => {
          if (value !== currentDay) onMove(Number(value));
          else setChoosing(false);
        }}
      />
    );
  }

  return (
    <>
      {days.length > 1 && (
        <Button variant="secondary" fullWidth className="h-11" onClick={() => setChoosing(true)} aria-label={`Mudar ${name} de dia`}>
          <Icon icon={CalendarDays} /> Mudar de dia
        </Button>
      )}
      <Button variant="secondary" fullWidth className="h-11" onClick={onRemove} aria-label={`Tirar ${name} da agenda`}>
        <Icon icon={Trash2} /> Tirar da agenda
      </Button>
    </>
  );
}
