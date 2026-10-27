import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MOCK_COMPANIONS, findMockCompanion } from '../data/mockCompanions';
import type { Settlement } from '../utils/settlement';
import {
  MOCK_EXPENSE_PREFIX,
  applyMockContributions,
  mockExpenseKey,
  mockPlaceKey,
} from '../utils/mockContributions';
import { computeUnpinnedLocalDay, proximityOptionsFor, splitDaysByDestination } from '../utils/itinerary';

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
   * (src/data/mockCompanions.ts, SIMULAÇÃO), e só quando o moderador aciona "Simular: uma semana
   * antes da viagem" (ajustes-89/94); até lá, e pra qualquer outro e-mail, fica em 'convite-enviado'.
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
  /**
   * dia (yyyy-mm-dd) em que a pessoa fixou o lugar ao adicionar pelo "Adicionar lugares" (ajustes-97):
   * a divisão por proximidade não o move. "Mudar de dia" fixa pelo override; "Deixar o app escolher
   * o dia" tira os dois.
   */
  pinnedDayISO?: string;
  /**
   * lugar achado na busca ao vivo do OpenStreetMap (Photon, ajustes-97): sem placeId, com nome,
   * coordenada, endereço e categoria próprios — entra no mapa e na proximidade como qualquer lugar.
   * `customLabel` recebe o nome, então as telas que só mostram o nome continuam iguais.
   */
  source?: 'osm';
  name?: string;
  lat?: number;
  lng?: number;
  address?: string;
  /** categoria do app (gastronomia, cultura, natureza, compras) ou 'lugar' */
  category?: string;
  osmId?: string;
}

/** a seleção sem o dia fixado (ajustes-97) */
function withoutPin(selection: TripPlaceSelection): TripPlaceSelection {
  const copy = { ...selection };
  delete copy.pinnedDayISO;
  return copy;
}

/** o que o "Adicionar lugares" (ajustes-97) põe no roteiro */
export type NewItineraryPlace =
  | { kind: 'app'; placeId: string; categories: string[] }
  | { kind: 'osm'; name: string; lat: number; lng: number; address: string; category: string; osmId: string }
  | { kind: 'custom'; label: string };

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
  /** "São Paulo – Guarulhos (GRU)" quando escolhido no AirportField (ajustes-86); texto livre também vale */
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  /** código da reserva (localizador) — o dado mais procurado no check-in (ajustes-86), opcional */
  locator: string;
  /** "Econômica", "Executiva"… (opcional) */
  travelClass: string;
  /** "1 despachada + 1 de mão" (opcional) */
  baggage: string;
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
  /** nome digitado quando quem pagou foi "Outro", de fora da viagem (paidBy = externalMemberId, ajustes-94) */
  paidByName?: string;
  /**
   * null = dividir entre todos os membros atuais (inclui quem for convidado depois) — só nos gastos
   * simulados dos convidados; desde o ajustes-95c o formulário sempre salva a lista (começa só com Você)
   */
  splitWith: MemberId[] | null;
  /** "Dividido entre quantas pessoas?" (ajustes-95b), só quando passa dos marcados; sem ele, o número de marcados */
  splitCount?: number;
  /**
   * "+ Outra pessoa" no "Dividir com" (ajustes-95c): nomes de quem não está na viagem e entra só
   * nesse gasto (no splitWith pelo externalMemberId do nome, como o "Outro" de quem pagou)
   */
  splitNames?: string[];
  /** ISO yyyy-mm-dd ou null */
  date: string | null;
  attachments: Attachment[];
  /** lançado pela parada do Roteiro (ajustes-88): a parada mostra o valor e leva até aqui */
  placeSelectionId?: string | null;
}

