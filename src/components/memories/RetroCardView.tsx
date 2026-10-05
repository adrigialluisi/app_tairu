import { ArrowDown, ArrowUp, CalendarDays, Camera, Images, Map as MapIcon, MapPin, Ticket, Wallet } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../shell/Button';
import { TextField } from '../inputs/TextField';
import type { RetroCard, TripDestination, TripPhoto } from '../../context/TripContext';
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { formatMoney } from '../../utils/money';
import type { retroStats } from '../../utils/retrospective';
import { Icon } from '../shell/Icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import styles from './RetroCardView.module.css';

interface RetroCardViewProps {
  card: RetroCard;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  photos: TripPhoto[];
  destinations: TripDestination[];
  stats: ReturnType<typeof retroStats>;
  showCosts: boolean;
  onChange: (card: RetroCard) => void;
  onMove: (direction: -1 | 1) => void;
}

const MAX_HIGHLIGHTS = 6;

/** Um card da Retrospectiva (estilo stories). No modo Editar ganha campos e barra de ações. */
export function RetroCardView({
  card,
  editing,
  isFirst,
  isLast,
  photos,
  destinations,
  stats,
  showCosts,
  onChange,
  onMove,
}: RetroCardViewProps) {
  const baseId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Foto do card: a escolhida (photoId); se não houver (ou foi removida em Fotos), a foto real da cidade,
  // mesma busca do hero da Início — nunca uma imagem inventada.
  const chosen = card.photoId ? photos.find((p) => p.id === card.photoId) : undefined;
  const cityForPhoto =
    card.kind === 'capa'
      ? (destinations.find((d) => d.dateStart)?.city ?? '')
      : card.kind === 'cidade'
        ? (destinations.find((d) => d.id === card.destinationId)?.city ?? '')
        : '';
  const cityThumb = usePlaceThumbnail(chosen ? '' : cityForPhoto);
  const photoUrl = chosen?.url ?? cityThumb;
  const canHavePhoto = card.kind === 'capa' || card.kind === 'cidade';

  const update = (changes: Partial<RetroCard>) => onChange({ ...card, ...changes });

  const tiles = [
    { key: 'dias', value: stats.days, icon: CalendarDays, label: stats.days === 1 ? 'dia' : 'dias' },
    { key: 'cidades', value: stats.cities.length, icon: MapPin, label: stats.cities.length === 1 ? 'cidade' : 'cidades' },
    {
      key: 'lugares',
      value: stats.visitedPlaces,
      icon: MapIcon,
      label: stats.visitedPlaces === 1 ? 'lugar visitado' : 'lugares visitados',
    },
    { key: 'eventos', value: stats.events, icon: Ticket, label: stats.events === 1 ? 'evento' : 'eventos' },
    { key: 'fotos', value: stats.photos, icon: Images, label: stats.photos === 1 ? 'foto' : 'fotos' },
    {
      key: 'lugares-foto',
      value: stats.placesWithPhotos,
      icon: Camera,
      label: stats.placesWithPhotos === 1 ? 'lugar com foto' : 'lugares com foto',
    },
  ].filter((t) => t.value > 0);

  const highlights = photos.filter((p) => p.favorite).slice(0, MAX_HIGHLIGHTS);

  const titleText = (
    <>
      {editing ? (
        <div className={styles.editFields}>
          <TextField
            id={`${baseId}-title`}
            label="Título"
            value={card.title}
            onChange={(v) => update({ title: v })}
            autoComplete="off"
          />
          <TextField
            id={`${baseId}-text`}
            label={card.kind === 'numeros' ? 'Observação (opcional)' : 'Texto (opcional)'}
            value={card.text}
            onChange={(v) => update({ text: v })}
            autoComplete="off"
          />
        </div>
      ) : (
        <>
          <h3 className={styles.title}>{card.title}</h3>
          {card.text && <p className={styles.text}>{card.text}</p>}
        </>
      )}
    </>
  );

  return (
    <Card asChild className="gap-0 py-0">
    <article className={`${styles.card} ${card.hidden ? styles.cardHidden : ''}`}>
      {editing && card.hidden && (
        <Badge variant="neutral" className={styles.hiddenBadge}>
          Oculto
        </Badge>
      )}

      {card.kind === 'capa' && (
        <div className={`${styles.cover} ${photoUrl ? '' : styles.coverNoPhoto}`}>
          {photoUrl && <img src={photoUrl} alt="" className={styles.coverImg} />}
          {!editing && (
            <div className={styles.coverOverlay}>
              <h3 className={styles.coverTitle}>{card.title}</h3>
              {card.text && <p className={styles.coverText}>{card.text}</p>}
            </div>
          )}
        </div>
      )}

      {card.kind === 'cidade' && photoUrl && <img src={photoUrl} alt="" className={styles.cityImg} />}

      <div className={`${styles.body} ${card.kind === 'fecho' ? styles.bodyCentered : ''}`}>
        {(card.kind !== 'capa' || editing) && titleText}

        {card.kind === 'numeros' && (
          <ul className={styles.tiles}>
            {tiles.map((t) => (
              <li key={t.key} className={styles.tile}>
                <span className={styles.tileValue}>{t.value}</span>
                <span className={styles.tileLabel}>
                  <Icon icon={t.icon} /> {t.label}
                </span>
              </li>
            ))}
            {showCosts && stats.totalBRL !== null && (
              <li className={styles.tile}>
                <span className={`${styles.tileValue} ${styles.tileValueMoney}`}>
                  {formatMoney(stats.totalBRL, 'BRL')}
                </span>
                <span className={styles.tileLabel}>
                  <Icon icon={Wallet} /> gastos
                  {stats.topCategory && (
                    <>
                      , mais com <Icon icon={stats.topCategory.icon} /> {stats.topCategory.label}
                    </>
                  )}
                </span>
              </li>
            )}
          </ul>
        )}

        {card.kind === 'destaques' && highlights.length > 0 && (
          <ul className={styles.highlights}>
            {highlights.map((p) => (
              <li key={p.id}>
                <img src={p.url} alt={p.caption || ''} className={styles.highlightImg} />
              </li>
            ))}
          </ul>
        )}

        {card.kind === 'fecho' && (
          <img src={`${import.meta.env.BASE_URL}logo/LogoTairu.svg`} alt="Tairu" className={styles.logo} />
        )}

        {editing && (
          <div className={styles.actions}>
            <div className={styles.moveButtons}>
              <Button
                variant="secondary"
                iconOnly
                className={styles.round}
                aria-label="Subir card"
                disabled={isFirst}
                onClick={() => onMove(-1)}
              >
                <Icon icon={ArrowUp} />
              </Button>
              <Button
                variant="secondary"
                iconOnly
                className={styles.round}
                aria-label="Descer card"
                disabled={isLast}
                onClick={() => onMove(1)}
              >
                <Icon icon={ArrowDown} />
              </Button>
            </div>
            {canHavePhoto && (
              <button
                type="button"
                className={styles.textButton}
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((v) => !v)}
              >
                Trocar foto
              </button>
            )}
            <button type="button" className={styles.textButton} onClick={() => update({ hidden: !card.hidden })}>
              {card.hidden ? 'Mostrar' : 'Ocultar'}
            </button>
          </div>
        )}

        {editing && pickerOpen && canHavePhoto && (
          <div className={styles.picker}>
            {photos.length === 0 ? (
              <p className={styles.pickerEmpty}>Nenhuma foto na viagem ainda. Adicione na aba Fotos.</p>
            ) : (
              <ul className={styles.pickerGrid}>
                {photos.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`${styles.pickerThumb} ${card.photoId === p.id ? styles.pickerThumbSelected : ''}`}
                      aria-pressed={card.photoId === p.id}
                      aria-label={p.caption || `Foto ${i + 1}`}
                      onClick={() => {
                        update({ photoId: p.id });
                        setPickerOpen(false);
                      }}
                    >
                      <img src={p.url} alt="" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.pickerEmpty}>Sem foto escolhida, o card usa a foto da cidade.</p>
            <button
              type="button"
              className={styles.textButton}
              aria-pressed={card.photoId === null}
              onClick={() => {
                update({ photoId: null });
                setPickerOpen(false);
              }}
            >
              Sem foto
            </button>
          </div>
        )}
      </div>
    </article>
    </Card>
  );
}
