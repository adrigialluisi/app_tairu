import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { findMockCompanion } from '../data/mockCompanions';
import {
  MOCK_EXPENSE_PREFIX,
  applyMockContributions,
  mockExpenseKey,
  mockPlaceKey,
  placesWantedBy,
} from '../utils/mockContributions';
import { computeUnpinnedLocalDay, splitDaysByDestination } from '../utils/itinerary';

export interface TripDestination {
  /** id único desta seleção (permite o mesmo destino em teoria, cada chip é independente) */
  id: string;
  cityId: string;
  city: string;
  country: string;
  currencyCode: string;
  /** estadia nesse destino específico — não existe mais data solta de nível viagem */
  dateStart: string | null;
  dateEnd: string | null;
}

export interface TripCompanion {
  id: string;
  email: string;
  /**
   * 'entrou' só acontece com os dois convidados do cenário fixo
   * (src/data/mockCompanions.ts, SIMULAÇÃO — ajustes-67); qualquer outro
   * e-mail fica em 'convite-enviado'.
   */
  status: 'convite-enviado' | 'entrou';
  /** só preenchido quando é um convidado simulado do cenário */
  name?: string;
  initials?: string;
}

export interface TripPlaceSelection {
  id: string;
  /** TripDestination.id — por destino da viagem, não por cidade genérica */
  destinationId: string;
  /** referência a places.json, ou null se for customLabel */
  placeId: string | null;
  /** preenchido só quando placeId é null */
  customLabel: string | null;
  /** copiado do places.json no momento da seleção, ou [] se customLabel */
  categories: string[];
  /** quem adicionou: 'voce' ou TripCompanion.id */
  addedBy: MemberId;
  /** outros membros que também querem ir */
  alsoWantedBy: MemberId[];
}

export interface ItineraryOverride {
  placeSelectionId: string;
  /** índice do dia dentro da cidade daquele lugar (0-based) */
  dayIndex: number;
  skipped: boolean;
}

export type TransportType = 'voo' | 'onibus' | 'trem' | 'carro-locado';

interface TransportItemBase {
  id: string;
  /** TripDestination.id — a qual trecho da viagem esse transporte pertence */
  destinationId: string;
  /** nunca exibido no card/resumo — só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  /** preparado pra Fase 3 (upload de voucher) — sempre null nessa fase */
  voucherFileName: string | null;
}

export interface FlightTransportItem extends TransportItemBase {
  type: 'voo';
  company: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
}

export interface BusTransportItem extends TransportItemBase {
  type: 'onibus';
  company: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
}

export interface TrainTransportItem extends TransportItemBase {
  type: 'trem';
  /** operadora, ex.: Tren de la Costa, Renfe, Trenitalia */
  company: string;
  /** número do trem ou nome da linha/ramal */
  trainNumber: string;
  /** estação de embarque */
  origin: string;
  /** estação de desembarque */
  destination: string;
  departureAt: string;
  arrivalAt: string;
  /** "Turista", "Primeira", "Executiva"… (opcional) */
  travelClass: string;
  /** texto livre: "Vagão 2 · assento 14" (opcional) */
  seat: string;
  bookingCode: string;
}

export interface CarRentalTransportItem extends TransportItemBase {
  type: 'carro-locado';
  company: string;
  vehicleCategory: string;
  pickupLocation: string;
  pickupAt: string;
  dropoffLocation: string;
  dropoffAt: string;
}

export type TransportItem =
  | FlightTransportItem
  | BusTransportItem
  | TrainTransportItem
  | CarRentalTransportItem;

export type StayType = 'hotel' | 'apartamento' | 'hostel' | 'pousada';