/** Só quem pagou/divide pode mudar nos custos que vêm da Central; valor e moeda continuam sendo editados lá. */
export interface CentralCostOverride {
  /** id do TransportItem / StayItem / OtherItem */
  sourceId: string;
  paidBy: MemberId;
  /** "Outro" de fora da viagem (ajustes-94), como em Expense */
  paidByName?: string;
  splitWith: MemberId[] | null;
  /** como em Expense (ajustes-95b) */
  splitCount?: number;
  /** como em Expense (ajustes-95c) */
  splitNames?: string[];
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
  /** Custos (ajustes-61): gastos lançados à mão, quem pagou/divide os custos da Central e os acertos (ajustes-90) */
  expenses: Expense[];
  centralCostOverrides: CentralCostOverride[];
  /**
   * Acertos do rateio como pagamentos registrados (ajustes-90, substitui `settledTransferKeys`, que
   * guardava o valor da transferência e "renascia" a dívida inteira quando entrava um gasto novo)
   */
  settlements: Settlement[];
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
  /** "Simular: uma semana antes da viagem" já foi usado (ajustes-89/94) — só volta com "Recomeçar teste" */
  groupUpdateSimulated: boolean;
  /**
   * "Simular: durante a viagem" (ajustes-94): o "hoje" do app, ISO yyyy-mm-dd — a Início mostra
   * "Acontecendo agora" e o Roteiro abre nesse dia. null = fora da viagem (o padrão).
   */
  simulatedTodayISO: string | null;
  /** o que chegou na simulação e a pessoa ainda não viu, por seção do menu (ids dos itens) */
  unseenUpdates: UnseenUpdates;
  /** banner "Marina e Rodrigo entraram…" na Início (seq muda a cada simulação, pra tela mostrar uma vez) */
  groupUpdateNotice: { seq: number; message: string; title: string } | null;
}

/** ajustes-89: ids do que os convidados trouxeram e ainda não foi visto (lugares, gastos, quem entrou) */
export interface UnseenUpdates {
  roteiro: string[];
  custos: string[];
  convidados: string[];
}

export type UpdateSection = keyof UnseenUpdates;

const NO_UPDATES: UnseenUpdates = { roteiro: [], custos: [], convidados: [] };

