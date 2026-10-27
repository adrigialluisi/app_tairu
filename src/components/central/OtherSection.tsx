import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTrip, type OtherItem, type TripDestination } from '../../context/TripContext';
import { EmptyTripState } from '../shell/EmptyTripState';
import { ConflictDialog } from '../shell/ConflictDialog';
import { activityConflict } from '../../utils/activityConflicts';
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
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  // passeio/ingresso num horário em que o grupo está viajando (ajustes-94): confirma antes de salvar
  const [pending, setPending] = useState<{ item: OtherItem; message: string } | null>(null);

  function save(item: OtherItem) {
    trip.saveOtherItem(item);
    setEditingId(null);
  }

  function handleSave(item: OtherItem) {
    const conflict =
      item.type === 'seguro'
        ? null
        : activityConflict(trip, {
            cityId: trip.destinations.find((d) => d.id === item.destinationId)?.cityId ?? null,
            dateISO: item.startDate,
            time: item.time.trim(),
          });
    if (conflict) setPending({ item, message: conflict.message });
    else save(item);
  }

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
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
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
          onSave={handleSave}
          onCancel={() => setEditingId(null)}
        />
      )}

      {editingId === null && items.length === 0 && <p className={styles.empty}>Nenhum registro ainda</p>}

      {editingId === null && (
        <Button variant="secondary" onClick={() => setEditingId('new')}>
          <Icon icon={Plus} /> Adicionar registro
        </Button>
      )}

      <ConflictDialog
        message={pending?.message ?? null}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) save(pending.item);
          setPending(null);
        }}
      />
    </div>
  );
}
