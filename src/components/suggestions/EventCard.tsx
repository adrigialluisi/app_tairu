import { Check, Clock, MapPin, Ticket, TriangleAlert } from 'lucide-react';
import { Button } from '../shell/Button';
import { EVENT_KIND_ICONS } from '../../utils/categoryVisuals';
import { formatISOToDayPill, formatISOToDisplay, formatISOToShortDay, formatISOToWeekdayAbbrev } from '../../utils/dateMask';
import type { EventEntry } from '../../data';
import { Icon } from '../shell/Icon';
import { Card } from '@/components/ui/card';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: EventEntry;
  selected: boolean;
  onToggle: () => void;
  /** "Depois do seu voo" (ajustes-94): o evento cai num horário em que o grupo está viajando */
  conflictBadge?: string;
}

/** Card de evento local (data fixa) — visual próprio, com bloco de data, pra seção de eventos se destacar. */
export function EventCard({ event, selected, onToggle, conflictBadge }: EventCardProps) {
  const { monthAbbrev, day } = formatISOToDayPill(event.date);
  const shortDate = formatISOToDisplay(event.date).slice(0, 5);

  return (
    <Card asChild className="px-4">
    <article className={`${styles.card} ${selected ? styles.cardSelected : ''}`}>
      <div className={styles.top}>
        <div className={styles.dateBlock} aria-label={formatISOToDisplay(event.date)}>
          <span className={styles.dateWeekday} aria-hidden="true">
            {formatISOToWeekdayAbbrev(event.date)}
          </span>
          <span className={styles.dateDay} aria-hidden="true">
            {day}
          </span>
          <span className={styles.dateMonth} aria-hidden="true">
            {monthAbbrev}
          </span>
        </div>
        <div className={styles.info}>
          {/* o dia também por escrito, não só no bloco de data (ajustes-80): --accent-dark no branco, 9.67:1 */}
          <p className="m-0 text-(length:--text-sm) font-medium text-(--accent-dark)">
            {formatISOToShortDay(event.date)} · {event.time}
          </p>
          <h4 className={styles.name}>
            <span aria-hidden="true"><Icon icon={EVENT_KIND_ICONS[event.kind]} /> </span>
            {event.name}
          </h4>
          {event.recurring && <span className={styles.recurring}>{event.recurring}</span>}
          {conflictBadge && (
            // --warning no branco: 5.89:1, sempre com o ícone
            <span className="inline-flex items-center gap-1 self-start rounded-full border border-solid border-warning px-2 py-0.5 text-(length:--text-sm) font-medium text-warning">
              <Icon icon={TriangleAlert} /> {conflictBadge}
            </span>
          )}
          <p className={styles.meta}>
            <Icon icon={Clock} /> {event.time}
          </p>
          <p className={styles.meta}>
            <Icon icon={MapPin} /> {event.venue}
          </p>
          <p className={styles.meta}>
            <Icon icon={Ticket} /> {event.price}
          </p>
        </div>
      </div>

      {/* evento simulado (ajustes-80) não tem fonte — e não ganha selo de "fictício" pro participante */}
      {event.sourceUrl && (
        <a className={styles.source} href={event.sourceUrl} target="_blank" rel="noreferrer">
          Fonte: {event.sourceLabel}
          <span className="visually-hidden"> (abre em nova aba)</span>
        </a>
      )}
      {event.note && <p className={styles.note}>{event.note}</p>}

      <Button
        variant={selected ? 'primary' : 'secondary'}
        fullWidth
        className={styles.action}
        aria-pressed={selected}
        onClick={onToggle}
      >
        {selected ? (
          <>
            <Icon icon={Check} /> No roteiro, {shortDate}
          </>
        ) : (
          'Adicionar ao roteiro'
        )}
      </Button>
    </article>
    </Card>
  );
}
