import { useState } from 'react';
import { Button } from '../shell/Button';
import { useTrip, type TripDestination } from '../../context/TripContext';
import { formatISOToDisplay } from '../../utils/dateMask';
import { StayItemCard } from './StayItemCard';
import { StayItemForm } from './StayItemForm';
import styles from './TransportDestinationGroup.module.css';

interface StayDestinationGroupProps {
  destination: TripDestination;
}

function formatDestinationDates(destination: TripDestination): string | null {
  if (!destination.dateStart || !destination.dateEnd) return null;
  return `${formatISOToDisplay(destination.dateStart)} – ${formatISOToDisplay(destination.dateEnd)}`;
}

export function StayDestinationGroup({ destination }: StayDestinationGroupProps) {
  const trip = useTrip();
  const items = trip.stayItems.filter((s) => s.destinationId === destination.id);
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
          <StayItemForm
            key={item.id}
            destination={destination}
            initialItem={item}
            onSave={(updated) => {
              trip.saveStayItem(updated);
              setEditingId(null);
            }}
            onRemove={() => {
              trip.removeStayItem(item.id);
              setEditingId(null);
            }}
          />
        ) : (
          <StayItemCard key={item.id} item={item} onEdit={() => setEditingId(item.id)} />
        ),
      )}

      {editingId === 'new' && (
        <StayItemForm
          destination={destination}
          initialItem={null}
          onSave={(item) => {
            trip.saveStayItem(item);
            setEditingId(null);
          }}
        />
      )}

      {editingId === null && (
        <Button variant="secondary" onClick={() => setEditingId('new')}>
          + Adicionar estadia
        </Button>
      )}
    </div>
  );
}
