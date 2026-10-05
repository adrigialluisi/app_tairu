import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTrip, type OtherItem, type TripDestination } from '../../context/TripContext';
import { EmptyTripState } from '../shell/EmptyTripState';
import { Button } from '../shell/Button';
import { OtherItemCard } from './OtherItemCard';
import { OtherItemForm } from './OtherItemForm';
import { Icon } from '../shell/Icon';
import styles from './TransportDestinationGroup.module.css';
import sectionStyles from './OtherSection.module.css';

/** "Viagem toda" primeiro, depois por ordem dos destinos; dentro de cada grupo, ordem de criação (sort é estável). */
function sortOtherItems(items: OtherItem[], destinations: TripDestination[]): OtherItem[] {
  const order = (item: OtherItem) => {
    if (!item.destinationId) return -1;
    const idx = destinations.findIndex((d) => d.id === item.destinationId);
    return idx === -1 ? destinations.length : idx;
  };
  return [...items].sort((a, b) => order(a) - order(b));
}

export function OtherSection() {
  const trip = useTrip();
  const [editingId, setEditingId] = useState<string | 'new' | null>(() =>
    trip.otherItems.length === 0 ? 'new' : null,
  );

  if (trip.destinations.length === 0) {
    return <EmptyTripState message="Essa viagem ainda não tem destinos cadastrados. Volte e cadastre a viagem primeiro." />;
  }

  const items = sortOtherItems(trip.otherItems, trip.destinations);

  return (
    <div className={styles.group}>
      <p className={sectionStyles.intro}>
        Seguro viagem, passeios e ingressos da viagem.
      </p>

      {items.map((item) =>
        editingId === item.id ? (
          <OtherItemForm
            key={item.id}
            destinations={trip.destinations}
            initialItem={item}
            onSave={(updated) => {
              trip.saveOtherItem(updated);
              setEditingId(null);
            }}
            onRemove={() => {
              trip.removeOtherItem(item.id);
              setEditingId(null);
            }}
          />
        ) : (
          <OtherItemCard
            key={item.id}
            item={item}
            destinations={trip.destinations}
            onEdit={() => setEditingId(item.id)}
          />
        ),
      )}

      {editingId === 'new' && (
        <OtherItemForm
          destinations={trip.destinations}
          initialItem={null}
          onSave={(item) => {
            trip.saveOtherItem(item);
            setEditingId(null);
          }}
        />
      )}

      {editingId === null && (
        <Button variant="secondary" onClick={() => setEditingId('new')}>
          <Icon icon={Plus} /> Adicionar registro
        </Button>
      )}
    </div>
  );
}