/** "Marina e Rodrigo" / "A, B e C" (mesma regra do joinPt de utils/retrospective, sem importar a tela) */
function joinPt(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

const countPt = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

export interface TripContextValue extends TripState {
  setName: (name: string) => void;
  addDestination: (destination: Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>) => void;
  removeDestination: (id: string) => void;
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
  /**
   * "Eu também" (ajustes-87): você entra (ou sai) de um lugar que um convidado escolheu, sem mexer
   * na escolha dele — o lugar continua no roteiro do grupo.
   */
  toggleMyInterest: (selectionId: string) => void;
  /**
   * "Adicionar lugares" (ajustes-97): põe o lugar no roteiro da participante, fixado no dia escolhido
   * (null = deixar o app escolher). Lugar do app que já estava na viagem como plano de um convidado:
   * ela entra nele (alsoWantedBy). Devolve o id da seleção, pra tela rolar até a parada.
   */
  addPlaceToItinerary: (destinationId: string, place: NewItineraryPlace, pinnedDayISO: string | null) => string;
  /** "Deixar o app escolher o dia" (ajustes-97): tira a fixação (pinnedDayISO e o override de dia) */
  unpinItineraryItem: (placeSelectionId: string) => void;
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
  /** "Registrar pagamento" no Rateio — o valor pode ser parcial */
  addSettlement: (settlement: Settlement) => void;
  /** "Desfazer" no histórico de acertos */
  removeSettlement: (id: string) => void;
  addPhotos: (photos: TripPhoto[]) => void;
  updatePhoto: (photo: TripPhoto) => void;
  removePhoto: (id: string) => void;
  setRetrospective: (retrospective: Retrospective | null) => void;
  updateRetroCard: (card: RetroCard) => void;
  moveRetroCard: (id: string, direction: -1 | 1) => void;
  setRetroShowCosts: (value: boolean) => void;
  setRetroDismissed: (value: boolean) => void;
  /**
   * Moderador (ajustes-89): "dois dias depois" — os convidados do cenário que estão em "Convite
   * enviado" entram e trazem as contribuições. `ok: false` quando nenhum deles foi convidado ou a
   * simulação já foi usada; `message` é o texto do banner (ou o motivo).
   */
  simulateGroupUpdate: () => { ok: boolean; message: string };
  /**
   * Moderador (ajustes-94): "durante a viagem" — põe o app em 15/11/2026. Se a simulação do grupo
   * ainda não rodou, roda antes (convidando a Marina e o Rodrigo, se faltar). `ok: false` sem
   * destino com datas.
   */
  simulateDuringTrip: () => { ok: boolean; message: string };
  /** a pessoa saiu da seção: o que era novidade dela deixa de ser (número do menu e selo "Novo") */
  markSectionSeen: (section: UpdateSection) => void;
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
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [retrospective, setRetrospective] = useState<Retrospective | null>(null);
  const [retroDismissed, setRetroDismissed] = useState(false);
  const [formerCompanions, setFormerCompanions] = useState<TripCompanion[]>([]);
  const [dismissedMockKeys, setDismissedMockKeys] = useState<string[]>([]);
  const [groupUpdateSimulated, setGroupUpdateSimulated] = useState(false);
  const [unseenUpdates, setUnseenUpdates] = useState<UnseenUpdates>(NO_UPDATES);
  const [groupUpdateNotice, setGroupUpdateNotice] = useState<{ seq: number; message: string; title: string } | null>(null);
  const [simulatedTodayISO, setSimulatedTodayISO] = useState<string | null>(null);

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

  /*
    SIMULAÇÃO "uma semana antes da viagem" (era "dois dias depois", ajustes-89/94; substitui a entrada
    automática de 2,5 s do ajustes-67): só os convidados do cenário que estão em "Convite enviado"
    entram; as contribuições deles entram uma vez (applyMockContributions) e viram novidade nas
    seções (unseenUpdates). `currentCompanions` deixa o "durante a viagem" simular com os convites
    que ele acabou de criar.
  */
  function simulateGroupUpdate(
    currentCompanions: TripCompanion[] = companions,
    title = 'Faltam poucos dias pra viagem',
  ): { ok: boolean; message: string } {
    if (groupUpdateSimulated) return { ok: false, message: 'Já simulado. Use "Recomeçar teste" pra simular de novo.' };
    const joining = currentCompanions.filter((c) => c.status === 'convite-enviado' && findMockCompanion(c.email));
    if (joining.length === 0) return { ok: false, message: 'Convide a Marina e o Rodrigo primeiro' };
    const joined: TripCompanion[] = joining.map((c) => {
      const profile = findMockCompanion(c.email)!;
      return { ...c, status: 'entrou', name: profile.name, initials: profile.initials };
    });
    const result = applyMockContributions({
      destinations,
      joined,
      selectedPlaces,
      expenses,
      transportItems,
      stayItems,
      dismissedMockKeys,
    });
    setCompanions(currentCompanions.map((c) => joined.find((j) => j.id === c.id) ?? c));
    setSelectedPlaces(result.selectedPlaces);
    setExpenses(result.expenses);
    setGroupUpdateSimulated(true);
    setUnseenUpdates({
      roteiro: result.newPlaceSelectionIds,
      custos: result.newExpenseIds,
      convidados: joined.map((c) => c.id),
    });
    const names = joinPt(joined.map((c) => (c.name ?? c.email).split(' ')[0]));
    const parts = [
      result.newPlaceSelectionIds.length > 0 ? countPt(result.newPlaceSelectionIds.length, 'lugar', 'lugares') : '',
      result.newExpenseIds.length > 0 ? countPt(result.newExpenseIds.length, 'gasto', 'gastos') : '',
    ].filter(Boolean);
    const verb = joined.length === 1 ? 'entrou' : 'entraram';
    const message =
      parts.length > 0
        ? `${names} ${verb} na viagem e ${joined.length === 1 ? 'adicionou' : 'adicionaram'} ${joinPt(parts)}`
        : `${names} ${verb} na viagem`;
    // seq pelo relógio: depois de "Recomeçar teste" a próxima simulação também mostra o banner
    setGroupUpdateNotice({ seq: Date.now(), message, title });
    return { ok: true, message };
  }

  /** dia 2 da viagem do cenário (14 a 27/11/2026), à noite: Buenos Aires · Dia 2 de 14 */
  const DURING_TRIP_TODAY = '2026-11-15';

  function simulateDuringTrip(): { ok: boolean; message: string } {
    if (!destinations.some((d) => d.dateStart && d.dateEnd)) {
      return { ok: false, message: 'Cadastre os destinos e as datas primeiro' };
    }
    if (!groupUpdateSimulated) {
      // Parte 3 sem ter passado pela Parte 2: Marina e Rodrigo precisam estar na viagem
      const missing = MOCK_COMPANIONS.filter(
        (m) => !companions.some((c) => c.email.trim().toLowerCase() === m.email.toLowerCase()),
      ).map((m): TripCompanion => ({
        id: `${m.email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        email: m.email,
        status: 'convite-enviado',
      }));
      simulateGroupUpdate([...companions, ...missing], 'Sua viagem começou');
    }
    setSimulatedTodayISO(DURING_TRIP_TODAY);
    return { ok: true, message: 'Viagem acontecendo: 15/11' };
  }

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
      settlements,
      photos,
      retrospective,
      retroDismissed,
      formerCompanions,
      dismissedMockKeys,
      groupUpdateSimulated,
      unseenUpdates,
      groupUpdateNotice,
      simulatedTodayISO,
      simulateGroupUpdate: () => simulateGroupUpdate(),
      simulateDuringTrip,
      markSectionSeen: (section) =>
        setUnseenUpdates((prev) => (prev[section].length === 0 ? prev : { ...prev, [section]: [] })),
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
      setDestinationDateRange: (id, start, end) =>
        setDestinations((prev) => prev.map((d) => (d.id === id ? { ...d, dateStart: start, dateEnd: end } : d))),
      addCompanion: (email) => {
        const id = `${email}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        // ajustes-89: todo convite fica em "Convite enviado" — os do cenário só entram na simulação
        setCompanions((prev) => [...prev, { id, email, status: 'convite-enviado' }]);
      },
      updateCompanionEmail: (id, email) =>
        setCompanions((prev) => prev.map((c) => (c.id === id && c.status === 'convite-enviado' ? { ...c, email } : c))),
      removeCompanion: (id) => {
        const companion = companions.find((c) => c.id === id);
        setCompanions((prev) => prev.filter((c) => c.id !== id));
        if (companion?.status === 'entrou') {
          // ajustes-83: remover da viagem NÃO apaga o que a pessoa trouxe — os lugares e gastos continuam,
          // e ela vira ex-membro (mantém o nome nos rótulos e no rateio).
          setFormerCompanions((prev) => [...prev, companion]);
          return;
        }
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
          // sem ninguém na divisão, fica só com você (ajustes-95c), nunca vira "todos"
          return next.length > 0 ? next : ['voce'];
        };
        setExpenses((prev) =>
          prev.filter((e) => e.paidBy !== id).map((e) => ({ ...e, splitWith: withoutMember(e.splitWith) })),
        );
        setCentralCostOverrides((prev) =>
          prev.map((o) => ({ ...o, paidBy: o.paidBy === id ? 'voce' : o.paidBy, splitWith: withoutMember(o.splitWith) })),
        );
        setSettlements((prev) => prev.filter((st) => st.from !== id && st.to !== id));
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
      addPlaceToItinerary: (destinationId, place, pinnedDayISO) => {
        const pin = pinnedDayISO ? { pinnedDayISO } : {};
        if (place.kind === 'app') {
          const existing = selectedPlaces.find((s) => s.destinationId === destinationId && s.placeId === place.placeId);
          if (existing) {
            setSelectedPlaces((prev) =>
              prev.map((s) => {
                if (s.id !== existing.id) return s;
                const mine = s.addedBy === 'voce' || s.alsoWantedBy.includes('voce');
                return {
                  ...withoutPin(s),
                  ...pin,
                  alsoWantedBy: mine ? s.alsoWantedBy : ['voce', ...s.alsoWantedBy],
                };
              }),
            );
            // dia novo escolhido: vale a fixação nova, não um "Mudar de dia" antigo
            setItineraryOverrides((prev) => prev.filter((o) => o.placeSelectionId !== existing.id || o.skipped));
            return existing.id;
          }
        }
        const id = `${place.kind === 'app' ? place.placeId : place.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const base = { id, destinationId, addedBy: 'voce' as MemberId, alsoWantedBy: [] as MemberId[], ...pin };
        const selection: TripPlaceSelection =
          place.kind === 'app'
            ? { ...base, placeId: place.placeId, customLabel: null, categories: place.categories }
            : place.kind === 'osm'
              ? {
                  ...base,
                  placeId: null,
                  customLabel: place.name,
                  categories: place.category === 'lugar' ? [] : [place.category],
                  source: 'osm',
                  name: place.name,
                  lat: place.lat,
                  lng: place.lng,
                  address: place.address,
                  category: place.category,
                  osmId: place.osmId,
                }
              : { ...base, placeId: null, customLabel: place.label, categories: [] };
        setSelectedPlaces((prev) => [...prev, selection]);
        return id;
      },
      unpinItineraryItem: (placeSelectionId) => {
        setSelectedPlaces((prev) =>
          prev.map((s) => {
            return s.id === placeSelectionId ? withoutPin(s) : s;
          }),
        );
        setItineraryOverrides((prev) => prev.filter((o) => o.placeSelectionId !== placeSelectionId || o.skipped));
      },
      toggleMyInterest: (selectionId) =>
        setSelectedPlaces((prev) =>
          prev.map((s) => {
            if (s.id !== selectionId) return s;
            if (s.addedBy === 'voce') {
              // você adicionou e um convidado também quer (ajustes-95): desfazer passa o lugar pra ele
              const [first, ...rest] = s.alsoWantedBy.filter((m) => m !== 'voce');
              return first ? { ...s, addedBy: first, alsoWantedBy: rest } : s;
            }
            return s.alsoWantedBy.includes('voce')
              ? { ...s, alsoWantedBy: s.alsoWantedBy.filter((m) => m !== 'voce') }
              : { ...s, alsoWantedBy: ['voce', ...s.alsoWantedBy] };
          }),
        ),
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
          // "congela" o dia atual calculado por proximidade, pra marcar como
          // pulado sem o item pular de posição visualmente.
          const place = selectedPlaces.find((s) => s.id === placeSelectionId);
          if (!place) {
            return [...prev, { placeSelectionId, dayIndex: 0, skipped: true }];
          }
          const ranges = splitDaysByDestination(destinations);
          const range = ranges.find((r) => r.destinationId === place.destinationId);
          const dayCount = range?.globalDayIndexes.length ?? 1;
          const currentDay = computeUnpinnedLocalDay(
            place.destinationId,
            dayCount,
            selectedPlaces,
            prev,
            placeSelectionId,
            proximityOptionsFor({ destinations, transportItems, stayItems }, place.destinationId),
          );
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
      addSettlement: (settlement) => setSettlements((prev) => [...prev, settlement]),
      removeSettlement: (id) => setSettlements((prev) => prev.filter((st) => st.id !== id)),
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
        setDismissedMockKeys([]);
        setGroupUpdateSimulated(false);
        setUnseenUpdates(NO_UPDATES);
        setGroupUpdateNotice(null);
        setSimulatedTodayISO(null);
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
        setSettlements([]);
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
      settlements,
      photos,
      retrospective,
      retroDismissed,
      formerCompanions,
      dismissedMockKeys,
      groupUpdateSimulated,
      unseenUpdates,
      groupUpdateNotice,
      simulatedTodayISO,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip precisa estar dentro de <TripProvider>');
  return ctx;
}
