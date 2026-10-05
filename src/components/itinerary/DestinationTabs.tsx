import { MapPin } from 'lucide-react';
import { Tabs } from '../shell/Tabs';
import { Icon } from '../shell/Icon';
import type { TripDestination } from '../../context/TripContext';

interface DestinationTabsProps {
  /** mesmo `name` do Tabs — os painéis das telas apontam pra `${name}-tab-${id}` */
  name: string;
  label: string;
  destinations: TripDestination[];
  value: string;
  onChange: (destinationId: string) => void;
}

/**
 * Abas de destino do Roteiro (Sugestões, Mapa, Dicas locais). Com um destino só,
 * uma aba única em bordô parecia botão de ação (ver docs/ajustes-70-...md, 2.2):
 * nesse caso vira o subtítulo "📍 Cidade", com o mesmo id que a aba teria, pra o
 * aria-labelledby do painel continuar apontando pra algo que diz a cidade.
 */
export function DestinationTabs({ name, label, destinations, value, onChange }: DestinationTabsProps) {
  if (destinations.length === 1) {
    const only = destinations[0];
    return (
      <h3 id={`${name}-tab-${only.id}`} className="m-0 text-(length:--text-lg) font-semibold text-foreground">
        <Icon icon={MapPin} /> {only.city}
      </h3>
    );
  }
  return (
    <Tabs
      name={name}
      label={label}
      items={destinations.map((d) => ({ value: d.id, label: d.city }))}
      value={value}
      onChange={onChange}
    />
  );
}
