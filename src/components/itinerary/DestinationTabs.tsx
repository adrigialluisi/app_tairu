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
  /** primeira aba com todas as cidades (valor 'all'), ex.: "Todas" no Roteiro (ajustes-95) */
  allLabel?: string;
}

/** acima disso o nome não cabe bem numa aba de 360px com as outras cidades (ajustes-95b) */
const MAX_TAB_LABEL = 14;

/**
 * Rótulo curto da aba: "San Pedro de Atacama" → "San Pedro" (corta antes do primeiro "de/del/do/da";
 * sem isso, as duas primeiras palavras). O nome completo fica no aria-label e nos cabeçalhos dos dias.
 */
export function shortCityLabel(city: string): string {
  if (city.length <= MAX_TAB_LABEL) return city;
  const beforeLink = city.split(/\s+(?:de|del|do|da|dos|das|di)\s+/i)[0];
  if (beforeLink && beforeLink !== city) return beforeLink;
  return city.split(/\s+/).slice(0, 2).join(' ');
}

/**
 * Abas de destino do Roteiro (Sugestões, Mapa, Dicas locais). Com um destino só,
 * uma aba única em bordô parecia botão de ação (ver docs/ajustes-70-...md, 2.2):
 * nesse caso vira o subtítulo "📍 Cidade", com o mesmo id que a aba teria, pra o
 * aria-labelledby do painel continuar apontando pra algo que diz a cidade.
 * Desde o ajustes-95b a faixa rola na horizontal (no celular as 3 cidades + "Todas" não cabiam) e
 * a aba ativa rola sozinha pra ficar visível.
 */
export function DestinationTabs({ name, label, destinations, value, onChange, allLabel }: DestinationTabsProps) {
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
      items={[
        ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
        ...destinations.map((d) => {
          const short = shortCityLabel(d.city);
          return { value: d.id, label: short, ...(short !== d.city ? { ariaLabel: d.city } : {}) };
        }),
      ]}
      scrollable
      value={value}
      onChange={onChange}
    />
  );
}
