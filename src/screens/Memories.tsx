import { CalendarDays, Camera, MapPin, Star } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { EmptyState } from '../components/shell/EmptyState';
import { SaveToast } from '../components/shell/SaveToast';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Tabs } from '../components/shell/Tabs';
import { PhotoViewer } from '../components/memories/PhotoViewer';
import { RetrospectivePanel } from '../components/memories/RetrospectivePanel';
import { useTrip, type TripPhoto } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { formatISOToDayPill, formatISOToShortDay } from '../utils/dateMask';
import { getTripEndISO, getTripStartISO } from '../utils/itinerary';
import { autoDayForDate, cityForDay, fileDateToISO, groupDayPhotosByPlace, groupPhotosByDay, tripDays } from '../utils/photos';
import { Icon } from '../components/shell/Icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import styles from './Memories.module.css';

const MAIN_TABS = 'memories-main';
const DAY_TABS = 'memories-day';
const NO_DAY = 'sem-dia';

function photosLabel(n: number): string {
  return `${n} ${n === 1 ? 'foto' : 'fotos'}`;
}

/**
 * Memórias (rota /memorias, fora do menu fixo — acesso pela Início e por
 * "Fotos do dia" no Roteiro). Aba Fotos: galeria por dia com tag automática
 * pela data do arquivo; se a data não for da viagem, pergunta o dia em vez
 * de inventar. Aba Retrospectiva em
 * docs/ajustes-65-memorias-retrospectiva.md. Ver docs/ajustes-64-memorias-fotos.md.
 */
