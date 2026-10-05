import { ArrowLeftRight, Banknote, CalendarDays, CalendarX, Camera, Clock, Lightbulb, List, Map as MapIcon, MapPin, Pencil, RotateCcw, SkipForward, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { SaveToast } from '../components/shell/SaveToast';
import { DestinationTabs } from '../components/itinerary/DestinationTabs';
import { SuggestionCard } from '../components/shell/SuggestionCard';
import { Tabs } from '../components/shell/Tabs';
import { EmptyTripState } from '../components/shell/EmptyTripState';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { TimelineStop } from '../components/itinerary/TimelineStop';
import { AgendaRow } from '../components/itinerary/AgendaRow';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { YOU, getMembers, memberLabel } from '../utils/costs';
import { joinPt } from '../utils/retrospective';
import { CategoryTags } from '../components/suggestions/CategoryTags';
import { SuggestionsPanel } from '../components/suggestions/SuggestionsPanel';
import {
  INTEREST_LABELS,
  formatCategories,
  getAlsoWorthVisiting,
  getEventById,
  getLocalTipsForCity,
  getPlaceById,
  type EventEntry,
} from '../data';
import { useTrip, type QuizInterest, type TripDestination, type TripPhoto, type TripPlaceSelection } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { isRoteiroComplete } from '../utils/tripProgress';
import {
  computeDestinationAssignments,
  daysBetween,
  getTripEndISO,
  getTripStartISO,
  globalDayToISO,
  splitDaysByDestination,
  type DestinationDayRange,
  type ItineraryItemAssignment,
} from '../utils/itinerary';
import { categoryIcon, placeIllustrationIcon } from '../utils/categoryVisuals';
import { buildAgenda, type AgendaItem } from '../utils/agenda';
import {
  formatISOToDayPill,
  formatISOToDisplay,
  formatISOToLongWeekday,
  formatISOToWeekdayDisplay,
} from '../utils/dateMask';
import { Icon } from '../components/shell/Icon';
import { Button } from '../components/shell/Button';
import { StopPhotos } from '../components/itinerary/StopPhotos';
import { PhotoViewer } from '../components/memories/PhotoViewer';
import { fileDateToISO, photosOfTarget, tripDays } from '../utils/photos';
import { Card } from '@/components/ui/card';
import styles from './Itinerary.module.css';

/** parada do roteiro ou evento a que as fotos vão se ligar (ajustes-75) */
interface StopPhotoTarget {
  /** "place:<id>" ou "event:<id>" */
  key: string;
  label: string;
  /** dia da parada no roteiro (ou a data do evento) — é o dia que a foto ganha */
  dayISO: string;
  placeSelectionId: string | null;
  eventId: string | null;
}

const MAIN_TABS_NAME = 'itinerary-main';
const DESTINATION_TABS_NAME = 'itinerary-destination';
const TIPS_TABS_NAME = 'itinerary-tips-destination';
const ROTEIRO_VIEW_TABS_NAME = 'itinerary-roteiro-view';
const MAP_DAY_TABS_NAME = 'itinerary-map-day';

function placeLabel(selection: TripPlaceSelection): string {
  if (selection.customLabel) return selection.customLabel;
  return getPlaceById(selection.placeId ?? '')?.name ?? 'Lugar removido';
}

function findRangeForGlobalDay(ranges: DestinationDayRange[], globalDay: number): DestinationDayRange | undefined {
  return ranges.find((r) => r.globalDayIndexes.includes(globalDay));
}

/** Data ISO dentro das datas de algum destino da viagem com essa cidade (dia de fronteira conta pros dois). */
function cityIsInTripOn(destinations: TripDestination[], cityId: string, dateISO: string): boolean {
  return destinations.some(
    (d) => d.cityId === cityId && d.dateStart && d.dateEnd && d.dateStart <= dateISO && dateISO <= d.dateEnd,
  );
}

/** Eventos escolhidos (data fixa) — nunca entram na distribuição automática de dias. */
function selectedEvents(selectedEventIds: string[]): EventEntry[] {
  return selectedEventIds.map((id) => getEventById(id)).filter((e): e is EventEntry => Boolean(e));
}

/**
 * Lugares customizados (sem placeId) não têm coordenada — ficam de fora do
 * mapa, só na lista. Eventos escolhidos com lat/lng entram como pin no dia
 * deles; evento sem coordenada (ex.: Lua cheia) fica de fora.
 */
function buildMapPins(
  range: DestinationDayRange | undefined,
  assignments: ItineraryItemAssignment[],
  events: EventEntry[],
  tripStartISO: string | null,
): { pins: RouteMapPin[]; missingCount: number } {
  if (!range) return { pins: [], missingCount: 0 };
  const pins: RouteMapPin[] = [];
  let missingCount = 0;
  for (const a of assignments) {
    const place = a.place.placeId ? getPlaceById(a.place.placeId) : undefined;
    if (!place) {
      missingCount++;
      continue;
    }
    pins.push({
      id: a.place.id,
      name: place.name,
      neighborhood: place.neighborhood,
      lat: place.lat,
      lng: place.lng,
      dayNumber: range.globalDayIndexes[a.localDayIndex] + 1,
      skipped: a.skipped,
    });
  }
  if (tripStartISO) {
    for (const e of events) {
      if (e.cityId !== range.cityId || e.lat === null || e.lng === null) continue;
      pins.push({
        id: e.id,
        name: `Evento: ${e.name}`,
        neighborhood: e.neighborhood,
        lat: e.lat,
        lng: e.lng,
        dayNumber: daysBetween(tripStartISO, e.date),
        skipped: false,
      });
    }
  }
  return { pins, missingCount };
}

export function Itinerary() {
  const trip = useTrip();
  const navigate = useNavigate();
  // valor interno 'lugares' mantido; o rótulo visível é "Sugestões" (ajustes-60)
  const [mainTab, setMainTab] = useState<'lugares' | 'roteiro' | 'dicas'>('lugares');
  const [activeDestinationId, setActiveDestinationId] = useState(() => trip.destinations[0]?.id ?? '');
  const [tipsDestinationId, setTipsDestinationId] = useState(() => trip.destinations[0]?.id ?? '');
  const [roteiroView, setRoteiroView] = useState<'lista' | 'mapa'>('lista');
  const [mapDayFilter, setMapDayFilter] = useState<'all' | number>('all');
  const [listDayFilter, setListDayFilter] = useState<'all' | number>('all');
  const { message, visible, show } = useSaveToast();

  // --- fotos por atração (docs/ajustes-75-fotos-por-atracao.md) ---
  // um <input type="file"> só pra tela toda; a parada/evento que pediu fica guardada até o arquivo chegar
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoTargetRef = useRef<StopPhotoTarget | null>(null);
  const [viewer, setViewer] = useState<{ key: string; photoId: string } | null>(null);

  function pickPhotosFor(target: StopPhotoTarget) {
    photoTargetRef.current = target;
    photoInputRef.current?.click();
  }

  function handleStopPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const target = photoTargetRef.current;
    if (!target || files.length === 0) return;
    // o dia é o da parada no roteiro (não a data do arquivo): a pessoa está registrando aquele lugar
    const added: TripPhoto[] = files.map((file) => ({
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      fileName: file.name,
      fileDateISO: fileDateToISO(file.lastModified),
      dayISO: target.dayISO,
      dayManual: true,
      placeLabel: target.label,
      placeSelectionId: target.placeSelectionId,
      eventId: target.eventId,
      caption: '',
      favorite: false,
    }));
    trip.addPhotos(added);
    show(`${added.length} ${added.length === 1 ? 'foto adicionada' : 'fotos adicionadas'} em ${target.label}`);
  }

  /** botão + miniaturas de uma parada/evento */
  function stopPhotoParts(target: StopPhotoTarget) {
    const photos = photosOfTarget(trip.photos, target.key);
    return {
      button: (
        <Button variant="link" onClick={() => pickPhotosFor(target)} aria-label={`Adicionar foto de ${target.label}`}>
          <Icon icon={Camera} /> Adicionar foto
        </Button>
      ),
      thumbs: (
        <StopPhotos
          photos={photos}
          placeName={target.label}
          onOpen={(photoId) => setViewer({ key: target.key, photoId })}
        />
      ),
    };
  }

  /** mover a parada não muda o dia das fotos dela (a foto é registro do que aconteceu) — avisa no toast */
  function moveStop(selection: TripPlaceSelection, newDayIndex: number) {
    const linked = photosOfTarget(trip.photos, `place:${selection.id}`);
    trip.moveItineraryItem(selection.id, newDayIndex);
    if (linked.length === 0) return;
    const photoDays = [...new Set(linked.map((p) => p.dayISO).filter((d): d is string => Boolean(d)))];
    show(
      photoDays.length === 1
        ? `Lugar movido. As fotos continuam no dia ${formatISOToDisplay(photoDays[0]).slice(0, 5)}.`
        : 'Lugar movido. As fotos continuam nos dias em que foram tiradas.',
    );
  }

  // visualizador aberto a partir das miniaturas: navega só entre as fotos daquela parada
  const viewerSequence = viewer ? photosOfTarget(trip.photos, viewer.key) : [];
  const viewerPhoto = viewer ? (trip.photos.find((p) => p.id === viewer.photoId) ?? null) : null;

  function removeViewerPhoto(photo: TripPhoto) {
    const index = viewerSequence.findIndex((p) => p.id === photo.id);
    const next = viewerSequence[index + 1] ?? viewerSequence[index - 1] ?? null;
    trip.removePhoto(photo.id);
    setViewer(next && viewer ? { key: viewer.key, photoId: next.id } : null);
    show('Foto removida');
  }

  const bottomNav = <BottomNav />;

  function handleActiveDestinationChange(id: string) {
    setActiveDestinationId(id);
    setMapDayFilter('all');
  }

  function openTipsForDestination(destinationId: string) {
    setTipsDestinationId(destinationId);
    setMainTab('dicas');
  }

  if (trip.destinations.length === 0) {
    return (
      <ScreenShell
        appBar={
          <AppBar title="Roteiro da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />
        }
        bottomNav={bottomNav}
      >
        <EmptyTripState message="Essa viagem ainda não tem destinos cadastrados. Volte e cadastre a viagem primeiro." />
      </ScreenShell>
    );
  }

  const dayRanges = splitDaysByDestination(trip.destinations);
  const tripStartISO = getTripStartISO(trip.destinations);
  const tripEndISO = getTripEndISO(trip.destinations);
  const totalDays = tripStartISO && tripEndISO ? daysBetween(tripStartISO, tripEndISO) : 0;
  const assignmentsByDestination = new Map(
    dayRanges.map((range) => [
      range.destinationId,
      computeDestinationAssignments(
        range.destinationId,
        range.globalDayIndexes.length,
        trip.selectedPlaces,
        trip.itineraryOverrides,
      ),
    ]),
  );

  // --- aba Sugestões ---
  const activeDestination = trip.destinations.find((d) => d.id === activeDestinationId);
  const chosenEvents = selectedEvents(trip.selectedEventIds);
  const members = getMembers(trip);

  // --- Agenda do dia (ajustes-63): tudo com data/hora marcada, vindo da Central e dos eventos ---
  const agenda = buildAgenda(trip);
  const agendaOutsideTrip =
    tripStartISO && tripEndISO ? agenda.filter((a) => a.dateISO < tripStartISO || a.dateISO > tripEndISO) : [];

  function openAgendaItem(item: AgendaItem) {
    if (item.link.path === '/central') {
      navigate('/central', { state: { tab: item.link.tab } });
    } else {
      setMainTab(item.link.tab);
    }
  }

  function renderAgenda(items: AgendaItem[], withDate = false) {
    return (
      <ul className={styles.agendaList}>
        {items.map((item, index) => (
          <AgendaRow
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            onOpen={() => openAgendaItem(item)}
            openHint={item.link.path === '/central' ? 'abrir na Central' : 'ver nas Sugestões'}
            dateLabel={withDate ? formatISOToDisplay(item.dateISO).slice(0, 5) : undefined}
            action={
              item.kind === 'evento' ? (
                <button
                  type="button"
                  className={styles.skipButton}
                  onClick={() => trip.toggleEvent(item.sourceId)}
                  aria-label={`Remover ${item.title} do roteiro`}
                >
                  <Icon icon={X} />
                  Remover
                </button>
              ) : undefined
            }
            below={item.kind === 'evento' && !withDate ? eventPhotos(item) : undefined}
          />
        ))}
      </ul>
    );
  }

  function eventPhotos(item: AgendaItem) {
    const parts = stopPhotoParts({
      key: `event:${item.sourceId}`,
      label: getEventById(item.sourceId)?.name ?? item.title,
      dayISO: item.dateISO,
      placeSelectionId: null,
      eventId: item.sourceId,
    });
    return (
      <>
        {parts.thumbs}
        {parts.button}
      </>
    );
  }

  // --- aba Roteiro / mapa ---
  const activeRange = activeDestination ? dayRanges.find((r) => r.destinationId === activeDestination.id) : undefined;
  const activeAssignments = activeDestination ? (assignmentsByDestination.get(activeDestination.id) ?? []) : [];
  const { pins: mapPins, missingCount: mapMissingCount } = buildMapPins(
    activeRange,
    activeAssignments,
    activeDestination
      ? chosenEvents.filter((e) => cityIsInTripOn([activeDestination], activeDestination.cityId, e.date))
      : [],
    tripStartISO,
  );
  const filteredMapPins =
    mapDayFilter === 'all' || !activeRange
      ? mapPins
      : mapPins.filter((p) => p.dayNumber === (activeRange.globalDayIndexes[mapDayFilter] as number) + 1);

  // --- aba Dicas locais ---
  const tipsDestination = trip.destinations.find((d) => d.id === tipsDestinationId);
  const tipsForCity = tipsDestination ? getLocalTipsForCity(tipsDestination.cityId) : undefined;
  const alsoVisit = tipsDestination
    ? getAlsoWorthVisiting(
        tipsDestination.cityId,
        new Set(
          trip.selectedPlaces
            .filter((s) => s.destinationId === tipsDestination.id && s.placeId)
            .map((s) => s.placeId as string),
        ),
        trip.quiz.interests,
        trip.quiz.discovery,
      )
    : [];

  /** "Sugerido por Marina" / "Marina também quer" nas paradas (convidados simulados, ajustes-67) */
  function groupLine(selection: TripPlaceSelection) {
    const others = selection.alsoWantedBy.filter((m) => m !== YOU);
    const suggestedBy = selection.addedBy !== YOU ? memberLabel(members, selection.addedBy).split(' ')[0] : null;
    if (!suggestedBy && others.length === 0) return null;
    const avatars = members.filter((m) => m.id !== YOU && (m.id === selection.addedBy || others.includes(m.id)));
    const alsoNames = members.filter((m) => others.includes(m.id)).map((m) => m.shortName);
    const text = [
      suggestedBy ? `Sugerido por ${suggestedBy}` : '',
      alsoNames.length > 0 ? `${joinPt(alsoNames)} também ${alsoNames.length === 1 ? 'quer' : 'querem'}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <p className={styles.groupLine}>
        <MemberAvatars members={avatars} />
        <span>{text}</span>
      </p>
    );
  }

  /** "📷 Fotos do dia" → Memórias filtrada nesse dia (docs/ajustes-64-memorias-fotos.md) */
  function photosLink(dateISO: string) {
    const count = trip.photos.filter((p) => p.dayISO === dateISO).length;
    return (
      <button
        type="button"
        className={styles.dayTipsLink}
        onClick={() => navigate('/memorias', { state: { dayISO: dateISO } })}
      >
        <Icon icon={Camera} /> {count > 0 ? `Fotos do dia (${count})` : 'Adicionar fotos do dia'}
      </button>
    );
  }

  /** Atalho pro Conversor de Custos já com a moeda da cidade (docs/ajustes-62-conversor-de-moedas.md). */
  function converterLink(currencyCode: string) {
    return (
      <button
        type="button"
        className={styles.converterLink}
        onClick={() => navigate('/custos', { state: { tab: 'conversor', currencyCode } })}
      >
        <Icon icon={Banknote} /> Abrir conversor ({currencyCode} → BRL)
      </button>
    );
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Roteiro da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={bottomNav}
      toast={<SaveToast visible={visible} message={message} />}
    >
      <div className={styles.intro}>
        <h2 className={styles.title}>Seu roteiro dia a dia</h2>
        <p className={styles.subtitle}>
          Escolha o que quer visitar, veja o roteiro organizado por dia e as dicas de cada cidade.
        </p>
      </div>

      <Tabs
        name={MAIN_TABS_NAME}
        label="Seções do roteiro"
        items={[
          { value: 'lugares', label: 'Sugestões' },
          { value: 'roteiro', label: 'Roteiro' },
          { value: 'dicas', label: 'Dicas locais' },
        ]}
        value={mainTab}
        onChange={(v) => setMainTab(v as 'lugares' | 'roteiro' | 'dicas')}
      />

      {mainTab === 'lugares' && (
        <div
          role="tabpanel"
          id={`${MAIN_TABS_NAME}-panel-lugares`}
          aria-labelledby={`${MAIN_TABS_NAME}-tab-lugares`}
          className={styles.panel}
        >
          <DestinationTabs
            name={DESTINATION_TABS_NAME}
            label="Destino"
            destinations={trip.destinations}
            value={activeDestinationId}
            onChange={handleActiveDestinationChange}
          />

          {activeDestination && (
            <div
              role="tabpanel"
              id={`${DESTINATION_TABS_NAME}-panel-${activeDestination.id}`}
              aria-labelledby={`${DESTINATION_TABS_NAME}-tab-${activeDestination.id}`}
              className={styles.panel}
            >
              <SuggestionsPanel destination={activeDestination} onToast={show} />
            </div>
          )}

          {isRoteiroComplete(trip) && trip.companions.length === 0 && (
            <SuggestionCard
              message="Já tem lugares escolhidos. Quer convidar alguém pra essa viagem?"
              actionLabel="Convidar companheiros"
              to="/convidar"
              storageKey="convidar-companheiros"
            />
          )}
        </div>
      )}

      {mainTab === 'roteiro' && (
        <div
          role="tabpanel"
          id={`${MAIN_TABS_NAME}-panel-roteiro`}
          aria-labelledby={`${MAIN_TABS_NAME}-tab-roteiro`}
          className={styles.viewPanel}
        >
          <Tabs
            name={ROTEIRO_VIEW_TABS_NAME}
            label="Visualização do roteiro"
            iconOnly
            items={[
              { value: 'lista', label: 'Lista', icon: List },
              { value: 'mapa', label: 'Mapa', icon: MapIcon },
            ]}
            value={roteiroView}
            onChange={(v) => setRoteiroView(v as 'lista' | 'mapa')}
          />

          {!tripStartISO || !tripEndISO || dayRanges.length === 0 ? (
            <EmptyTripState message="Nenhum destino com datas completas ainda. Preencha as datas em Destinos pra ver o roteiro dia a dia." />
          ) : (
            <>
              {roteiroView === 'mapa' && (
                <div
                  role="tabpanel"
                  id={`${ROTEIRO_VIEW_TABS_NAME}-panel-mapa`}
                  aria-labelledby={`${ROTEIRO_VIEW_TABS_NAME}-tab-mapa`}
                  className={styles.viewPanel}
                >
                  <DestinationTabs
                    name={DESTINATION_TABS_NAME}
                    label="Destino do mapa"
                    destinations={trip.destinations}
                    value={activeDestinationId}
                    onChange={handleActiveDestinationChange}
                  />

                  {activeRange && activeRange.globalDayIndexes.length > 0 && (
                    <Tabs
                      name={MAP_DAY_TABS_NAME}
                      label="Dia do mapa"
                      variant="pill-date"
                      items={[
                        { value: 'all', label: 'Todos os dias' },
                        ...activeRange.globalDayIndexes.map((globalDay, i) => {
                          const { monthAbbrev, day } = formatISOToDayPill(globalDayToISO(tripStartISO, globalDay));
                          return {
                            value: String(i),
                            label: formatISOToDisplay(globalDayToISO(tripStartISO, globalDay)),
                            pillTop: monthAbbrev,
                            pillBottom: day,
                          };
                        }),
                      ]}
                      value={mapDayFilter === 'all' ? 'all' : String(mapDayFilter)}
                      onChange={(v) => setMapDayFilter(v === 'all' ? 'all' : Number(v))}
                    />
                  )}

                  {activeDestination && (
                    <RouteMap
                      cityLabel={activeDestination.city}
                      pins={filteredMapPins}
                      missingCount={mapMissingCount}
                    />
                  )}
                </div>
              )}

              {roteiroView === 'lista' && (
                <div
                  role="tabpanel"
                  id={`${ROTEIRO_VIEW_TABS_NAME}-panel-lista`}
                  aria-labelledby={`${ROTEIRO_VIEW_TABS_NAME}-tab-lista`}
                  className={styles.viewPanel}
                >
                  {totalDays > 1 && (
                    <Tabs
                      name="itinerary-list-day"
                      label="Dia do roteiro"
                      variant="pill-date"
                      items={[
                        { value: 'all', label: 'Todos os dias' },
                        ...Array.from({ length: totalDays }, (_, globalDay) => {
                          const { monthAbbrev, day } = formatISOToDayPill(globalDayToISO(tripStartISO, globalDay));
                          return {
                            value: String(globalDay),
                            label: formatISOToWeekdayDisplay(globalDayToISO(tripStartISO, globalDay)),
                            pillTop: monthAbbrev,
                            pillBottom: day,
                          };
                        }),
                      ]}
                      value={listDayFilter === 'all' ? 'all' : String(listDayFilter)}
                      onChange={(v) => setListDayFilter(v === 'all' ? 'all' : Number(v))}
                    />
                  )}

                  <ul className={styles.dayList}>
                    {Array.from({ length: totalDays }, (_, i) => i)
                      .filter((globalDay) => listDayFilter === 'all' || globalDay === listDayFilter)
                      .map((globalDay) => {
                        const dateISO = globalDayToISO(tripStartISO, globalDay);
                        const range = findRangeForGlobalDay(dayRanges, globalDay);

                        if (!range) {
                          const freeDayAgenda = agenda.filter((a) => a.dateISO === dateISO);
                          return (
                            <Card asChild className="px-4">
                            <li key={`free-${globalDay}`} className={styles.dayCard}>
                              <div className={styles.dayHeader}>
                                <h3 className={styles.dayTitle}>
                                  <Icon icon={CalendarDays} />{' '}
                                  {formatISOToLongWeekday(dateISO)}
                                </h3>
                                <span className={styles.daySubtitle}>
                                  Dia livre — nenhum destino cadastrado pra esse dia
                                </span>
                              </div>
                              {freeDayAgenda.length > 0 && (
                                <div className={styles.dayBlock}>
                                  <h4 className={styles.blockLabel}>
                                    <Icon icon={Clock} />{' '}Agenda do dia
                                  </h4>
                                  {renderAgenda(freeDayAgenda)}
                                </div>
                              )}
                              <div className={styles.dayLinks}>{photosLink(dateISO)}</div>
                            </li>
                            </Card>
                          );
                        }

                        const localDay = range.globalDayIndexes.indexOf(globalDay);
                        const assignments = assignmentsByDestination.get(range.destinationId) ?? [];
                        const dayItems = assignments.filter((a) => a.localDayIndex === localDay);
                        const active = dayItems.filter((a) => !a.skipped);
                        const skipped = dayItems.filter((a) => a.skipped);
                        // Agenda entra pela data (evento, voo, check-in…), mesmo num dia de fronteira
                        // que o roteiro atribui ao destino seguinte (ex.: Feira de San Telmo no 22/11).
                        const dayAgenda = agenda.filter((a) => a.dateISO === dateISO);

                        return (
                          <Card asChild className="px-4">
                          <li key={`${range.destinationId}-${localDay}`} className={styles.dayCard}>
                            <div className={styles.dayHeader}>
                              <h3 className={styles.dayTitle}>
                                <Icon icon={CalendarDays} />{' '}
                                {formatISOToLongWeekday(dateISO)}
                              </h3>
                              <span className={styles.daySubtitle}>
                                <Icon icon={MapPin} />{' '}
                                {range.city} · Dia {globalDay + 1} de {totalDays}
                              </span>
                            </div>

                            <div className={styles.dayBlocks}>
                              {dayAgenda.length > 0 && (
                                <div className={styles.dayBlock}>
                                  <h4 className={styles.blockLabel}>
                                    <Icon icon={Clock} />{' '}Agenda do dia
                                  </h4>
                                  {renderAgenda(dayAgenda)}
                                </div>
                              )}

                              <div className={styles.dayBlock}>
                                <h4 className={styles.blockLabel}>
                                  <Icon icon={MapPin} />{' '}Lugares pra visitar
                                </h4>
                                {dayItems.length === 0 ? (
                                  dayAgenda.length > 0 ? (
                                    <p className={styles.emptyDay}>
                                      Sem lugares pra esse dia.{' '}
                                      <button
                                        type="button"
                                        className={styles.inlineLink}
                                        onClick={() => setMainTab('lugares')}
                                      >
                                        Veja as Sugestões
                                      </button>
                                      .
                                    </p>
                                  ) : (
                                    <p className={styles.emptyDay}>Nenhum lugar alocado pra esse dia ainda.</p>
                                  )
                                ) : (
                                  <ul className={styles.timelineList}>
                                    {[...active, ...skipped].map((assignment, index) => {
                                      const place = assignment.place.placeId
                                        ? getPlaceById(assignment.place.placeId)
                                        : undefined;
                                      const tags = place
                                        ? place.categories.map((c) => ({
                                            key: c,
                                            icon: categoryIcon(c),
                                            label: INTEREST_LABELS[c as QuizInterest] ?? c,
                                          }))
                                        : [{ key: 'custom', icon: Pencil, label: 'Adicionado por você' }];
                                      const stopParts = stopPhotoParts({
                                        key: `place:${assignment.place.id}`,
                                        label: placeLabel(assignment.place),
                                        dayISO: dateISO,
                                        placeSelectionId: assignment.place.id,
                                        eventId: null,
                                      });
                                      return (
                                        <TimelineStop
                                          key={assignment.place.id}
                                          orderLabel={`Parada ${index + 1}`}
                                          title={placeLabel(assignment.place)}
                                          tags={
                                        <>
                                          <CategoryTags tags={tags} />
                                          {groupLine(assignment.place)}
                                        </>
                                      }
                                          description={place?.description}
                                          photoSearchTitle={place ? (place.wikiTitle ?? place.name) : undefined}
                                          fallbackIcon={placeIllustrationIcon(place?.categories)}
                                          skipped={assignment.skipped}
                                          isLast={index === dayItems.length - 1}
                                          photos={stopParts.thumbs}
                                          actions={
                                            <>
                                              {stopParts.button}
                                              {!assignment.skipped && range.globalDayIndexes.length > 1 && (
                                                <label className={styles.moveLabel}>
                                                  <Icon icon={ArrowLeftRight} />
                                                  <NativeSelect
                                                    selectClassName="h-11 rounded-md border-input bg-background pr-8 pl-2 text-(length:--text-sm) text-foreground focus-visible:ring-0"
                                                    value={assignment.localDayIndex}
                                                    onChange={(e) => moveStop(assignment.place, Number(e.target.value))}
                                                    aria-label={`Mover ${placeLabel(assignment.place)} pra outro dia`}
                                                  >
                                                    {range.globalDayIndexes.map((globalDay, i) => (
                                                      <NativeSelectOption key={i} value={i}>
                                                        {formatISOToDisplay(
                                                          globalDayToISO(tripStartISO, globalDay),
                                                        ).slice(0, 5)}{' '}
                                                        (dia {i + 1})
                                                      </NativeSelectOption>
                                                    ))}
                                                  </NativeSelect>
                                                </label>
                                              )}
                                              <button
                                                type="button"
                                                className={`${styles.skipButton} ${assignment.skipped ? styles.skipButtonUndo : ''}`}
                                                onClick={() => trip.toggleItinerarySkipped(assignment.place.id)}
                                              >
                                                <Icon icon={assignment.skipped ? RotateCcw : SkipForward} />
                                                {assignment.skipped ? 'Desfazer' : 'Pulei'}
                                              </button>
                                            </>
                                          }
                                        />
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div className={styles.dayLinks}>
                              <button
                                type="button"
                                className={styles.dayTipsLink}
                                onClick={() => openTipsForDestination(range.destinationId)}
                              >
                                <Icon icon={Lightbulb} /> Ver dicas locais desse dia →
                              </button>
                              {photosLink(dateISO)}
                            </div>
                          </li>
                          </Card>
                        );
                      })}

                    {listDayFilter === 'all' && agendaOutsideTrip.length > 0 && (
                      <Card asChild className="px-4">
                      <li className={styles.dayCard}>
                        <div className={styles.dayHeader}>
                          <h3 className={styles.dayTitle}>
                            <Icon icon={CalendarX} />{' '}Fora das datas da viagem
                          </h3>
                          <span className={styles.daySubtitle}>
                            Confira se a data foi digitada certa — a viagem vai de {formatISOToDisplay(tripStartISO)} a{' '}
                            {formatISOToDisplay(tripEndISO)}.
                          </span>
                        </div>
                        {renderAgenda(agendaOutsideTrip, true)}
                      </li>
                      </Card>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mainTab === 'dicas' && (
        <div
          role="tabpanel"
          id={`${MAIN_TABS_NAME}-panel-dicas`}
          aria-labelledby={`${MAIN_TABS_NAME}-tab-dicas`}
          className={styles.panel}
        >
          {trip.destinations.length > 0 && (
            <DestinationTabs
              name={TIPS_TABS_NAME}
              label="Destino das dicas"
              destinations={trip.destinations}
              value={tipsDestinationId}
              onChange={setTipsDestinationId}
            />
          )}

          {tipsDestination && (
            <div
              role="tabpanel"
              id={`${TIPS_TABS_NAME}-panel-${tipsDestination.id}`}
              aria-labelledby={`${TIPS_TABS_NAME}-tab-${tipsDestination.id}`}
              className={styles.panel}
            >
              {!tipsForCity ? (
                <p className={styles.noData}>Dicas locais ainda não disponíveis pra {tipsDestination.city}.</p>
              ) : (
                tipsForCity.categories.map((cat) => (
                  <Card asChild className="px-4">
                  <div key={cat.category} className={styles.tipsCategory}>
                    <h4 className={styles.tipsCategoryTitle}>{cat.label}</h4>
                    <ul className={styles.tipsList}>
                      {cat.tips.map((tip, i) => (
                        <li key={i} className={styles.tipsItem}>
                          <span className={styles.bullet} aria-hidden="true">
                            •
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                    {cat.category === 'dinheiro' && converterLink(tipsDestination.currencyCode)}
                  </div>
                  </Card>
                ))
              )}

              {/* cidade sem bloco "Dinheiro e câmbio": o atalho vai no fim das dicas */}
              {!tipsForCity?.categories.some((c) => c.category === 'dinheiro') &&
                converterLink(tipsDestination.currencyCode)}

              {alsoVisit.length > 0 && (
                <div className={styles.alsoVisit}>
                  <h4 className={styles.alsoVisitTitle}>Também vale visitar</h4>
                  {alsoVisit.map((place) => (
                    <div key={place.id} className={styles.alsoVisitItem}>
                      <span className={styles.alsoVisitName}>{place.name}</span>
                      <span className={styles.alsoVisitMeta}>
                        {place.neighborhood} · {formatCategories(place.categories)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleStopPhotos}
        aria-hidden="true"
        tabIndex={-1}
      />

      {viewer && viewerPhoto && (
        <PhotoViewer
          photo={viewerPhoto}
          sequence={viewerSequence.some((p) => p.id === viewerPhoto.id) ? viewerSequence : [viewerPhoto]}
          days={tripDays(trip.destinations)}
          onNavigate={(photoId) => setViewer({ key: viewer.key, photoId })}
          onRemove={removeViewerPhoto}
          onClose={() => setViewer(null)}
        />
      )}
    </ScreenShell>
  );
}