export interface StayItem {
  id: string;
  /** TripDestination.id: a qual trecho da viagem essa estadia pertence */
  destinationId: string;
  type: StayType;
  /** referência a hotels.json quando a pessoa escolheu da busca; null se digitou livre */
  hotelId: string | null;
  name: string;
  address: string;
  /** cidade onde a hospedagem fica de fato (pode ser vizinha ao destino, ex.: Viña del Mar) */
  locality: string;
  /** ISO yyyy-mm-dd, igual as datas de TripDestination */
  checkInDate: string | null;
  checkOutDate: string | null;
  /** "hh:mm" ou "" (opcional) */
  checkInTime: string;
  checkOutTime: string;
  confirmationCode: string;
  roomType: string;
  /** nunca exibido no card/resumo, só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  voucherFileName: string | null;
}

export type OtherItemType = 'seguro' | 'passeio' | 'ingresso';

export interface Attachment {
  id: string;
  fileName: string;
  /** URL.createObjectURL(file) — só vale enquanto o app está aberto */
  url: string;
  /** tipo do arquivo (File.type) — imagem vira miniatura em Documentos (ajustes-84); ausente nos anexos antigos */
  mimeType?: string;
}

export interface OtherItem {
  id: string;
  type: OtherItemType;
  /** null = viagem toda; senão TripDestination.id */
  destinationId: string | null;
  /** nome do passeio ou do evento (em Seguro, o nome do plano) */
  title: string;
  /** seguradora ou agência */
  provider: string;
  /** nº da apólice, código da reserva, localizador */
  referenceCode: string;
  /** período (seguro) ou dia do passeio/evento (só startDate) — ISO yyyy-mm-dd */
  startDate: string | null;
  endDate: string | null;
  /** "hh:mm" ou "" — passeio e ingresso */
  time: string;
  /** ponto de encontro (passeio) ou local (ingresso) */
  location: string;
  /** telefone da central 24h — só seguro */
  emergencyPhone: string;
  notes: string;
  /** nunca exibido no card, só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  attachments: Attachment[];
}

export type ExpenseCategory = 'transporte' | 'hospedagem' | 'alimentacao' | 'passeios' | 'compras' | 'outros';

/** 'voce' = a pessoa usando o app; senão TripCompanion.id */
export type MemberId = string;

export interface Expense {
  id: string;
  description: string;
  /** texto como digitado; converter com parseAmount (src/utils/money.ts) */
  amount: string;
  currencyCode: string;
  /** TripDestination.id, ou null = outro lugar / viagem toda */
  destinationId: string | null;
  category: ExpenseCategory;
  paidBy: MemberId;
  /** null = dividir entre todos os membros atuais (inclui quem for convidado depois) */
  splitWith: MemberId[] | null;
  /** ISO yyyy-mm-dd ou null */
  date: string | null;
  attachments: Attachment[];
}

/** Só quem pagou/divide pode mudar nos custos que vêm da Central; valor e moeda continuam sendo editados lá. */
export interface CentralCostOverride {
  /** id do TransportItem / StayItem / OtherItem */
  sourceId: string;
  paidBy: MemberId;
  splitWith: MemberId[] | null;
}

/** Foto da viagem (Memórias, ajustes-64) — em memória via URL.createObjectURL, como os anexos. */
export interface TripPhoto {
  id: string;
  /** URL.createObjectURL(file) */
  url: string;
  fileName: string;
  /** data do arquivo (lastModified), ISO yyyy-mm-dd */
  fileDateISO: string;
  /** dia da viagem atribuído (automático ou escolhido); null = sem dia */
  dayISO: string | null;
  /** true se a pessoa escolheu o dia na mão */
  dayManual: boolean;
  /**
   * rótulo do lugar: o texto livre de "Outro", ou o nome do lugar/evento ligado
   * (guardado pra continuar mostrando o nome se o vínculo cair). Com
   * placeSelectionId/eventId, a tela mostra o nome ATUAL do lugar/evento.
   */
  placeLabel: string | null;
  /** parada do roteiro a que a foto pertence: TripPlaceSelection.id; null = sem lugar ligado (ajustes-75) */
  placeSelectionId: string | null;
  /** evento escolhido a que a foto pertence: EventEntry.id; null = nenhum (ajustes-75) */
  eventId: string | null;
  caption: string;
  /** destaque: usado pela Retrospectiva (ajuste 65) */
  favorite: boolean;
}

export type RetroCardKind = 'capa' | 'numeros' | 'cidade' | 'destaques' | 'fecho';

/** Card da Retrospectiva (Memórias, ajustes-65) — montado com frases-modelo e dados reais, editável. */
export interface RetroCard {
  id: string;
  kind: RetroCardKind;
  title: string;
  text: string;
  /** TripPhoto.id da foto principal do card (capa e cidade); null = sem foto */
  photoId: string | null;
  /** só no kind 'cidade' */
  destinationId?: string;
  hidden: boolean;
}

export interface Retrospective {
  generatedAtISO: string;
  showCosts: boolean;
  /** a ordem do array é a ordem de exibição */
  cards: RetroCard[];
}

export type QuizDiscovery = 'turistico' | 'equilibrado' | 'fora-do-circuito';
export type QuizRhythm = 'tranquilo' | 'moderado' | 'corrido';
export type QuizBudget = 'economico' | 'moderado' | 'confortavel';
export type QuizInterest = 'gastronomia' | 'cultura' | 'natureza' | 'vida-noturna' | 'compras';
export type QuizKnowsDestination = 'sim' | 'nao';
export type QuizCompanionType = 'sozinho' | 'casal' | 'amigos' | 'familia' | 'com-criancas';

export interface QuizAnswers {
  /** múltipla escolha desde 11/set/2026 — ver docs/ajustes-18-pace-multi-select.md */
  discovery: QuizDiscovery[];
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  /** múltipla escolha desde 08/out/2026 (ex.: Família + Com crianças) */
  companionType: QuizCompanionType[];
  /** voltaram a ser gerais da viagem em 10/set/2026 — ver docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md */
  interests: QuizInterest[];
  knowsDestination: QuizKnowsDestination | null;
}

interface TripState {
  name: string;
  destinations: TripDestination[];
  companions: TripCompanion[];
  quiz: QuizAnswers;
  selectedPlaces: TripPlaceSelection[];
  itineraryOverrides: ItineraryOverride[];
  destinosSaved: boolean;
  perfilSaved: boolean;
  transportItems: TransportItem[];
  stayItems: StayItem[];
  otherItems: OtherItem[];
  /** eventos locais escolhidos (src/data/events.json) — data fixa, fora do selectedPlaces e da distribuição de dias */
  selectedEventIds: string[];
  /** Custos (ajustes-61): gastos lançados à mão, quem pagou/divide os custos da Central e transferências acertadas */
  expenses: Expense[];
  centralCostOverrides: CentralCostOverride[];
  /** `${from}->${to}:${amountBRL.toFixed(2)}` — se o valor mudar, a marcação deixa de valer */
  settledTransferKeys: string[];
  /** Memórias (ajustes-64) */
  photos: TripPhoto[];
  /** Retrospectiva (ajustes-65): null = ainda não gerada */
  retrospective: Retrospective | null;
  /** "Agora não" no convite da retrospectiva */
  retroDismissed: boolean;
  /**
   * quem entrou e depois foi removido da viagem (ajustes-83): sai de Convidados e das escolhas de
   * "quem pagou/dividir com", mas os lugares e gastos que trouxe continuam — e com o nome dela
   */
  formerCompanions: TripCompanion[];
  /** chaves de contribuições simuladas que a pessoa removeu — nunca recriar (ajustes-67) */
  dismissedMockKeys: string[];
  /** aviso "Marina Duarte entrou na viagem…" (seq muda a cada entrada, pra tela mostrar o toast) */
  companionJoinNotice: { seq: number; message: string } | null;
}

export interface TripContextValue extends TripState {
  setName: (name: string) => void;
  addDestination: (destination: Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>) => void;
  removeDestination: (id: string) => void;
  setDestinationCurrency: (id: string, currencyCode: string) => void;
  setDestinationDateRange: (id: string, start: string | null, end: string | null) => void;
  addCompanion: (email: string) => void;
  /** cancela um convite pendente ou remove da viagem quem entrou (os lugares e gastos dele ficam) */
  removeCompanion: (id: string) => void;
  /** "Corrigir e-mail" de um convite pendente (ajustes-83) */
  updateCompanionEmail: (id: string, email: string) => void;
  setQuizAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  toggleQuizDiscovery: (discovery: QuizDiscovery) => void;
  toggleQuizInterest: (interest: QuizInterest) => void;
  toggleQuizCompanionType: (value: QuizCompanionType) => void;
  togglePlace: (destinationId: string, place: { placeId: string; categories: string[] }) => void;
  addCustomPlace: (destinationId: string, label: string) => void;
  removeSelectedPlace: (id: string) => void;
  moveItineraryItem: (placeSelectionId: string, newDayIndex: number) => void;
  toggleItinerarySkipped: (placeSelectionId: string) => void;
  setDestinosSaved: (value: boolean) => void;
  setPerfilSaved: (value: boolean) => void;
  saveTransportItem: (item: TransportItem) => void;
  removeTransportItem: (id: string) => void;
  saveStayItem: (item: StayItem) => void;
  removeStayItem: (id: string) => void;
  saveOtherItem: (item: OtherItem) => void;
  removeOtherItem: (id: string) => void;
  toggleEvent: (eventId: string) => void;
  saveExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  saveCentralCostOverride: (override: CentralCostOverride) => void;
  toggleSettledTransfer: (key: string) => void;
  addPhotos: (photos: TripPhoto[]) => void;
  updatePhoto: (photo: TripPhoto) => void;
  removePhoto: (id: string) => void;
  setRetrospective: (retrospective: Retrospective | null) => void;
  updateRetroCard: (card: RetroCard) => void;
  moveRetroCard: (id: string, direction: -1 | 1) => void;
  setRetroShowCosts: (value: boolean) => void;
  setRetroDismissed: (value: boolean) => void;
  resetTrip: () => void;
}

const initialQuiz: QuizAnswers = {
  discovery: [],
  rhythm: null,
  budget: null,
  companionType: [],
  interests: [],
  knowsDestination: null,
};

const TripContext = createContext<TripContextValue | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [companions, setCompanions] = useState<TripCompanion[]>([]);
  const [quiz, setQuiz] = useState<QuizAnswers>(initialQuiz);
  const [selectedPlaces, setSelectedPlaces] = useState<TripPlaceSelection[]>([]);
  const [itineraryOverrides, setItineraryOverrides] = useState<ItineraryOverride[]>([]);
  const [destinosSaved, setDestinosSaved] = useState(false);
  const [perfilSaved, setPerfilSaved] = useState(false);
  const [transportItems, setTransportItems] = useState<TransportItem[]>([]);
  const [stayItems, setStayItems] = useState<StayItem[]>([]);
  const [otherItems, setOtherItems] = useState<OtherItem[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [centralCostOverrides, setCentralCostOverrides] = useState<CentralCostOverride[]>([]);
  const [settledTransferKeys, setSettledTransferKeys] = useState<string[]>([]);
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [retrospective, setRetrospective] = useState<Retrospective | null>(null);
  const [retroDismissed, setRetroDismissed] = useState(false);
  const [formerCompanions, setFormerCompanions] = useState<TripCompanion[]>([]);
  const [dismissedMockKeys, setDismissedMockKeys] = useState<string[]>([]);
  const [companionJoinNotice, setCompanionJoinNotice] = useState<{ seq: number; message: string } | null>(null);
  // SIMULAÇÃO (ajustes-67): timers de "entrada" dos convidados do cenário e quem já foi anunciado
  const joinTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const announcedJoins = useRef(new Set<string>());

  function clearJoinTimer(id: string) {
    const timer = joinTimers.current.get(id);
    if (timer) clearTimeout(timer);
    joinTimers.current.delete(id);
  }

  /** SIMULAÇÃO: só os convidados do cenário fixo "entram" (2,5 s depois); o resto fica em "Convite enviado" */
  function scheduleMockJoin(id: string, email: string) {
    const profile = findMockCompanion(email);
    if (!profile) return;
    const timer = setTimeout(() => {
      joinTimers.current.delete(id);
      setCompanions((prev) =>
        prev.map((c) =>
          c.id === id && c.status === 'convite-enviado'
            ? { ...c, status: 'entrou', name: profile.name, initials: profile.initials }
            : c,
        ),
      );
    }, 2500);
    joinTimers.current.set(id, timer);
  }

  function dismissMockKeys(keys: string[]) {
    if (keys.length === 0) return;
    setDismissedMockKeys((prev) => [...new Set([...prev, ...keys])]);
  }

  /** chaves pra não recriar um lugar removido que veio (ou também era querido) de convidado */
  function mockKeysForSelection(sel: TripPlaceSelection | undefined): string[] {
    if (!sel || !sel.placeId) return [];
    const members = [sel.addedBy, ...sel.alsoWantedBy].filter((m) => m !== 'voce');
    return members.map((m) => mockPlaceKey(m, sel.placeId as string));
  }

  // Aplica as contribuições simuladas na entrada e sempre que destinos/convidados mudam (idempotente).
  useEffect(() => {
    const result = applyMockContributions({ destinations, companions, selectedPlaces, expenses, dismissedMockKeys });
    if (result.changed) {
      setSelectedPlaces(result.selectedPlaces);
      setExpenses(result.expenses);
    }
    for (const c of companions) {
      if (c.status !== 'entrou' || announcedJoins.current.has(c.id)) continue;
      announcedJoins.current.add(c.id);
      const n = placesWantedBy(result.selectedPlaces, c.id);
      setCompanionJoinNotice((prev) => ({
        seq: (prev?.seq ?? 0) + 1,
        message:
          n > 0
            ? `${c.name ?? c.email} entrou na viagem e sugeriu ${n} ${n === 1 ? 'lugar' : 'lugares'}`
            : `${c.name ?? c.email} entrou na viagem`,
      }));
    }
    // só destinos e convidados disparam (spec); lugares/gastos/descartes são lidos do render atual
  }, [destinations, companions]);

  /*
    Lugar ou evento saiu do roteiro (desmarcado em Sugestões, removido da lista,
    convidado simulado saiu…): as fotos ligadas a ele NÃO somem — só o vínculo
    cai, e o rótulo (placeLabel) com o nome fica, então elas vão pra "Outras do
    dia" em Memórias (docs/ajustes-75-fotos-por-atracao.md, 4). Num lugar só
    pra cobrir todos os caminhos de remoção.
  */
  useEffect(() => {
    const placeIds = new Set(selectedPlaces.map((s) => s.id));
    const eventIds = new Set(selectedEventIds);
    setPhotos((prev) =>
      prev.some(
        (p) => (p.placeSelectionId && !placeIds.has(p.placeSelectionId)) || (p.eventId && !eventIds.has(p.eventId)),
      )
        ? prev.map((p) => ({
            ...p,
            placeSelectionId: p.placeSelectionId && placeIds.has(p.placeSelectionId) ? p.placeSelectionId : null,
            eventId: p.eventId && eventIds.has(p.eventId) ? p.eventId : null,
          }))
        : prev,
    );
  }, [selectedPlaces, selectedEventIds]);

  // limpa timers pendentes se o provider sair
  useEffect(() => {
    const timers = joinTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const value = useMemo<TripContextValue>(
    () => ({
      name,
      destinations,
      companions,
      quiz,
      selectedPlaces,
      itineraryOverrides,
      destinosSaved,
      perfilSaved,
      transportItems,
      stayItems,
      otherItems,
      selectedEventIds,
      expenses,
      centralCostOverrides,
      settledTransferKeys,
      photos,
      retrospective,
      retroDismissed,
      formerCompanions,
      dismissedMockKeys,
      companionJoinNotice,
      setName,
      addDestination: (destination) =>
        setDestinations((prev) => [
          ...prev,
          {
            ...destination,
            id: `${destination.cityId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dateStart: null,
            dateEnd: null,
          },
        ]),
      removeDestination: (id) => setDestinations((prev) => prev.filter((d) => d.id !== id)),
      setDestinationCurrency: (id, currencyCode) =>
        setDestinations((prev) => prev.map((d) => (d.id === id ? { ...d, currencyCode } : d))),
      setDestinationDateRange: (id, start, end) =>
        setDestinations((prev) => prev.map((d) => (d.id === id ? { ...d, dateStart: start, dateEnd: end } : d))),
      addCompanion: (email) => {
        const id = `${email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setCompanions((prev) => [...prev, { id, email, status: 'convite-enviado' }]);
        scheduleMockJoin(id, email);
      },
      updateCompanionEmail: (id, email) => {
        clearJoinTimer(id);
        setCompanions((prev) => prev.map((c) => (c.id === id && c.status === 'convite-enviado' ? { ...c, email } : c)));
        // e-mail corrigido pra um convidado do cenário: ele "entra" como num convite normal
        scheduleMockJoin(id, email);
      },
      removeCompanion: (id) => {
        clearJoinTimer(id);
        const companion = companions.find((c) => c.id === id);
        setCompanions((prev) => prev.filter((c) => c.id !== id));
        if (companion?.status === 'entrou') {
          // ajustes-83: remover da viagem NÃO apaga o que a pessoa trouxe — os lugares e gastos continuam,
          // e ela vira ex-membro (mantém o nome nos rótulos e no rateio). Fica em announcedJoins, então
          // não repete o aviso de entrada; se for convidada de novo, ganha outro id e outro aviso.
          setFormerCompanions((prev) => [...prev, companion]);
          return;
        }
        announcedJoins.current.delete(id);
        // convite pendente (cancelado): não trouxe nada ainda, mas a limpeza continua por segurança —
        // tira lugares que só ele queria, o "também quer", gastos dele
        const removedPlaceIds = selectedPlaces
          .filter((s) => s.addedBy === id && s.alsoWantedBy.filter((m) => m !== id).length === 0)
          .map((s) => s.id);
        setSelectedPlaces((prev) =>
          prev
            .filter((s) => !removedPlaceIds.includes(s.id))
            .map((s) => {
              if (s.addedBy !== id && !s.alsoWantedBy.includes(id)) return s;
              const others = s.alsoWantedBy.filter((m) => m !== id);
              // lugar que outro membro também queria fica, agora "adicionado" por esse outro
              return s.addedBy === id ? { ...s, addedBy: others[0], alsoWantedBy: others.slice(1) } : { ...s, alsoWantedBy: others };
            }),
        );
        setItineraryOverrides((prev) => prev.filter((o) => !removedPlaceIds.includes(o.placeSelectionId)));
        const withoutMember = (list: MemberId[] | null) => {
          if (!list) return null;
          const next = list.filter((m) => m !== id);
          return next.length > 0 ? next : null;
        };
        setExpenses((prev) =>
          prev.filter((e) => e.paidBy !== id).map((e) => ({ ...e, splitWith: withoutMember(e.splitWith) })),
        );
        setCentralCostOverrides((prev) =>
          prev.map((o) => ({ ...o, paidBy: o.paidBy === id ? 'voce' : o.paidBy, splitWith: withoutMember(o.splitWith) })),
        );
        setSettledTransferKeys((prev) => prev.filter((k) => !k.split(':')[0].split('->').includes(id)));
      },
      setQuizAnswer: (key, value) => setQuiz((prev) => ({ ...prev, [key]: value })),
      toggleQuizDiscovery: (discovery) =>
        setQuiz((prev) => ({
          ...prev,
          discovery: prev.discovery.includes(discovery)
            ? prev.discovery.filter((d) => d !== discovery)
            : [...prev.discovery, discovery],
        })),
      toggleQuizInterest: (interest) =>
        setQuiz((prev) => ({
          ...prev,
          interests: prev.interests.includes(interest)
            ? prev.interests.filter((i) => i !== interest)
            : [...prev.interests, interest],
        })),
      toggleQuizCompanionType: (value) =>
        setQuiz((prev) => ({
          ...prev,
          companionType: prev.companionType.includes(value)
            ? prev.companionType.filter((v) => v !== value)
            : [...prev.companionType, value],
        })),
      togglePlace: (destinationId, place) => {
        dismissMockKeys(
          mockKeysForSelection(
            selectedPlaces.find((s) => s.destinationId === destinationId && s.placeId === place.placeId),
          ),
        );
        setSelectedPlaces((prev) => {
          const existing = prev.find((s) => s.destinationId === destinationId && s.placeId === place.placeId);
          if (existing) return prev.filter((s) => s.id !== existing.id);
          return [
            ...prev,
            {
              id: `${place.placeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              destinationId,
              placeId: place.placeId,
              customLabel: null,
              categories: place.categories,
              addedBy: 'voce',
              alsoWantedBy: [],
            },
          ];
        });
      },
      addCustomPlace: (destinationId, label) =>
        setSelectedPlaces((prev) => [
          ...prev,
          {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            destinationId,
            placeId: null,
            customLabel: label,
            categories: [],
            addedBy: 'voce',
            alsoWantedBy: [],
          },
        ]),
      removeSelectedPlace: (id) => {
        dismissMockKeys(mockKeysForSelection(selectedPlaces.find((s) => s.id === id)));
        setSelectedPlaces((prev) => prev.filter((s) => s.id !== id));
      },
      moveItineraryItem: (placeSelectionId, newDayIndex) =>
        setItineraryOverrides((prev) => {
          const existing = prev.find((o) => o.placeSelectionId === placeSelectionId);
          if (existing) {
            return prev.map((o) => (o.placeSelectionId === placeSelectionId ? { ...o, dayIndex: newDayIndex } : o));
          }
          return [...prev, { placeSelectionId, dayIndex: newDayIndex, skipped: false }];
        }),
      toggleItinerarySkipped: (placeSelectionId) =>
        setItineraryOverrides((prev) => {
          const existing = prev.find((o) => o.placeSelectionId === placeSelectionId);
          if (existing) {
            return prev.map((o) =>
              o.placeSelectionId === placeSelectionId ? { ...o, skipped: !o.skipped } : o,
            );
          }
          // Primeira vez mexendo nesse item (nunca foi movido manualmente):
          // "congela" o dia atual calculado por round-robin, pra marcar como
          // pulado sem o item pular de posição visualmente.
          const place = selectedPlaces.find((s) => s.id === placeSelectionId);
          if (!place) {
            return [...prev, { placeSelectionId, dayIndex: 0, skipped: true }];
          }
          const ranges = splitDaysByDestination(destinations);
          const range = ranges.find((r) => r.destinationId === place.destinationId);
          const dayCount = range?.globalDayIndexes.length ?? 1;
          const currentDay = computeUnpinnedLocalDay(place.destinationId, dayCount, selectedPlaces, prev, placeSelectionId);
          return [...prev, { placeSelectionId, dayIndex: currentDay, skipped: true }];
        }),
      setDestinosSaved,
      setPerfilSaved,
      saveTransportItem: (item) =>
        setTransportItems((prev) => {
          const exists = prev.some((t) => t.id === item.id);
          return exists ? prev.map((t) => (t.id === item.id ? item : t)) : [...prev, item];
        }),
      removeTransportItem: (id) => setTransportItems((prev) => prev.filter((t) => t.id !== id)),
      saveStayItem: (item) =>
        setStayItems((prev) => {
          const exists = prev.some((s) => s.id === item.id);
          return exists ? prev.map((s) => (s.id === item.id ? item : s)) : [...prev, item];
        }),
      removeStayItem: (id) => setStayItems((prev) => prev.filter((s) => s.id !== id)),
      saveOtherItem: (item) =>
        setOtherItems((prev) => {
          const exists = prev.some((o) => o.id === item.id);
          return exists ? prev.map((o) => (o.id === item.id ? item : o)) : [...prev, item];
        }),
      removeOtherItem: (id) =>
        setOtherItems((prev) => {
          const removed = prev.find((o) => o.id === id);
          removed?.attachments.forEach((a) => URL.revokeObjectURL(a.url));
          return prev.filter((o) => o.id !== id);
        }),
      toggleEvent: (eventId) =>
        setSelectedEventIds((prev) =>
          prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
        ),
      saveExpense: (expense) =>
        setExpenses((prev) => {
          const exists = prev.some((e) => e.id === expense.id);
          return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [...prev, expense];
        }),
      removeExpense: (id) => {
        // gasto simulado removido não volta (ajustes-67)
        if (id.startsWith(MOCK_EXPENSE_PREFIX)) dismissMockKeys([mockExpenseKey(id.slice(MOCK_EXPENSE_PREFIX.length))]);
        setExpenses((prev) => {
          const removed = prev.find((e) => e.id === id);
          removed?.attachments.forEach((a) => URL.revokeObjectURL(a.url));
          return prev.filter((e) => e.id !== id);
        });
      },
      saveCentralCostOverride: (override) =>
        setCentralCostOverrides((prev) => [...prev.filter((o) => o.sourceId !== override.sourceId), override]),
      toggleSettledTransfer: (key) =>
        setSettledTransferKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])),
      addPhotos: (added) => setPhotos((prev) => [...prev, ...added]),
      updatePhoto: (photo) => setPhotos((prev) => prev.map((p) => (p.id === photo.id ? photo : p))),
      removePhoto: (id) => {
        setPhotos((prev) => {
          const removed = prev.find((p) => p.id === id);
          if (removed) URL.revokeObjectURL(removed.url);
          return prev.filter((p) => p.id !== id);
        });
        // card da retrospectiva que usava essa foto cai pra "sem foto" (a tela usa a foto da cidade no lugar)
        setRetrospective((prev) =>
          prev && prev.cards.some((c) => c.photoId === id)
            ? { ...prev, cards: prev.cards.map((c) => (c.photoId === id ? { ...c, photoId: null } : c)) }
            : prev,
        );
      },
      setRetrospective,
      updateRetroCard: (card) =>
        setRetrospective((prev) =>
          prev ? { ...prev, cards: prev.cards.map((c) => (c.id === card.id ? card : c)) } : prev,
        ),
      moveRetroCard: (id, direction) =>
        setRetrospective((prev) => {
          if (!prev) return prev;
          const from = prev.cards.findIndex((c) => c.id === id);
          const to = from + direction;
          if (from < 0 || to < 0 || to >= prev.cards.length) return prev;
          const cards = [...prev.cards];
          [cards[from], cards[to]] = [cards[to], cards[from]];
          return { ...prev, cards };
        }),
      setRetroShowCosts: (value) => setRetrospective((prev) => (prev ? { ...prev, showCosts: value } : prev)),
      setRetroDismissed,
      resetTrip: () => {
        joinTimers.current.forEach((t) => clearTimeout(t));
        joinTimers.current.clear();
        announcedJoins.current.clear();
        setDismissedMockKeys([]);
        setCompanionJoinNotice(null);
        setName('');
        setDestinations([]);
        setCompanions([]);
        setFormerCompanions([]);
        setQuiz(initialQuiz);
        setSelectedPlaces([]);
        setItineraryOverrides([]);
        setDestinosSaved(false);
        setPerfilSaved(false);
        setTransportItems([]);
        setStayItems([]);
        setSelectedEventIds([]);
        setExpenses((prev) => {
          prev.forEach((e) => e.attachments.forEach((a) => URL.revokeObjectURL(a.url)));
          return [];
        });
        setCentralCostOverrides([]);
        setSettledTransferKeys([]);
        setPhotos((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.url));
          return [];
        });
        setRetrospective(null);
        setRetroDismissed(false);
        setOtherItems((prev) => {
          prev.forEach((o) => o.attachments.forEach((a) => URL.revokeObjectURL(a.url)));
          return [];
        });
      },
    }),
    [
      name,
      destinations,
      companions,
      quiz,
      selectedPlaces,
      itineraryOverrides,
      destinosSaved,
      perfilSaved,
      transportItems,
      stayItems,
      otherItems,
      selectedEventIds,
      expenses,
      centralCostOverrides,
      settledTransferKeys,
      photos,
      retrospective,
      retroDismissed,
      formerCompanions,
      dismissedMockKeys,
      companionJoinNotice,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip precisa estar dentro de <TripProvider>');
  return ctx;
}
