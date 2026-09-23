import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { Button } from '../components/shell/Button';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { SaveToast } from '../components/shell/SaveToast';
import { SuggestionCard } from '../components/shell/SuggestionCard';
import { Tabs } from '../components/shell/Tabs';
import { EmptyTripState } from '../components/shell/EmptyTripState';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { TimelineStop } from '../components/itinerary/TimelineStop';
import { TextField } from '../components/inputs/TextField';
import { PlaceRow } from '../components/places/PlaceRow';
import {
  formatCategories,
  getAlsoWorthVisiting,
  getLocalTipsForCity,
  getPlaceById,
  getPlacesForCity,
  rankPlacesByProfile,
} from '../data';
import { useTrip, type TripPlaceSelection } from '../context/TripContext';
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
import { formatISOToDayPill, formatISOToDisplay, formatISOToWeekdayDisplay } from '../utils/dateMask';
import styles from './Itinerary.module.css';

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

/** Lugares customizados (sem placeId) não têm coordenada — ficam de fora do mapa, só na lista. */
function buildMapPins(
  range: DestinationDayRange | undefined,
  assignments: ItineraryItemAssignment[],
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
  return { pins, missingCount };
}

export function Itinerary() {
  const trip = useTrip();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<'lugares' | 'roteiro' | 'dicas'>('lugares');
  const [activeDestinationId, setActiveDestinationId] = useState(() => trip.destinations[0]?.id ?? '');
  const [customText, setCustomText] = useState('');
  const [tipsDestinationId, setTipsDestinationId] = useState(() => trip.destinations[0]?.id ?? '');
  const [roteiroView, setRoteiroView] = useState<'lista' | 'mapa'>('lista');
  const [mapDayFilter, setMapDayFilter] = useState<'all' | number>('all');
  const [listDayFilter, setListDayFilter] = useState<'all' | number>('all');
  const { message, visible, show } = useSaveToast();

  const bottomNav = <BottomNav />;

  function handleActiveDestinationChange(id: string) {
    setActiveDestinationId(id);
    setCustomText('');
    setMapDayFilter('all');
  }

  function openTipsForDestination(destinationId: string) {
    setTipsDestinationId(destinationId);
    setMainTab('dicas');
  }

  if (trip.destinations.length === 0) {
    return (
      <ScreenShell
        appBar={<AppBar title="Roteiro da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
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

  // --- aba Lugares ---
  const activeDestination = trip.destinations.find((d) => d.id === activeDestinationId);
  const cityPlaces = activeDestination ? getPlacesForCity(activeDestination.cityId) : [];
  const rankedPlaces = rankPlacesByProfile(cityPlaces, trip.quiz.interests, trip.quiz.discovery);
  const selectedIdsForDestination = new Set(
    trip.selectedPlaces
      .filter((s) => s.destinationId === activeDestinationId && s.placeId)
      .map((s) => s.placeId as string),
  );
  const customPlacesForDestination = trip.selectedPlaces.filter(
    (s) => s.destinationId === activeDestinationId && !s.placeId,
  );

  function handleAddCustom() {
    const trimmed = customText.trim();
    if (trimmed.length === 0) return;
    trip.addCustomPlace(activeDestinationId, trimmed);
    setCustomText('');
    show('Lugar adicionado');
  }

  function handleCustomKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  }

  // --- aba Roteiro / mapa ---
  const activeRange = activeDestination ? dayRanges.find((r) => r.destinationId === activeDestination.id) : undefined;
  const activeAssignments = activeDestination ? (assignmentsByDestination.get(activeDestination.id) ?? []) : [];
  const { pins: mapPins, missingCount: mapMissingCount } = buildMapPins(activeRange, activeAssignments);
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
          { value: 'lugares', label: 'Lugares' },
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
          <Tabs
            name={DESTINATION_TABS_NAME}
            label="Destino"
            items={trip.destinations.map((d) => ({ value: d.id, label: d.city }))}
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
              {/*
                Campo de adicionar por conta própria no TOPO, sempre visível
                (ver docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md) — não
                escondido no fim da lista de sugestões.
              */}
              <div className={styles.addCustom}>
                <TextField
                  id="custom-place"
                  label="Não achou o que procurava? Adicione um lugar"
                  placeholder="Ex.: Um restaurante ou lugar que você já conhece"
                  value={customText}
                  onChange={setCustomText}
                  onKeyDown={handleCustomKeyDown}
                  autoComplete="off"
                />
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={customText.trim().length === 0}
                  onClick={handleAddCustom}
                >
                  Adicionar
                </Button>
              </div>

              {customPlacesForDestination.length > 0 && (
                <ul className={styles.placeList}>
                  {customPlacesForDestination.map((s) => (
                    <li key={s.id} className={styles.customRow}>
                      <span className={styles.customLabel}>{s.customLabel}</span>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => trip.removeSelectedPlace(s.id)}
                        aria-label={`Remover ${s.customLabel}`}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {cityPlaces.length === 0 ? (
                <p className={styles.noData}>
                  Sugestões ainda não disponíveis pra {activeDestination.city}. Você pode adicionar lugares por conta
                  própria acima.
                </p>
              ) : (
                <ul className={styles.placeList}>
                  {rankedPlaces.map((place) => (
                    <li key={place.id}>
                      <PlaceRow
                        name={place.name}
                        neighborhood={place.neighborhood}
                        categoriesLabel={formatCategories(place.categories)}
                        wikiTitle={place.wikiTitle}
                        selected={selectedIdsForDestination.has(place.id)}
                        onToggle={() => {
                          const wasSelected = selectedIdsForDestination.has(place.id);
                          trip.togglePlace(activeDestinationId, { placeId: place.id, categories: place.categories });
                          if (!wasSelected) show('Lugar adicionado');
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
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
          className={styles.panel}
        >
          <Tabs
            name={ROTEIRO_VIEW_TABS_NAME}
            label="Visualização do roteiro"
            iconOnly
            items={[
              { value: 'lista', label: 'Lista', icon: '☰' },
              { value: 'mapa', label: 'Mapa', icon: '🗺️' },
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
                  className={styles.panel}
                >
                  <Tabs
                    name={DESTINATION_TABS_NAME}
                    label="Destino do mapa"
                    items={trip.destinations.map((d) => ({ value: d.id, label: d.city }))}
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
                        return (
                          <li key={`free-${globalDay}`} className={styles.dayCard}>
                            <div className={styles.dayHeader}>
                              <h3 className={styles.dayTitle}>{formatISOToWeekdayDisplay(dateISO)}</h3>
                              <span className={styles.daySubtitle}>
                                Dia livre — nenhum destino cadastrado pra esse dia
                              </span>
                            </div>
                          </li>
                        );
                      }

                      const localDay = range.globalDayIndexes.indexOf(globalDay);
                      const assignments = assignmentsByDestination.get(range.destinationId) ?? [];
                      const dayItems = assignments.filter((a) => a.localDayIndex === localDay);
                      const active = dayItems.filter((a) => !a.skipped);
                      const skipped = dayItems.filter((a) => a.skipped);

                      return (
                        <li key={`${range.destinationId}-${localDay}`} className={styles.dayCard}>
                          <div className={styles.dayHeader}>
                            <h3 className={styles.dayTitle}>{formatISOToWeekdayDisplay(dateISO)}</h3>
                            <span className={styles.daySubtitle}>
                              Dia {globalDay + 1} de {totalDays} · {range.city}
                            </span>
                          </div>

                          {dayItems.length === 0 ? (
                            <p className={styles.emptyDay}>Nenhum lugar alocado pra esse dia ainda.</p>
                          ) : (
                            <ul className={styles.timelineList}>
                              {[...active, ...skipped].map((assignment, index, arr) => {
                                const place = assignment.place.placeId ? getPlaceById(assignment.place.placeId) : undefined;
                                return (
                                  <TimelineStop
                                    key={assignment.place.id}
                                    orderLabel={`Parada ${index + 1}`}
                                    title={placeLabel(assignment.place)}
                                    description={place?.description}
                                    photoSearchTitle={place ? (place.wikiTitle ?? place.name) : undefined}
                                    skipped={assignment.skipped}
                                    isLast={index === arr.length - 1}
                                    actions={
                                      <>
                                        {!assignment.skipped && range.globalDayIndexes.length > 1 && (
                                          <select
                                            className={styles.moveSelect}
                                            value={assignment.localDayIndex}
                                            onChange={(e) =>
                                              trip.moveItineraryItem(assignment.place.id, Number(e.target.value))
                                            }
                                            aria-label={`Mover ${placeLabel(assignment.place)} pra outro dia`}
                                          >
                                            {range.globalDayIndexes.map((globalDay, i) => (
                                              <option key={i} value={i}>
                                                {formatISOToDisplay(globalDayToISO(tripStartISO, globalDay)).slice(0, 5)}{' '}
                                                (dia {i + 1})
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                        <button
                                          type="button"
                                          className={`${styles.skipButton} ${assignment.skipped ? styles.skipButtonUndo : ''}`}
                                          onClick={() => trip.toggleItinerarySkipped(assignment.place.id)}
                                        >
                                          <span aria-hidden="true">{assignment.skipped ? '↺' : '⏭'}</span>
                                          {assignment.skipped ? 'Desfazer' : 'Pulei'}
                                        </button>
                                      </>
                                    }
                                  />
                                );
                              })}
                            </ul>
                          )}

                          <button
                            type="button"
                            className={styles.dayTipsLink}
                            onClick={() => openTipsForDestination(range.destinationId)}
                          >
                            Ver dicas locais desse dia →
                          </button>
                        </li>
                      );
                    })}
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
            <Tabs
              name={TIPS_TABS_NAME}
              label="Destino das dicas"
              items={trip.destinations.map((d) => ({ value: d.id, label: d.city }))}
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
                  </div>
                ))
              )}

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
    </ScreenShell>
  );
}

