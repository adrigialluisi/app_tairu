import {
  Banknote,
  CalendarDays,
  CalendarX,
  Camera,
  ChevronRight,
  Clock,
  List,
  Map as MapIcon,
  MapPin,
  Pencil,
  RotateCcw,
  Route,
  SkipForward,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExpenseForm } from '../components/costs/ExpenseForm';
import { formatMoney, parseAmount, toBRL } from '../utils/money';
import { SaveToast } from '../components/shell/SaveToast';
import { DestinationTabs } from '../components/itinerary/DestinationTabs';
import { SuggestionCard } from '../components/shell/SuggestionCard';
import { Tabs } from '../components/shell/Tabs';
import { EmptyTripState } from '../components/shell/EmptyTripState';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { TimelineStop } from '../components/itinerary/TimelineStop';
import { AgendaRow } from '../components/itinerary/AgendaRow';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { JoinButton } from '../components/shell/JoinButton';
import { Switch } from '../components/shell/Switch';
import { GroupPlanCard } from '../components/itinerary/GroupPlanCard';
import { goersText, wantersOf } from '../utils/members';
import { MemberTag } from '../components/shell/MemberTag';
import { YOU, activeMembers, getMembers } from '../utils/costs';
import { joinPt } from '../utils/retrospective';
import { CategoryTags } from '../components/suggestions/CategoryTags';
import { PlaceSearchBar } from '../components/suggestions/PlaceSearchBar';
import { SuggestionsPanel } from '../components/suggestions/SuggestionsPanel';
import {
  INTEREST_LABELS,
  formatCategories,
  getAlsoWorthVisiting,
  getEventById,
  getLocalTipsForCity,
  getPlaceById,
  placePhotoUrl,
  type EventEntry,
  type PlaceEntry,
} from '../data';
import { useTrip, type ExpenseCategory, type QuizInterest, type TripDestination, type TripPhoto, type TripPlaceSelection } from '../context/TripContext';
import { useSaveToast } from '../hooks/useSaveToast';
import { isRoteiroComplete } from '../utils/tripProgress';
import { useMarkSectionSeen } from '../hooks/useMarkSectionSeen';
import {
  computeDestinationAssignments,
  groupPlansByDay,
  isMyPlace,
  proximityOptionsFor,
  daysBetween,
  getTripEndISO,
  getTripStartISO,
  globalDayToISO,
  splitDaysByDestination,
  weekdayOfISO,
  type DestinationDayRange,
  type ItineraryItemAssignment,
} from '../utils/itinerary';
import { categoryIcon, placeIllustrationIcon } from '../utils/categoryVisuals';
import { buildAgenda, type AgendaItem } from '../utils/agenda';
import { getTripToday } from '../utils/tripToday';
import { activityConflict } from '../utils/activityConflicts';
import { closedDayWarning, openDaysLabel } from '../utils/openDays';
import {
  formatISOToDayPill,
  formatISOToDisplay,
  formatISOToLongWeekday,
  formatISOToShortDay,
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
const ROTEIRO_CITY_TABS_NAME = 'itinerary-roteiro-city';

/**
 * Dias (índice global) que aparecem numa cidade nas abas do Roteiro (ajustes-95): os dela mais o
 * dia em que ela sai pra próxima — o dia de fronteira é de quem chega, mas aparece nas duas.
 */
function cityDays(destination: TripDestination, dayRanges: DestinationDayRange[], tripStartISO: string | null): number[] {
  const own = dayRanges.find((r) => r.destinationId === destination.id)?.globalDayIndexes ?? [];
  if (!tripStartISO || !destination.dateEnd) return own;
  const leavingDay = daysBetween(tripStartISO, destination.dateEnd) - 1;
  return own.includes(leavingDay) ? own : [...own, leavingDay].sort((a, b) => a - b);
}

/**
 * Lugar que só abre em alguns dias (ajustes-95): "Só aos domingos" na parada; se ela caiu num dia em
 * que o lugar não abre (nenhum dia da cidade servia, ou a pessoa mudou de dia), vira o aviso âmbar
 * "Só abre aos domingos" — --warning no branco 5.89:1, sempre com o ícone.
 */
function openDaysLine(place: PlaceEntry | undefined, dateISO: string): ReactNode {
  const label = openDaysLabel(place?.openDays);
  if (!place?.openDays || !label) return null;
  return place.openDays.includes(weekdayOfISO(dateISO)) ? (
    <p className="m-0 flex items-center gap-1 text-(length:--text-sm) text-muted-foreground">
      <Icon icon={CalendarDays} /> {label}
    </p>
  ) : (
    <p className="m-0 flex items-center gap-1 text-(length:--text-sm) font-medium text-warning">
      <Icon icon={TriangleAlert} /> {closedDayWarning(place.openDays)}
    </p>
  );
}

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

/** "Sex 20/11" — legenda do mapa com as mesmas datas das pílulas (ajustes-88) */
function mapDayLabel(iso: string): string {
  return formatISOToShortDay(iso).replace(',', '');
}

/**
 * Lugares customizados (sem placeId) não têm coordenada — ficam de fora do
 * mapa, só na lista. Eventos escolhidos com lat/lng entram como pin no dia
 * deles; evento sem coordenada (ex.: Lua cheia) fica de fora.
 * Desde o ajustes-80: cada dia tem a sua cor (`colorIndex` = dia local do
 * destino), o número no pino é a ordem da parada no dia (a mesma "Parada N"
 * da lista: ativas na ordem da rota, depois as puladas) e o evento ganha pino
 * de calendário na cor do dia dele.
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
  const ordered = [...assignments.filter((a) => !a.skipped), ...assignments.filter((a) => a.skipped)];
  const nextOrder = new Map<number, number>();
  for (const a of ordered) {
    const order = (nextOrder.get(a.localDayIndex) ?? 0) + 1;
    nextOrder.set(a.localDayIndex, order);
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
      dayLabel: tripStartISO ? mapDayLabel(globalDayToISO(tripStartISO, range.globalDayIndexes[a.localDayIndex])) : undefined,
      skipped: a.skipped,
      colorIndex: a.localDayIndex,
      order,
      kind: 'place',
      photoTitle: place.wikiTitle ?? place.name,
      photoUrl: placePhotoUrl(place),
    });
  }
  if (tripStartISO) {
    for (const e of events) {
      if (e.cityId !== range.cityId || e.lat === null || e.lng === null) continue;
      const globalDay = daysBetween(tripStartISO, e.date) - 1;
      const local = range.globalDayIndexes.indexOf(globalDay);
      // dia de fronteira que o roteiro dá pro outro destino: usa a cor do dia mais perto deste destino
      const colorIndex = local >= 0 ? local : globalDay < range.globalDayIndexes[0] ? 0 : range.globalDayIndexes.length - 1;
      pins.push({
        id: e.id,
        name: e.name,
        neighborhood: e.neighborhood,
        lat: e.lat,
        lng: e.lng,
        dayNumber: globalDay + 1,
        dayLabel: mapDayLabel(e.date),
        skipped: false,
        colorIndex,
        kind: 'event',
        detail: `Dia ${globalDay + 1} · Evento · ${e.time}`,
      });
    }
  }
  return { pins, missingCount };
}

/** classe de item dos menus ⋯ (mesma de Convidados): 44px de toque */
const MENU_ITEM = 'min-h-11 px-3 text-(length:--text-base)';

/** categoria do gasto deduzida do lugar (ajustes-88): comer → Alimentação; ver → Passeios; comprar → Compras */
function expenseCategoryFor(place: PlaceEntry | undefined): ExpenseCategory | null {
  const first = place?.categories[0];
  if (!first) return null;
  if (first === 'gastronomia') return 'alimentacao';
  if (first === 'compras') return 'compras';
  return 'passeios';
}

/** Até 2 bairros mais frequentes entre os lugares do dia (empate: o que aparece primeiro na rota) — ajustes-80. */
function dayNeighborhoods(assignments: ItineraryItemAssignment[]): string {
  const counts = new Map<string, number>();
  for (const a of assignments) {
    const place = a.place.placeId ? getPlaceById(a.place.placeId) : undefined;
    if (place?.neighborhood) counts.set(place.neighborhood, (counts.get(place.neighborhood) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([name]) => name);
  return joinPt(top);
}

export function Itinerary() {
  const trip = useTrip();
  const navigate = useNavigate();
  // "Novidades na viagem" da Início (ajustes-89) abre as Sugestões já na cidade com mais novidades;
  // "Ver o dia de hoje" (ajustes-94) abre o Roteiro na cidade de hoje
  const navState =
    (useLocation().state as { tab?: 'lugares' | 'roteiro'; destinationId?: string; section?: string } | null) ?? {};
  // "Simular: durante a viagem" (ajustes-94): o Roteiro abre no dia de hoje, na cidade de hoje
  const today = getTripToday(trip.destinations, trip.simulatedTodayISO);
  // valor interno 'lugares' mantido; o rótulo visível é "Sugestões" (ajustes-60)
  const [mainTab, setMainTab] = useState<'lugares' | 'roteiro' | 'dicas'>(
    navState.tab ?? (today ? 'roteiro' : 'lugares'),
  );
  const [activeDestinationId, setActiveDestinationId] = useState(
    () =>
      (navState.destinationId && trip.destinations.some((d) => d.id === navState.destinationId)
        ? navState.destinationId
        : (today?.destinationId ?? trip.destinations[0]?.id)) ?? '',
  );
  // ajustes-89: lugares dos convidados são novidade até a pessoa sair do Roteiro
  useMarkSectionSeen('roteiro');
  // "N lugares sugeridos em Buenos Aires" (ajustes-94) chega direto em "Escolhas dos convidados"
  useEffect(() => {
    if (!navState.section || !navState.destinationId) return;
    requestAnimationFrame(() =>
      document
        .getElementById(`sugestoes-${navState.destinationId}-${navState.section}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
    // só na chegada à tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tipsDestinationId, setTipsDestinationId] = useState(() => trip.destinations[0]?.id ?? '');
  const [roteiroView, setRoteiroView] = useState<'lista' | 'mapa'>('lista');
  /*
    Aba Roteiro (ajustes-95): cidade ('all' = Todas) + dia (índice global), os mesmos na Lista e no
    Mapa. Com a viagem "acontecendo", abre na cidade e no dia de hoje.
  */
  const [roteiroCity, setRoteiroCity] = useState<string>(() =>
    navState.tab === 'roteiro' && navState.destinationId && trip.destinations.some((d) => d.id === navState.destinationId)
      ? navState.destinationId
      : (today?.destinationId ?? 'all'),
  );
  const [dayFilter, setDayFilter] = useState<'all' | number>(today ? today.globalDay : 'all');
  // "Mostrar planos do grupo" (ajustes-95b): ligado por padrão
  const [showGroupPlans, setShowGroupPlans] = useState(true);
  // parada com o formulário de gasto aberto (ajustes-88)
  const [expenseStopId, setExpenseStopId] = useState<string | null>(null);
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

  /** botão + miniaturas de uma parada/evento (na parada, o botão é o "Foto" compacto da faixa de ações, ajustes-88) */
  function stopPhotoParts(target: StopPhotoTarget, compact = false) {
    const photos = photosOfTarget(trip.photos, target.key);
    return {
      button: compact ? (
        <Button
          variant="secondary"
          className={styles.stopAction}
          onClick={() => pickPhotosFor(target)}
          aria-label={`Adicionar foto de ${target.label}`}
        >
          <Icon icon={Camera} /> Foto
        </Button>
      ) : (
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

  /*
    Ações da parada (ajustes-88). Normal: faixa única [Foto] [Gasto] [Alterar] — o seletor de dia não
    cabia junto em 375px, então foi pro menu como "Mudar de dia", com o "Pulei"; o ⋯ solto que abria
    esse menu virou o botão "Alterar" no ajustes-95. Pulada: só o nome
    riscado e "Desfazer" à direita. "Gasto" abre o ExpenseForm ali mesmo, já preenchido com o lugar,
    a cidade, a moeda, o dia e a categoria — a pessoa só digita o valor. O gasto guarda a parada
    (placeSelectionId) e aparece nela como "ARS 120.000 · ≈ R$ 409", que leva ao lançamento em Custos.
  */
  function stopControls({
    assignment,
    range,
    dateISO,
    place,
    photoButton,
  }: {
    assignment: ItineraryItemAssignment;
    range: DestinationDayRange;
    dateISO: string;
    place: PlaceEntry | undefined;
    photoButton: ReactNode;
  }) {
    const label = placeLabel(assignment.place);
    if (assignment.skipped) {
      return {
        titleAction: (
          <Button
            variant="secondary"
            className={styles.stopAction}
            onClick={() => trip.toggleItinerarySkipped(assignment.place.id)}
            aria-label={`Desfazer: ${label} volta pro roteiro`}
          >
            <Icon icon={RotateCcw} /> Desfazer
          </Button>
        ),
      };
    }
    const destination = trip.destinations.find((d) => d.id === range.destinationId);
    const stopExpenses = trip.expenses.filter((e) => e.placeSelectionId === assignment.place.id);
    const formOpen = expenseStopId === assignment.place.id;
    const startISO = getTripStartISO(trip.destinations);
    return {
      extra:
        stopExpenses.length > 0 || formOpen ? (
          <>
            {stopExpenses.map((e) => {
              const amount = parseAmount(e.amount);
              const brl = amount !== null && e.currencyCode !== 'BRL' ? toBRL(amount, e.currencyCode) : null;
              return (
                <button
                  key={e.id}
                  type="button"
                  className={styles.stopExpense}
                  onClick={() => navigate('/custos', { state: { expenseId: e.id } })}
                  aria-label={`Gasto em ${label}: ${amount !== null ? formatMoney(amount, e.currencyCode) : e.amount}. Ver em Custos`}
                >
                  <Icon icon={Wallet} />
                  <span>
                    {amount !== null ? formatMoney(amount, e.currencyCode) : `${e.currencyCode} ${e.amount}`}
                    {brl !== null && ` · ≈ ${formatMoney(brl, 'BRL')}`}
                  </span>
                  <Icon icon={ChevronRight} />
                </button>
              );
            })}
            {formOpen && (
              <div className={styles.stopExpenseForm}>
                <ExpenseForm
                  destinations={trip.destinations}
                  members={activeMembers(members)}
                  initialExpense={null}
                  prefill={{
                    description: label,
                    destinationId: range.destinationId,
                    currencyCode: destination?.currencyCode,
                    date: dateISO,
                    category: expenseCategoryFor(place),
                    placeSelectionId: assignment.place.id,
                  }}
                  onSave={(expense) => {
                    trip.saveExpense(expense);
                    setExpenseStopId(null);
                    show('Gasto salvo');
                  }}
                  onCancel={() => setExpenseStopId(null)}
                />
              </div>
            )}
          </>
        ) : undefined,
      actions: (
        <>
          {photoButton}
          <Button
            variant="secondary"
            className={styles.stopAction}
            aria-expanded={formOpen}
            onClick={() => setExpenseStopId(formOpen ? null : assignment.place.id)}
            aria-label={`Lançar gasto em ${label}`}
          >
            <Icon icon={Wallet} /> Gasto
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              {/* "Alterar" no lugar do ⋯ solto (ajustes-95): mesmo estilo e tamanho de Foto e Gasto */}
              <Button variant="secondary" className={styles.stopAction} aria-label={`Alterar ${label}: mudar de dia ou marcar como pulei`}>
                <Icon icon={Pencil} /> Alterar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-52">
              {startISO && range.globalDayIndexes.length > 1 && (
                <>
                  <DropdownMenuLabel className="px-3 text-(length:--text-sm) text-muted-foreground">
                    Mudar de dia
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={String(assignment.localDayIndex)}
                    onValueChange={(v) => moveStop(assignment.place, Number(v))}
                  >
                    {range.globalDayIndexes.map((globalDay, i) => (
                      <DropdownMenuRadioItem key={i} value={String(i)} className={MENU_ITEM}>
                        {formatISOToShortDay(globalDayToISO(startISO, globalDay))} (dia {i + 1})
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => trip.toggleItinerarySkipped(assignment.place.id)}>
                <Icon icon={SkipForward} /> Pulei
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ),
    };
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
        proximityOptionsFor(trip, range.destinationId),
      ),
    ]),
  );

  // planos dos convidados (ajustes-95b), cada um no dia em que cairia se a participante tocasse "+"
  const plansByDestination = new Map(
    dayRanges.map((range) => [
      range.destinationId,
      groupPlansByDay(
        range.destinationId,
        range.globalDayIndexes.length,
        trip.selectedPlaces,
        trip.itineraryOverrides,
        proximityOptionsFor(trip, range.destinationId),
      ),
    ]),
  );
  const hasGroupPlans = [...plansByDestination.values()].some((m) => m.size > 0);

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
            warning={
              // evento, passeio ou ingresso da cidade depois do voo que sai dela (ajustes-94)
              activityConflict(trip, { cityId: item.cityId, dateISO: item.dateISO, time: item.time })?.agendaBadge
            }
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

  // --- aba Roteiro: cidade + dia (ajustes-95) ---
  const roteiroDestination = trip.destinations.find((d) => d.id === roteiroCity);
  const allDays = Array.from({ length: totalDays }, (_, i) => i);
  // dias da cidade escolhida; o dia de troca de cidade ("Buenos Aires → Santiago") aparece nas duas
  const visibleDays = roteiroDestination ? cityDays(roteiroDestination, dayRanges, tripStartISO) : allDays;
  const activeDayFilter = dayFilter !== 'all' && visibleDays.includes(dayFilter) ? dayFilter : 'all';

  function handleRoteiroCityChange(id: string) {
    setRoteiroCity(id);
    const nextDestination = trip.destinations.find((d) => d.id === id);
    const nextDays = nextDestination ? cityDays(nextDestination, dayRanges, tripStartISO) : allDays;
    // com a viagem acontecendo, a cidade de hoje volta pro dia de hoje; senão, todos os dias
    setDayFilter(today && nextDays.includes(today.globalDay) ? today.globalDay : 'all');
  }

  // mapa: os pinos de cada cidade no escopo (Todas = todas as cidades da viagem)
  const mapScope = roteiroDestination ? [roteiroDestination] : trip.destinations;
  const mapPins: RouteMapPin[] = [];
  let mapMissingCount = 0;
  for (const d of mapScope) {
    const built = buildMapPins(
      dayRanges.find((r) => r.destinationId === d.id),
      assignmentsByDestination.get(d.id) ?? [],
      chosenEvents.filter((e) => cityIsInTripOn([d], d.cityId, e.date)),
      tripStartISO,
    );
    // em "Todas", a cor segue o dia da viagem, pra 2 cidades não repetirem a cor do mesmo dia local
    mapPins.push(...(roteiroDestination ? built.pins : built.pins.map((p) => ({ ...p, colorIndex: p.dayNumber - 1 }))));
    mapMissingCount += built.missingCount;
  }
  const filteredMapPins =
    activeDayFilter === 'all' ? mapPins : mapPins.filter((p) => p.dayNumber === activeDayFilter + 1);

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

  /*
    Convidados nas paradas (ajustes-67; visual do ajustes-94; regra do ajustes-95b): no roteiro da
    participante só entram as paradas DELA (isMyPlace). Quem sugeriu vira a tag colorida no canto e,
    se algum convidado também vai, a parada ganha o ✓ ao lado — tocar desfaz e o lugar volta a ser
    plano provisório do convidado. Embaixo, "Você e Marina vão".
  */
  function guestOf(selection: TripPlaceSelection) {
    const suggestedBy = selection.addedBy !== YOU ? members.find((m) => m.id === selection.addedBy) : undefined;
    const wanters = wantersOf(selection, members);
    const guests = wanters.filter((m) => m.id !== YOU);
    return { suggestedBy, wanters, guests };
  }

  function groupLine(selection: TripPlaceSelection) {
    const { wanters, guests } = guestOf(selection);
    const text = goersText(wanters);
    if (!text) return null;
    return (
      <p className={styles.groupLine}>
        <MemberAvatars members={guests} />
        <span>{text}</span>
      </p>
    );
  }

  /** ✓ da parada que um convidado também quer: sai do seu roteiro e volta a ser plano dele */
  function leavePlace(selection: TripPlaceSelection) {
    const { guests } = guestOf(selection);
    trip.toggleMyInterest(selection.id);
    show(
      `Saiu do seu roteiro. Continua como plano ${guests.length === 1 ? 'da' : 'de'} ${joinPt(guests.map((m) => m.shortName))}.`,
    );
  }

  /** "+" num plano do grupo: vira parada sua e entra na divisão por proximidade */
  function joinPlan(selection: TripPlaceSelection) {
    trip.toggleMyInterest(selection.id);
    show('Lugar adicionado ao seu roteiro');
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
          {/* abas de cidade + busca presas no topo juntas (ajustes-87, regra do ajustes-85) */}
          <div className={styles.stickyBar}>
            <DestinationTabs
              name={DESTINATION_TABS_NAME}
              label="Destino"
              destinations={trip.destinations}
              value={activeDestinationId}
              onChange={handleActiveDestinationChange}
            />
            {activeDestination && <PlaceSearchBar destination={activeDestination} onToast={show} />}
          </div>

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
          {/* planos dos convidados como referência no dia (ajustes-95b): só aparece quando existe algum */}
          {hasGroupPlans && (
            <Switch label="Mostrar planos do grupo" checked={showGroupPlans} onChange={setShowGroupPlans} />
          )}

          {/*
            Faixa presa no topo (ajustes-88, regra do ajustes-85): cidade (no Mapa) + pílulas de data,
            com o Lista/Mapa em ícone na ponta direita da linha das pílulas. As abas Sugestões ·
            Roteiro · Dicas rolam com a página, pra não comer metade da tela.
          */}
          <div className={styles.stickyBar}>
            {/* abas de cidade com "Todas" (ajustes-95), presas junto com as pílulas, na Lista e no Mapa */}
            <DestinationTabs
              name={ROTEIRO_CITY_TABS_NAME}
              label="Cidade do roteiro"
              destinations={trip.destinations}
              value={roteiroCity}
              onChange={handleRoteiroCityChange}
              allLabel="Todas"
            />
            <div className={styles.pillsRow}>
              <div className={styles.pillsSlot}>
                {tripStartISO && visibleDays.length > 1 && (
                  <Tabs
                    name="itinerary-day"
                    label="Dia do roteiro"
                    variant="pill-date"
                    items={[
                      { value: 'all', label: 'Todos os dias' },
                      ...visibleDays.map((globalDay) => {
                        const { monthAbbrev, day } = formatISOToDayPill(globalDayToISO(tripStartISO, globalDay));
                        // a pílula de hoje diz "Hoje" no lugar do mês (ajustes-94)
                        const isToday = today?.globalDay === globalDay;
                        return {
                          value: String(globalDay),
                          label: `${isToday ? 'Hoje, ' : ''}${formatISOToWeekdayDisplay(globalDayToISO(tripStartISO, globalDay))}`,
                          pillTop: isToday ? 'Hoje' : monthAbbrev,
                          pillBottom: day,
                        };
                      }),
                    ]}
                    value={activeDayFilter === 'all' ? 'all' : String(activeDayFilter)}
                    onChange={(v) => setDayFilter(v === 'all' ? 'all' : Number(v))}
                  />
                )}
              </div>
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
            </div>
          </div>

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
                  <RouteMap
                    cityLabel={roteiroDestination?.city ?? 'esta viagem'}
                    pins={filteredMapPins}
                    missingCount={mapMissingCount}
                    routeByDay
                  />
                </div>
              )}

              {roteiroView === 'lista' && (
                <div
                  role="tabpanel"
                  id={`${ROTEIRO_VIEW_TABS_NAME}-panel-lista`}
                  aria-labelledby={`${ROTEIRO_VIEW_TABS_NAME}-tab-lista`}
                  className={styles.viewPanel}
                >
                  {trip.selectedPlaces.some(isMyPlace) && (
                    <p className="m-0 flex items-start gap-2 text-(length:--text-sm) text-muted-foreground">
                      <Icon icon={Route} className="mt-0.5" />
                      Organizamos os dias juntando os lugares que ficam perto. Você pode mover o que quiser.
                    </p>
                  )}

                  <ul className={styles.dayList}>
                    {visibleDays
                      .filter((globalDay) => activeDayFilter === 'all' || globalDay === activeDayFilter)
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
                            </li>
                            </Card>
                          );
                        }

                        const localDay = range.globalDayIndexes.indexOf(globalDay);
                        const assignments = assignmentsByDestination.get(range.destinationId) ?? [];
                        const dayItems = assignments.filter((a) => a.localDayIndex === localDay);
                        const active = dayItems.filter((a) => !a.skipped);
                        const skipped = dayItems.filter((a) => a.skipped);
                        const neighborhoods = dayNeighborhoods(active);
                        const dayPlans = showGroupPlans
                          ? (plansByDestination.get(range.destinationId)?.get(localDay) ?? [])
                          : [];
                        // Agenda entra pela data (evento, voo, check-in…), mesmo num dia de fronteira
                        // que o roteiro atribui ao destino seguinte (ex.: Feira de San Telmo no 22/11).
                        const dayAgenda = agenda.filter((a) => a.dateISO === dateISO);
                        // dia de fronteira (ajustes-94): continua contando pra cidade de chegada, mas o
                        // cabeçalho diz de onde se sai — "Buenos Aires → Santiago"
                        const leaving = trip.destinations.find(
                          (d) => d.id !== range.destinationId && d.dateEnd === dateISO && d.dateStart !== dateISO,
                        );

                        return (
                          <Card asChild className="px-4">
                          <li key={`${range.destinationId}-${localDay}`} className={styles.dayCard}>
                            <div className={styles.dayHeader}>
                              <h3 className={styles.dayTitle}>
                                <Icon icon={CalendarDays} />{' '}
                                {formatISOToLongWeekday(dateISO)}
                                {/* bairro(s) onde o dia se concentra (ajustes-80) */}
                                {neighborhoods && <span className="font-normal"> · {neighborhoods}</span>}
                              </h3>
                              <span className={styles.daySubtitle}>
                                <Icon icon={MapPin} />{' '}
                                {leaving ? `${leaving.city} → ${range.city}` : range.city} · Dia {globalDay + 1} de{' '}
                                {totalDays}
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
                                      }, true);
                                      const guest = guestOf(assignment.place);
                                      return (
                                        <TimelineStop
                                          key={assignment.place.id}
                                          guestTag={
                                            guest.guests.length > 0 && (
                                              <span className={styles.stopGuest}>
                                                {guest.suggestedBy && <MemberTag member={guest.suggestedBy} />}
                                                <JoinButton
                                                  joined
                                                  label={`Você vai a ${placeLabel(assignment.place)}. Tocar pra desfazer`}
                                                  onClick={() => leavePlace(assignment.place)}
                                                />
                                              </span>
                                            )
                                          }
                                          orderLabel={`Parada ${index + 1}`}
                                          title={placeLabel(assignment.place)}
                                          tags={
                                        <>
                                          <CategoryTags tags={tags} />
                                          {openDaysLine(place, dateISO)}
                                          {groupLine(assignment.place)}
                                        </>
                                      }
                                          description={place?.description}
                                          photoSearchTitle={place ? (place.wikiTitle ?? place.name) : undefined}
                                          photoUrl={placePhotoUrl(place) ?? undefined}
                                          fallbackIcon={placeIllustrationIcon(place?.categories)}
                                          skipped={assignment.skipped}
                                          isLast={index === dayItems.length - 1}
                                          photos={stopParts.thumbs}
                                          isNew={trip.unseenUpdates.roteiro.includes(assignment.place.id)}
                                          {...stopControls({
                                            assignment,
                                            range,
                                            dateISO,
                                            place,
                                            photoButton: stopParts.button,
                                          })}
                                        />
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>

                              {/* planos dos convidados nesse dia: só referência, o "+" traz pro seu roteiro (ajustes-95b) */}
                              {dayPlans.length > 0 && (
                                <div className={styles.dayBlock}>
                                  <h4 className={styles.blockLabel}>
                                    <Icon icon={Users} />{' '}Planos do grupo
                                  </h4>
                                  <ul className={styles.planList}>
                                    {dayPlans.map((plan) => (
                                      <GroupPlanCard
                                        key={plan.id}
                                        place={plan.placeId ? getPlaceById(plan.placeId) : undefined}
                                        title={placeLabel(plan)}
                                        wanters={wantersOf(plan, members)}
                                        onJoin={() => joinPlan(plan)}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </li>
                          </Card>
                        );
                      })}

                    {activeDayFilter === 'all' && !roteiroDestination && agendaOutsideTrip.length > 0 && (
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