export function Memories() {
  const trip = useTrip();
  const navigate = useNavigate();
  const location = useLocation();
  const entryDayISO = (location.state as { dayISO?: string } | null)?.dayISO ?? null;
  const { message, visible, show } = useSaveToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'fotos' | 'retrospectiva'>('fotos');
  const [dayFilter, setDayFilter] = useState<string>(entryDayISO ?? 'all');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);

  const tripStartISO = getTripStartISO(trip.destinations);
  const tripEndISO = getTripEndISO(trip.destinations);
  const days = tripDays(trip.destinations);
  const hasUndated = trip.photos.some((p) => p.dayISO === null);

  const visiblePhotos = trip.photos.filter((p) =>
    dayFilter === 'all' ? true : dayFilter === NO_DAY ? p.dayISO === null : p.dayISO === dayFilter,
  );
  // dentro de cada dia, subgrupos por lugar (ajustes-75); "Sem dia" fica sem subgrupo
  const groups = groupPhotosByDay(visiblePhotos).map((g) => ({
    ...g,
    places: g.dayISO ? groupDayPhotosByPlace(g.dayISO, g.photos, trip) : null,
  }));
  // ordem da galeria (dia → lugar → "Outras do dia") — é a mesma que as setas ‹ › do visualizador seguem
  const sequence = groups.flatMap((g) =>
    g.places ? [...g.places.linked.flatMap((l) => l.photos), ...g.places.others.flatMap((o) => o.photos)] : g.photos,
  );
  const openPhoto = trip.photos.find((p) => p.id === openPhotoId) ?? null;

  function dayLabel(dayISO: string): string {
    const city = cityForDay(dayISO, trip.destinations);
    return `${formatISOToShortDay(dayISO)}${city ? ` · ${city}` : ''}`;
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    // Entrou por "Fotos do dia" (ou está olhando um dia específico): o que não tiver dia automático vai pra ele.
    const targetDay = dayFilter !== 'all' && dayFilter !== NO_DAY ? dayFilter : null;

    const added: TripPhoto[] = files.map((file) => {
      const fileDateISO = fileDateToISO(file.lastModified);
      const autoDay = autoDayForDate(fileDateISO, tripStartISO, tripEndISO);
      return {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(file),
        fileName: file.name,
        fileDateISO,
        dayISO: autoDay ?? targetDay,
        dayManual: !autoDay && targetDay !== null,
        placeLabel: null,
        placeSelectionId: null,
        eventId: null,
        caption: '',
        favorite: false,
      };
    });
    trip.addPhotos(added);

    const withDay = added.filter((p) => p.dayISO !== null);
    const withoutDay = added.filter((p) => p.dayISO === null);
    if (withDay.length > 0) {
      const distinctDays = [...new Set(withDay.map((p) => p.dayISO as string))];
      const verb = withDay.length === 1 ? 'adicionada' : 'adicionadas';
      show(
        distinctDays.length === 1
          ? `${photosLabel(withDay.length)} ${verb} em ${formatISOToShortDay(distinctDays[0])}`
          : `${photosLabel(withDay.length)} ${verb}`,
      );
    }
    // só pergunta se houver dia da viagem pra escolher; sem datas, ficam em "Sem dia"
    if (withoutDay.length > 0 && days.length > 0) {
      setPendingIds((prev) => [...prev, ...withoutDay.map((p) => p.id)]);
    }
  }

  function assignPendingTo(dayISO: string) {
    const pending = trip.photos.filter((p) => pendingIds.includes(p.id));
    pending.forEach((p) => trip.updatePhoto({ ...p, dayISO, dayManual: true }));
    setPendingIds([]);
    if (pending.length > 0) {
      show(
        `${photosLabel(pending.length)} ${pending.length === 1 ? 'adicionada' : 'adicionadas'} em ${formatISOToShortDay(dayISO)}`,
      );
    }
  }

  function handleRemove(photo: TripPhoto) {
    const index = sequence.findIndex((p) => p.id === photo.id);
    const nextOpen = sequence[index + 1] ?? sequence[index - 1] ?? null;
    trip.removePhoto(photo.id);
    setPendingIds((prev) => prev.filter((id) => id !== photo.id));
    setOpenPhotoId(nextOpen ? nextOpen.id : null);
    show('Foto removida');
  }

  /** grade de 3 colunas de miniaturas (cada uma abre o visualizador) */
  function renderGrid(list: TripPhoto[]) {
    return (
      <ul className={styles.grid}>
        {list.map((p) => {
          const city = p.dayISO ? cityForDay(p.dayISO, trip.destinations) : null;
          const fallback = p.dayISO
            ? `Foto de ${city ?? 'viagem'}, ${formatISOToShortDay(p.dayISO)}`
            : `Foto sem dia, ${p.fileName}`;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => setOpenPhotoId(p.id)}
                aria-label={`${p.caption || fallback}${p.favorite ? ' (destaque)' : ''}`}
              >
                <img src={p.url} alt="" className={styles.thumbImg} />
                {p.favorite && (
                  <Badge variant="accent" className={styles.star} aria-hidden="true">
                    <Icon icon={Star} />
                  </Badge>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const pendingCount = trip.photos.filter((p) => pendingIds.includes(p.id) && p.dayISO === null).length;

  const addButton = (
    <Button variant="primary" fullWidth onClick={() => inputRef.current?.click()}>
      <Icon icon={Camera} /> Adicionar fotos
    </Button>
  );

  return (
    <ScreenShell
      appBar={
        <AppBar
          title="Memórias"
          subtitle={trip.name || undefined}
          onBack={() => navigate(-1)}
          onHome={() => navigate('/inicio')}
        />
      }
      toast={<SaveToast visible={visible} message={message} />}
    >
      <Tabs
        name={MAIN_TABS}
        label="Seções de memórias"
        items={[
          { value: 'fotos', label: 'Fotos' },
          { value: 'retrospectiva', label: 'Retrospectiva' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
        aria-hidden="true"
        tabIndex={-1}
      />

      {tab === 'fotos' && (
        <div role="tabpanel" id={`${MAIN_TABS}-panel-fotos`} aria-labelledby={`${MAIN_TABS}-tab-fotos`} className={styles.panel}>
          {trip.photos.length === 0 ? (
            <EmptyState icon={<Camera />} action={addButton}>
              Suas fotos da viagem ficam aqui, organizadas por dia sozinhas.
            </EmptyState>
          ) : (
            <>
              <div className={styles.top}>
                {addButton}

                {pendingCount > 0 && (
                  <Card className={`px-4 ${styles.askCard}`} role="region" aria-labelledby="memories-ask-title">
                    <p id="memories-ask-title" className={styles.askTitle}>
                      {pendingCount === 1
                        ? '1 foto não é das datas da viagem. De qual dia ela é?'
                        : `${pendingCount} fotos não são das datas da viagem. De qual dia elas são?`}
                    </p>
                    <ul className={styles.dayChoices}>
                      {days.map((d) => (
                        <li key={d}>
                          <button type="button" className={styles.dayChoice} onClick={() => assignPendingTo(d)}>
                            <span className={styles.dayChoiceDate}>{formatISOToShortDay(d)}</span>
                            <span className={styles.dayChoiceCity}>{cityForDay(d, trip.destinations) ?? '—'}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button type="button" className={styles.linkButton} onClick={() => setPendingIds([])}>
                      Deixar sem dia
                    </button>
                  </Card>
                )}

                {(days.length > 0 || hasUndated) && (
                  <Tabs
                    name={DAY_TABS}
                    label="Filtrar por dia"
                    variant="pill-date"
                    items={[
                      { value: 'all', label: 'Todos os dias' },
                      ...days.map((d) => {
                        const { monthAbbrev, day } = formatISOToDayPill(d);
                        return { value: d, label: dayLabel(d), pillTop: monthAbbrev, pillBottom: day };
                      }),
                      ...(hasUndated ? [{ value: NO_DAY, label: 'Sem dia' }] : []),
                    ]}
                    value={dayFilter === NO_DAY && !hasUndated ? 'all' : dayFilter}
                    onChange={setDayFilter}
                  />
                )}
              </div>

              <div className={styles.groups}>
                {groups.length === 0 && <p className={styles.emptyDay}>Nenhuma foto nesse dia ainda.</p>}
                {groups.map((g) => (
                  <section
                    key={g.dayISO ?? NO_DAY}
                    className={styles.group}
                    aria-labelledby={`memories-group-${g.dayISO ?? NO_DAY}`}
                  >
                    <div className={styles.groupHeader}>
                      <h3 id={`memories-group-${g.dayISO ?? NO_DAY}`} className={styles.groupTitle}>
                        {g.dayISO ? (
                          <>
                            <Icon icon={CalendarDays} />{' '}
                            {formatISOToShortDay(g.dayISO)}
                            {cityForDay(g.dayISO, trip.destinations) && (
                              <>
                                {' · '}
                                <Icon icon={MapPin} />{' '}
                                {cityForDay(g.dayISO, trip.destinations)}
                              </>
                            )}
                          </>
                        ) : (
                          'Sem dia da viagem'
                        )}
                      </h3>
                      <span className={styles.groupCount}>{photosLabel(g.photos.length)}</span>
                      {!g.dayISO && <p className={styles.groupHint}>Toque numa foto pra escolher o dia.</p>}
                    </div>
                    {g.places ? (
                      <div className={styles.placeGroups}>
                        {g.places.linked.map((l) => (
                          <div key={l.key} className={styles.placeGroup}>
                            <p className={styles.placeTitle}>
                              <Icon icon={MapPin} /> {l.label}
                              <span className={styles.placeCount}> · {photosLabel(l.photos.length)}</span>
                            </p>
                            {renderGrid(l.photos)}
                          </div>
                        ))}
                        {g.places.others.length > 0 && (
                          <div className={styles.placeGroup}>
                            {g.places.linked.length > 0 && (
                              <p className={styles.placeTitle}>
                                Outras do dia
                                <span className={styles.placeCount}>
                                  {' '}
                                  · {photosLabel(g.places.others.reduce((n, o) => n + o.photos.length, 0))}
                                </span>
                              </p>
                            )}
                            {g.places.others.map((o) => (
                              <div key={o.label ?? NO_DAY} className={styles.placeGroup}>
                                {o.label && <p className={styles.placeOther}>{o.label}</p>}
                                {renderGrid(o.photos)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      renderGrid(g.photos)
                    )}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'retrospectiva' && (
        <div
          role="tabpanel"
          id={`${MAIN_TABS}-panel-retrospectiva`}
          aria-labelledby={`${MAIN_TABS}-tab-retrospectiva`}
          className={styles.panel}
        >
          <RetrospectivePanel onToast={show} />
        </div>
      )}

      {openPhoto && (
        <PhotoViewer
          photo={openPhoto}
          sequence={sequence.some((p) => p.id === openPhoto.id) ? sequence : [openPhoto]}
          days={days}
          onNavigate={setOpenPhotoId}
          onRemove={handleRemove}
          onClose={() => setOpenPhotoId(null)}
        />
      )}
    </ScreenShell>
  );
}
