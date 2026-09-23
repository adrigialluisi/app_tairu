import { useTrip } from '../../context/TripContext';
import { EmptyTripState } from '../shell/EmptyTripState';
import { TransportDestinationGroup } from './TransportDestinationGroup';
import styles from './TransportSection.module.css';

export function TransportSection() {
  const trip = useTrip();
  if (trip.destinations.length === 0) {
    return <EmptyTripState message="Essa viagem ainda não tem destinos cadastrados. Volte e cadastre a viagem primeiro." />;
  }
  return (
    <div className={styles.groups}>
      {trip.destinations.map((d) => (
        <TransportDestinationGroup key={d.id} destination={d} />
      ))}
    </div>
  );
}
