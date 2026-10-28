import {
  CalendarDays,
  CalendarX,
  Camera,
  ChevronRight,
  Lightbulb,
  List,
  Map as MapIcon,
  MapPin,
  Pencil,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  Route,
  SkipForward,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { shortCityLabel } from '../utils/cityLabel';
import { SuggestionCard } from '../components/shell/SuggestionCard';
import { Tabs } from '../components/shell/Tabs';
import { EmptyTripState } from '../components/shell/EmptyTripState';
import { RouteMap, type RouteMapPin } from '../components/itinerary/RouteMap';
import { TimelineStop } from '../components/itinerary/TimelineStop';
import { AgendaRow } from '../components/itinerary/AgendaRow';
import { MemberAvatars } from '../components/shell/MemberAvatars';
import { JoinButton } from '../components/shell/JoinButton';
import { GroupPlanCard } from '../components/itinerary/GroupPlanCard';
import { goersText, wantersOf } from '../utils/members';
import { MemberTag } from '../components/shell/MemberTag';
import { YOU, activeMembers, getMembers } from '../utils/costs';
import { joinPt } from '../utils/retrospective';
import { CategoryTags } from '../components/suggestions/CategoryTags';
import { GuestChoicesList, type GuestChoice } from '../components/suggestions/GuestChoicesList';
import { AddPlacesSheet } from '../components/itinerary/AddPlacesSheet';
import { FloatingActionButton } from '../components/shell/FloatingActionButton';
import { focusCard } from '../utils/focusCard';
import {
  INTEREST_LABELS,
  getEventById,
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
  selectionCoords,
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

const ROTEIRO_VIEW_TABS_NAME = 'itinerary-roteiro-view';
/** bloco "Sugestões dos convidados" (ajustes-100): as Novidades da Início rolam até ele */
const GUEST_SUGGESTIONS_ID = 'sugestoes-convidados';

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
 * Lugares escritos à mão (sem placeId nem coordenada) ficam de fora do mapa, só na lista; o lugar
 * do OpenStreetMap (ajustes-97) entra com a coordenada e o endereço dele. Eventos escolhidos com lat/lng entram como pin no dia
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
    const coords = selectionCoords(a.place);
    if (!coords) {
      missingCount++;
      continue;
    }
    pins.push({
      id: a.place.id,
      name: place?.name ?? placeLabel(a.place),
      neighborhood: place?.neighborhood ?? a.place.address ?? '',
      lat: coords.lat,
      lng: coords.lng,
      dayNumber: range.globalDayIndexes[a.localDayIndex] + 1,
      dayLabel: tripStartISO ? mapDayLabel(globalDayToISO(tripStartISO, range.globalDayIndexes[a.localDayIndex])) : undefined,
      skipped: a.skipped,
      colorIndex: a.localDayIndex,
      order,
      kind: 'place',
      photoTitle: place ? (place.wikiTitle ?? place.name) : placeLabel(a.place),
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

/** id da parada na Lista — o "Adicionar" rola até ela e pisca (ajustes-97) */
const stopId = (selectionId: string) => `parada-${selectionId}`;
/** id do plano provisório no dia — "Sugestões dos convidados" rola até ele (ajustes-100) */
const planId = (selectionId: string) => `plano-${selectionId}`;

/**
 * Estado de navegação que o Roteiro entende (ajustes-100, sem as sub-abas): cidade do select, dia das
 * pílulas, Lista | Mapa e `section: 'convidados'` pra chegar já no bloco dos convidados.
 */
export interface ItineraryNavState {
  destinationId?: string;
  dayISO?: string;
  view?: 'lista' | 'mapa';
  section?: 'convidados';
}

/**
 * Chips da parada: categorias do lugar do app; lugar que a pessoa trouxe por conta própria (escrito
 * à mão ou do OpenStreetMap, ajustes-97) leva o selo discreto "Adicionado por você".
 */
function stopTags(selection: TripPlaceSelection, place: PlaceEntry | undefined) {
  const toTag = (c: string) => ({ key: c, icon: categoryIcon(c), label: INTEREST_LABELS[c as QuizInterest] ?? c });
  if (place) return place.categories.map(toTag);
  const own = { key: 'own', icon: UserRound as LucideIcon, label: 'Adicionado por você' };
  return selection.category && selection.category !== 'lugar' ? [toTag(selection.category), own] : [own];
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
  // "Novidades na viagem" da Início (ajustes-89) abre na cidade das novidades, no bloco dos convidados;
  // "Ver o dia de hoje" (ajustes-94) abre na cidade e no dia de hoje; a tela de Dicas volta pra cá
  // com a cidade, o dia e a visualização de antes (ajustes-100)
  const navState = (useLocation().state as ItineraryNavState | null) ?? {};
  // "Simular: durante a viagem" (ajustes-94): o Roteiro abre no dia de hoje, na cidade de hoje
  const today = getTripToday(trip.destinations, trip.simulatedTodayISO);
  // ajustes-89: lugares dos convidados são novidade até a pessoa sair do Roteiro
  useMarkSectionSeen('roteiro');
  // "N lugares sugeridos em Buenos Aires" (ajustes-94) chega direto em "Sugestões dos convidados"
  useEffect(() => {
    if (navState.section !== 'convidados') return;
    requestAnimationFrame(() =>
      document.getElementById(GUEST_SUGGESTIONS_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
    // só na chegada à tela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [roteiroView, setRoteiroView] = useState<'lista' | 'mapa'>(navState.view ?? 'lista');
  /*
    Tela única (ajustes-100; cidade + dia do ajustes-95): cidade do select ('all' = Todas as cidades)
    + dia (índice global), os mesmos na Lista, no Mapa, no bloco dos convidados e na folha
    "Adicionar". Com a viagem "acontecendo", abre na cidade e no dia de hoje.
  */
  const [roteiroCity, setRoteiroCity] = useState<string>(() =>
    navState.destinationId && trip.destinations.some((d) => d.id === navState.destinationId)
      ? navState.destinationId
      : (today?.destinationId ?? 'all'),
  );
  const [dayFilter, setDayFilter] = useState<'all' | number>(() => {
    const startISO = getTripStartISO(trip.destinations);
    if (navState.dayISO && startISO) return daysBetween(startISO, navState.dayISO) - 1;
    return today ? today.globalDay : 'all';
  });
  // plano que acabou de virar seu: a linha mostra o ✓ por um instante antes de sair do bloco (ajustes-100)
  const [justJoined, setJustJoined] = useState<string[]>([]);
  // parada com o formulário de gasto aberto (ajustes-88)
  const [expenseStopId, setExpenseStopId] = useState<string | null>(null);
  const { message, visible, show } = useSaveToast();
  // "Adicionar" (ajustes-97/100): a chave remonta a folha a cada abertura (começa limpa, no dia da tela)
  const [addSheet, setAddSheet] = useState<{ open: boolean; key: number; dayISO?: string | null; destinationId?: string }>({
    open: false,
    key: 0,
  });
  // parada pra rolar e piscar depois que a tela renderizar com ela
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingFocus) return;
    focusCard(pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus]);

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
                  onClick={() => navigate('/custos', { replace: true, state: { expenseId: e.id } })}
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
              <Button variant="secondary" className={styles.stopAction} aria-label={`Alterar ${label}: mudar de dia, deixar o app escolher ou marcar como pulei`}>
                <Icon icon={Pencil} /> Alterar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-52">
              {startISO && range.globalDayIndexes.length > 1 && (
                <>
                  <DropdownMenuLabel className="px-3 text-(length:--text-sm) text-muted-foreground">
                    Mudar de dia
                  </DropdownMenuLabel>
                  {/* mudar de dia FIXA o lugar no dia novo (ajustes-97) */}
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
                  {assignment.pinned && (
                    <DropdownMenuItem className={MENU_ITEM} onSelect={() => trip.unpinItineraryItem(assignment.place.id)}>
                      <Icon icon={PinOff} /> Deixar o app escolher o dia
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className={MENU_ITEM} onSelect={() => trip.toggleItinerarySkipped(assignment.place.id)}>
                <Icon icon={SkipForward} /> Pulei
              </DropdownMenuItem>
              {/* lugar só seu: sai do roteiro aqui (a seção "Adicionados" das Sugestões saiu no ajustes-97) */}
              {assignment.place.addedBy === YOU && assignment.place.alsoWantedBy.length === 0 && (
                <DropdownMenuItem className={MENU_ITEM} onSelect={() => trip.removeSelectedPlace(assignment.place.id)}>
                  <Icon icon={Trash2} /> Tirar do roteiro
                </DropdownMenuItem>
              )}
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

  const chosenEvents = selectedEvents(trip.selectedEventIds);
  const members = getMembers(trip);

  // --- Agenda do dia (ajustes-63): tudo com data/hora marcada, vindo da Central e dos eventos ---
  const agenda = buildAgenda(trip);
  const agendaOutsideTrip =
    tripStartISO && tripEndISO ? agenda.filter((a) => a.dateISO < tripStartISO || a.dateISO > tripEndISO) : [];

  function openAgendaItem(item: AgendaItem) {
    if (item.link.path === '/central') {
      navigate('/central', { replace: true, state: { tab: item.link.tab } });
      return;
    }
    // evento: as sugestões ficam na folha "Adicionar" (ajustes-100) — abre na cidade e no dia dele
    const { cityId, dateISO } = item;
    const destination = cityId ? trip.destinations.find((d) => cityIsInTripOn([d], cityId, dateISO)) : undefined;
    openAddSheet(dateISO, destination?.id);
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
            openHint={item.link.path === '/central' ? 'abrir na Central' : 'ver nas sugestões'}
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

  // --- cidade + dia (ajustes-95; no select desde o ajustes-100) ---
  const roteiroDestination = trip.destinations.find((d) => d.id === roteiroCity);
  // opções do select: as cidades na ordem das datas (sem data, no fim, na ordem do cadastro)
  const citiesByDate = [...trip.destinations].sort((a, b) =>
    a.dateStart && b.dateStart ? a.dateStart.localeCompare(b.dateStart) : a.dateStart ? -1 : b.dateStart ? 1 : 0,
  );
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

  // dia (yyyy-mm-dd) de cada parada no roteiro — "Já no seu roteiro" da folha e o bloco dos convidados
  const daysWithPlaces = new Map<string, string>();
  if (tripStartISO) {
    for (const range of dayRanges) {
      for (const a of assignmentsByDestination.get(range.destinationId) ?? []) {
        daysWithPlaces.set(a.place.id, globalDayToISO(tripStartISO, range.globalDayIndexes[a.localDayIndex]));
      }
    }
  }

  /*
    "Sugestões dos convidados" (ajustes-100), logo acima dos dias: os planos do grupo sem resposta da
    participante na cidade do select (em "Todas as cidades", em todas). "+" traz o lugar pro roteiro
    dela (regra do 95b) e a linha sai do bloco, depois de mostrar o ✓ por um instante; o resto da
    linha rola até o plano provisório no dia dele. O bloco some quando não sobra nenhum.
  */
  const guestScope = roteiroDestination ? dayRanges.filter((r) => r.destinationId === roteiroDestination.id) : dayRanges;
  const guestRows: { selection: TripPlaceSelection; place: PlaceEntry; globalDay: number }[] = [];
  for (const range of guestScope) {
    for (const [localDay, plans] of plansByDestination.get(range.destinationId) ?? []) {
      for (const plan of plans) {
        const place = plan.placeId ? getPlaceById(plan.placeId) : undefined;
        if (place) guestRows.push({ selection: plan, place, globalDay: range.globalDayIndexes[localDay] });
      }
    }
  }
  // os que acabaram de virar seus continuam na linha (com o ✓) até o tempo do justJoined passar
  for (const id of justJoined) {
    const selection = trip.selectedPlaces.find((s) => s.id === id);
    const place = selection?.placeId ? getPlaceById(selection.placeId) : undefined;
    if (!selection || !place || !guestScope.some((r) => r.destinationId === selection.destinationId)) continue;
    const at = daysWithPlacesOf(selection.id);
    guestRows.push({ selection, place, globalDay: at ?? -1 });
  }
  guestRows.sort((a, b) => a.globalDay - b.globalDay);
  const pendingGuestCount = guestRows.filter((r) => !isMyPlace(r.selection)).length;
  const guestChoices: GuestChoice[] = guestRows.map(({ selection, place }) => ({
    place,
    wanters: wantersOf(selection, members),
    mine: isMyPlace(selection),
    cardId: selection.id,
    suggestedBy: guestOf(selection).suggestedBy,
  }));

  function toggleGuestChoice(choice: GuestChoice) {
    const selection = trip.selectedPlaces.find((s) => s.id === choice.cardId);
    if (!selection) return;
    if (choice.mine) {
      // ✓ ainda na linha: desfaz na hora, volta a ser plano
      setJustJoined((prev) => prev.filter((id) => id !== selection.id));
      leavePlace(selection);
      return;
    }
    joinPlan(selection);
    setJustJoined((prev) => [...prev, selection.id]);
    setTimeout(() => setJustJoined((prev) => prev.filter((id) => id !== selection.id)), 900);
  }

  /** resto da linha: Lista, no dia do plano (se houver um dia escolhido nas pílulas), rola e pisca */
  function showGuestPlan(choice: GuestChoice) {
    const row = guestRows.find((r) => r.selection.id === choice.cardId);
    if (!row) return;
    setRoteiroView('lista');
    if (activeDayFilter !== 'all' && row.globalDay >= 0) setDayFilter(row.globalDay);
    setPendingFocus(isMyPlace(row.selection) ? stopId(row.selection.id) : planId(row.selection.id));
  }

  // --- "Adicionar" (ajustes-97/100) ---
  /** dia global (índice) em que a parada está no roteiro, ou null */
  function daysWithPlacesOf(selectionId: string): number | null {
    const iso = daysWithPlaces.get(selectionId);
    return iso && tripStartISO ? daysBetween(tripStartISO, iso) - 1 : null;
  }
  const selectedDayISO = tripStartISO && activeDayFilter !== 'all' ? globalDayToISO(tripStartISO, activeDayFilter) : null;
  // aba "Todas": a folha sugere a cidade do dia selecionado (ou a primeira com dias)
  const sheetFallbackDestination =
    (activeDayFilter !== 'all' && findRangeForGlobalDay(dayRanges, activeDayFilter)?.destinationId) ||
    dayRanges[0]?.destinationId ||
    '';

  /** abre a folha; dia e cidade vêm do "Ver sugestões" de um dia vazio ou de um evento da Agenda (senão, o dia das pílulas) */
  function openAddSheet(dayISO?: string, destinationId?: string) {
    setAddSheet((prev) => ({ open: true, key: prev.key + 1, dayISO: dayISO ?? selectedDayISO, destinationId }));
  }

  /** depois de adicionar ou de tocar em "Já no seu roteiro": Lista, no dia certo, rola e pisca */
  function showStop(selectionId: string, destinationId: string, dayISO: string | null) {
    setAddSheet((prev) => ({ ...prev, open: false }));
    setRoteiroView('lista');
    if (roteiroCity !== 'all' && roteiroCity !== destinationId) setRoteiroCity(destinationId);
    if (dayFilter !== 'all') {
      // com um dia escolhido nas pílulas, vai pro dia do lugar; "o app escolhe" → todos os dias
      setDayFilter(dayISO && tripStartISO ? daysBetween(tripStartISO, dayISO) - 1 : 'all');
    }
    setPendingFocus(stopId(selectionId));
  }

  /**
    "Dicas" (ajustes-100): tela própria da cidade. Antes de empilhar, guarda cidade, dia e Lista | Mapa
    no state desta entrada do histórico — o voltar (da AppBar ou o deslize do Safari) reabre igual.
  */
  function openTips(destinationId: string) {
    const state: ItineraryNavState = { destinationId, view: roteiroView, ...(selectedDayISO ? { dayISO: selectedDayISO } : {}) };
    navigate('/roteiro', { replace: true, state });
    navigate(`/roteiro/dicas/${destinationId}`);
  }

  return (
    <ScreenShell
      appBar={<AppBar title="Roteiro da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={bottomNav}
      toast={<SaveToast visible={visible} message={message} />}
      fab={
        // "+ Adicionar" (ajustes-100; era "Adicionar lugares", ajustes-97): o único caminho pra pôr algo no roteiro
        tripStartISO && dayRanges.length > 0 ? (
          <FloatingActionButton icon={Plus} label="Adicionar" onClick={() => openAddSheet()} raised={visible} />
        ) : undefined
      }
    >
      {/*
        Tela única (ajustes-100, substitui as sub-abas Roteiro · Sugestões do app · Dicas locais dos
        ajustes 95 e 97). De cima pra baixo: cidade + Dicas e Lista | Mapa presos no topo (regra do
        ajustes-85) → pílulas de data (rolam com a página) → Sugestões dos convidados → dias.
      */}
      <div className={styles.viewPanel}>
        <div className={styles.stickyBar}>
          <div className="flex items-center gap-2">
            {/* select da cidade (ajustes-100): 48px, pino + nome + chevron; 16px de fonte (global.css) */}
            <div className="relative min-w-0 flex-1">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 text-(--accent-dark)"
                aria-hidden="true"
              />
              <NativeSelect
                className="w-full"
                selectClassName="h-12 truncate rounded-md bg-background pr-9 pl-10 text-(length:--text-base) font-semibold text-foreground focus-visible:ring-0"
                aria-label="Cidade do roteiro"
                value={roteiroCity}
                onChange={(e) => handleRoteiroCityChange(e.target.value)}
              >
                <NativeSelectOption value="all">Todas as cidades</NativeSelectOption>
                {citiesByDate.map((d) => (
                  <NativeSelectOption key={d.id} value={d.id}>
                    {shortCityLabel(d.city)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {/* Dicas locais da cidade, em tela própria; some em "Todas as cidades" */}
            {roteiroDestination && (
              <Button
                variant="secondary"
                className="h-12 shrink-0"
                onClick={() => openTips(roteiroDestination.id)}
                aria-label={`Dicas locais de ${roteiroDestination.city}`}
              >
                <Icon icon={Lightbulb} /> Dicas
              </Button>
            )}
          </div>
          <Tabs
            name={ROTEIRO_VIEW_TABS_NAME}
            label="Visualização do roteiro"
            variant="full"
            items={[
              { value: 'lista', label: 'Lista', icon: List },
              { value: 'mapa', label: 'Mapa', icon: MapIcon },
            ]}
            value={roteiroView}
            onChange={(v) => setRoteiroView(v as 'lista' | 'mapa')}
          />
        </div>

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

        {/* Sugestões dos convidados (ajustes-100): só com plano sem resposta na cidade do select */}
        {guestChoices.length > 0 && (
          <Card asChild className="gap-3 px-4">
            <section id={GUEST_SUGGESTIONS_ID} aria-labelledby={`${GUEST_SUGGESTIONS_ID}-titulo`}>
              <h3 id={`${GUEST_SUGGESTIONS_ID}-titulo`} className={styles.guestTitle}>
                <Icon icon={Users} /> Sugestões dos convidados · {pendingGuestCount}
              </h3>
              <GuestChoicesList
                choices={guestChoices}
                onOpen={(id) => {
                  const choice = guestChoices.find((c) => c.cardId === id);
                  if (choice) showGuestPlan(choice);
                }}
                onToggleMine={toggleGuestChoice}
              />
            </section>
          </Card>
        )}

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
                    Organizamos os dias juntando os lugares que ficam perto. O que você fixou num dia (alfinete) não sai de lá.
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
                                <h4 className={styles.blockLabel}>Agenda do dia</h4>
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
                      // planos do grupo sempre visíveis no fim do dia (28/out/2026: saiu o interruptor "Mostrar planos do grupo")
                      const dayPlans = plansByDestination.get(range.destinationId)?.get(localDay) ?? [];
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
                                <h4 className={styles.blockLabel}>Agenda do dia</h4>
                                {renderAgenda(dayAgenda)}
                              </div>
                            )}

                            <div className={styles.dayBlock}>
                              <h4 className={styles.blockLabel}>Lugares</h4>
                              {dayItems.length === 0 ? (
                                // dia vazio (ajustes-100): a folha "Adicionar" já nesse dia, com as sugestões da cidade
                                <div className={styles.emptyDay}>
                                  <p className="m-0">Ainda nada por aqui</p>
                                  <Button
                                    variant="secondary"
                                    className="self-start"
                                    onClick={() => openAddSheet(dateISO, range.destinationId)}
                                    aria-label={`Ver sugestões pra ${range.city}`}
                                  >
                                    Ver sugestões pra {shortCityLabel(range.city)}
                                  </Button>
                                </div>
                              ) : (
                                <ul className={styles.timelineList}>
                                  {[...active, ...skipped].map((assignment, index) => {
                                    const place = assignment.place.placeId
                                      ? getPlaceById(assignment.place.placeId)
                                      : undefined;
                                    const tags = stopTags(assignment.place, place);
                                    const isOsm = assignment.place.source === 'osm';
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
                                        id={stopId(assignment.place.id)}
                                        titleAdornment={
                                          assignment.pinned && (
                                            <span className={styles.pinned} role="img" aria-label="Fixado neste dia">
                                              <Icon icon={Pin} />
                                            </span>
                                          )
                                        }
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
                                        description={place?.description ?? assignment.place.address}
                                        photoSearchTitle={
                                          place ? (place.wikiTitle ?? place.name) : isOsm ? placeLabel(assignment.place) : undefined
                                        }
                                        photoUrl={placePhotoUrl(place) ?? undefined}
                                        fallbackIcon={placeIllustrationIcon(place?.categories ?? (isOsm ? assignment.place.categories : undefined))}
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
                                      id={planId(plan.id)}
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

        {isRoteiroComplete(trip) && trip.companions.length === 0 && (
          <SuggestionCard
            message="Já tem lugares escolhidos. Quer convidar alguém pra essa viagem?"
            actionLabel="Convidar companheiros"
            to="/convidar"
            storageKey="convidar-companheiros"
          />
        )}

        {/* espaço no fim pro botão flutuante não cobrir o último item (ajustes-97) */}
        <div className={styles.fabSpace} aria-hidden="true" />

        {tripStartISO && dayRanges.length > 0 && (
          <AddPlacesSheet
            key={addSheet.key}
            open={addSheet.open}
            onOpenChange={(open) => setAddSheet((prev) => ({ ...prev, open }))}
            destinations={trip.destinations.filter((d) => dayRanges.some((r) => r.destinationId === d.id))}
            dayRanges={dayRanges}
            tripStartISO={tripStartISO}
            cityId={
              // o dia vazio e o evento da Agenda mandam a cidade deles (ajustes-100)
              addSheet.destinationId ??
              (roteiroDestination && dayRanges.some((r) => r.destinationId === roteiroDestination.id) ? roteiroDestination.id : null)
            }
            fallbackDestinationId={addSheet.destinationId ?? sheetFallbackDestination}
            selectedDayISO={addSheet.dayISO ?? null}
            dayOfSelection={(id) => daysWithPlaces.get(id) ?? null}
            onAdded={(id, destinationId, dayISO) => {
              showStop(id, destinationId, dayISO);
              show('Salvo');
            }}
            onGoTo={(id, destinationId) => showStop(id, destinationId, daysWithPlaces.get(id) ?? null)}
            onToast={show}
          />
        )}
    </div>

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
