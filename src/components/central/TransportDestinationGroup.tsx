import { useState } from 'react';
import { Button } from '../shell/Button';
import { useTrip, type TripDestination } from '../../context/TripContext';
import { formatISOToDisplay } from '../../utils/dateMask';
import { TransportItemCard } from './TransportItemCard';
import { TransportItemForm } from './TransportItemForm';
import styles from './TransportDestinationGroup.module.css';

interface TransportDestinationGroupProps {
  destination: TripDestination;
}

function formatDestinationDates(destination: TripDestination): string | null {
  if (!destination.dateStart || !destination.dateEnd) return null;
  return `${formatISOToDisplay(destination.dateStart)} – ${formatISOToDisplay(destination.dateEnd)}`;
}

export function TransportDestinationGroup({ destination }: TransportDestinationGroupProps) {
  const trip = useTrip();
  const items = trip.transportItems.filter((t) => t.destinationId === destination.id);
  const [editingId, setEditingId] = useState<string | 'new' | null>(() => (items.length === 0 ? 'new' : null));
  const dates = formatDestinationDates(destination);

  return (
    <div className={styles.group}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {destination.city}, {destination.country}
        </h3>
        {dates && <span className={styles.dates}>{dates}</span>}
      </div>

      {items.map((item) =>
        editingId === item.id ? (
          <TransportItemForm
            key={item.id}
            destinationId={destination.id}
            initialItem={item}
            onSave={(updated) => {
              trip.saveTransportItem(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onRemove={() => {
              trip.removeTransportItem(item.id);
              setEditingId(null);
            }}
          />
        ) : (
          <TransportItemCard key={item.id} item={item} onEdit={() => setEditingId(item.id)} />
        ),
      )}

      {editingId === 'new' && (
        <TransportItemForm
          destinationId={destination.id}
          initialItem={null}
          onSave={(item) => {
            trip.saveTransportItem(item);
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {editingId === null && (
        <Button variant="secondary" onClick={() => setEditingId('new')}>
          + Adicionar transporte
        </Button>
      )}
    </div>
  );
}
