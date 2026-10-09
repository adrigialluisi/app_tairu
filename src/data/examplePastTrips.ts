/**
 * Viagens passadas de EXEMPLO (docs/ajustes-76-viagem-passada-e-recordacao.md).
 *
 * O protótipo não guarda histórico real (tudo em memória, ajustes-26), então
 * estas viagens são ilustração fixa, sempre com o selo "Exemplo". Só a
 * "viagem" é fictícia: os lugares são pontos turísticos reais, com coordenadas
 * públicas de landmark (precisão de quarteirão, mesmo critério do places.json),
 * e as fotos vêm ao vivo da Wikipedia pelo `wikiTitle` — nunca imagem inventada.
 *
 * Só a de Lisboa + Porto tem roteiro (`cities`) e é clicável; a do Rio continua
 * só ilustrando o carrossel.
 *
 * Desde o ajustes-77 o roteiro tem também restaurantes (reais) e eventos (reais,
 * conferidos na agenda da época — `sourceUrl`), e cada item tem o valor pago.
 * Os VALORES são ilustrativos (é uma viagem de exemplo) e a tela diz isso.
 *
 * Desde os ajustes-78/79 cada lugar tem 2 fotos de exemplo locais
 * (`public/memorias-exemplo/`, Wikimedia Commons, com crédito), cada uma
 * "adicionada" por um dos 3 viajantes fictícios — ver `photosOfStop`.
 */

import photoData from './examplePastTripPhotos.json';

export type PastTripStopKind = 'lugar' | 'restaurante' | 'evento';

export interface PastTripStop {
  id: string;
  kind: PastTripStopKind;
  name: string;
  /** bairro; no evento, o local do evento */
  neighborhood: string;
  lat: number;
  lng: number;
  /** título do artigo na Wikipedia (pt, depois es) pra foto real; sem artigo = ícone do tipo */
  wikiTitle?: string;
  dayISO: string;
  /** horário (só eventos, quando a fonte informa) */
  time?: string;
  /** quanto o grupo pagou, em EUR (0 = grátis). Valor ILUSTRATIVO do exemplo — ver ajustes-77 */
  cost: number;
  /** o que o valor cobre: "3 ingressos", "almoço, 3 pessoas" */
  costNote?: string;
  /** só eventos: página onde o evento foi conferido (regra de dado real, como em events.json) */
  sourceUrl?: string;
}

export interface PastTripCity {
  id: string;
  city: string;
  country: string;
  /** centro da cidade — usado no mapa da rota entre cidades */
  lat: number;
  lng: number;
  stops: PastTripStop[];
}

export interface ExamplePastTrip {
  id: string;
  name: string;
  cityForPhoto: string;
  destinationsLabel: string;
  datesLabel: string;
  companionsLabel: string;
  /** quantas pessoas viajaram (você + convidados) — pra dividir o custo por pessoa */
  travelers: number;
  startISO: string;
  endISO: string;
  /** sem roteiro = card só ilustrativo, não clicável */
  cities?: PastTripCity[];
}

export const EXAMPLE_PAST_TRIPS: ExamplePastTrip[] = [
  {
    id: 'exemplo-1',
    name: 'Réveillon em família',
    cityForPhoto: 'Rio de Janeiro',
    destinationsLabel: 'Rio de Janeiro',
    datesLabel: '28/12 – 02/01',
    companionsLabel: '4 convidados',
    travelers: 5,
    startISO: '2025-12-28',
    endISO: '2026-01-02',
  },
  {
    id: 'exemplo-2',
    name: 'Aniversário de 30 anos',
    cityForPhoto: 'Lisboa',
    destinationsLabel: 'Lisboa, Porto',
    datesLabel: '10/05 – 18/05',
    companionsLabel: '2 convidados',
    travelers: 3,
    startISO: '2026-05-10',
    endISO: '2026-05-18',
    cities: [
      {
        id: 'lisboa',
        city: 'Lisboa',
        country: 'Portugal',
        lat: 38.7223,
        lng: -9.1393,
        stops: [
          { id: 'lis-comercio', kind: 'lugar', name: 'Praça do Comércio', neighborhood: 'Baixa', lat: 38.7076, lng: -9.1365, wikiTitle: 'Praça do Comércio', dayISO: '2026-05-10', cost: 0 },
          { id: 'lis-rua-augusta', kind: 'lugar', name: 'Arco da Rua Augusta', neighborhood: 'Baixa', lat: 38.7087, lng: -9.1365, wikiTitle: 'Arco da Rua Augusta', dayISO: '2026-05-10', cost: 10.5, costNote: '3 ingressos do miradouro' },
          { id: 'lis-time-out', kind: 'restaurante', name: 'Time Out Market', neighborhood: 'Cais do Sodré', lat: 38.7069, lng: -9.1459, wikiTitle: 'Time Out Market Lisboa', dayISO: '2026-05-10', cost: 68, costNote: 'almoço, 3 pessoas' },
          { id: 'lis-santa-luzia', kind: 'lugar', name: 'Miradouro de Santa Luzia', neighborhood: 'Alfama', lat: 38.7116, lng: -9.1302, wikiTitle: 'Miradouro de Santa Luzia', dayISO: '2026-05-10', cost: 0 },
          { id: 'lis-termometro', kind: 'evento', name: 'Final do Festival Termómetro', neighborhood: 'LAV – Lisboa ao Vivo, Marvila', lat: 38.7385, lng: -9.1020, dayISO: '2026-05-10', time: '16:00', cost: 45, costNote: '3 ingressos', sourceUrl: 'https://lisboaaovivo.com/agenda/mes/2026-05/' },
          { id: 'lis-se', kind: 'lugar', name: 'Sé de Lisboa', neighborhood: 'Alfama', lat: 38.7099, lng: -9.1334, wikiTitle: 'Sé de Lisboa', dayISO: '2026-05-11', cost: 15, costNote: '3 ingressos' },
          { id: 'lis-castelo', kind: 'lugar', name: 'Castelo de São Jorge', neighborhood: 'Castelo', lat: 38.7139, lng: -9.1335, wikiTitle: 'Castelo de São Jorge', dayISO: '2026-05-11', cost: 45, costNote: '3 ingressos' },
          { id: 'lis-panteao', kind: 'lugar', name: 'Panteão Nacional', neighborhood: 'São Vicente', lat: 38.7149, lng: -9.1250, wikiTitle: 'Igreja de Santa Engrácia', dayISO: '2026-05-11', cost: 24, costNote: '3 ingressos' },
          { id: 'lis-ramiro', kind: 'restaurante', name: 'Cervejaria Ramiro', neighborhood: 'Intendente', lat: 38.7208, lng: -9.1355, dayISO: '2026-05-11', cost: 132, costNote: 'jantar, 3 pessoas' },
          { id: 'lis-jeronimos', kind: 'lugar', name: 'Mosteiro dos Jerónimos', neighborhood: 'Belém', lat: 38.6979, lng: -9.2068, wikiTitle: 'Mosteiro dos Jerónimos', dayISO: '2026-05-12', cost: 54, costNote: '3 ingressos' },
          { id: 'lis-pasteis', kind: 'restaurante', name: 'Pastéis de Belém', neighborhood: 'Belém', lat: 38.6975, lng: -9.2032, wikiTitle: 'Pastéis de Belém', dayISO: '2026-05-12', cost: 14.4, costNote: 'pastéis e cafés' },
          { id: 'lis-padrao', kind: 'lugar', name: 'Padrão dos Descobrimentos', neighborhood: 'Belém', lat: 38.6936, lng: -9.2058, wikiTitle: 'Padrão dos Descobrimentos', dayISO: '2026-05-12', cost: 30, costNote: '3 ingressos' },
          { id: 'lis-torre-belem', kind: 'lugar', name: 'Torre de Belém', neighborhood: 'Belém', lat: 38.6916, lng: -9.2160, wikiTitle: 'Torre de Belém', dayISO: '2026-05-12', cost: 30, costNote: '3 ingressos' },
          { id: 'lis-lx-factory', kind: 'lugar', name: 'LX Factory', neighborhood: 'Alcântara', lat: 38.7034, lng: -9.1783, wikiTitle: 'LX Factory', dayISO: '2026-05-12', cost: 0 },
          { id: 'lis-pena', kind: 'lugar', name: 'Palácio da Pena', neighborhood: 'Sintra', lat: 38.7876, lng: -9.3906, wikiTitle: 'Palácio Nacional da Pena', dayISO: '2026-05-13', cost: 60, costNote: '3 ingressos' },
          { id: 'lis-piriquita', kind: 'restaurante', name: 'Casa Piriquita', neighborhood: 'Sintra', lat: 38.7977, lng: -9.3906, dayISO: '2026-05-13', cost: 18, costNote: 'travesseiros e cafés' },
          { id: 'lis-regaleira', kind: 'lugar', name: 'Quinta da Regaleira', neighborhood: 'Sintra', lat: 38.7963, lng: -9.3961, wikiTitle: 'Quinta da Regaleira', dayISO: '2026-05-13', cost: 45, costNote: '3 ingressos' },
        ],
      },
      {
        id: 'porto',
        city: 'Porto',
        country: 'Portugal',
        lat: 41.1496,
        lng: -8.6110,
        stops: [
          { id: 'opo-sao-bento', kind: 'lugar', name: 'Estação de São Bento', neighborhood: 'Baixa', lat: 41.1456, lng: -8.6106, wikiTitle: 'Estação de São Bento', dayISO: '2026-05-14', cost: 0 },
          { id: 'opo-majestic', kind: 'restaurante', name: 'Café Majestic', neighborhood: 'Santa Catarina', lat: 41.1471, lng: -8.6063, wikiTitle: 'Café Majestic', dayISO: '2026-05-14', cost: 42, costNote: 'lanche, 3 pessoas' },
          { id: 'opo-clerigos', kind: 'lugar', name: 'Torre dos Clérigos', neighborhood: 'Vitória', lat: 41.1457, lng: -8.6146, wikiTitle: 'Torre dos Clérigos', dayISO: '2026-05-14', cost: 30, costNote: '3 ingressos' },
          { id: 'opo-flamenco', kind: 'evento', name: 'Grande Gala de Baile e Cante Flamenco', neighborhood: 'Casa da Música, Boavista', lat: 41.1588, lng: -8.6308, wikiTitle: 'Casa da Música', dayISO: '2026-05-14', cost: 75, costNote: '3 ingressos', sourceUrl: 'https://www.portugal.com/activities-experiences/12-top-events-in-porto-may-2026/' },
          { id: 'opo-lello', kind: 'lugar', name: 'Livraria Lello', neighborhood: 'Vitória', lat: 41.1469, lng: -8.6149, wikiTitle: 'Livraria Lello', dayISO: '2026-05-15', cost: 45, costNote: '3 entradas' },
          { id: 'opo-bolhao', kind: 'restaurante', name: 'Mercado do Bolhão', neighborhood: 'Bolhão', lat: 41.1495, lng: -8.6062, wikiTitle: 'Mercado do Bolhão', dayISO: '2026-05-15', cost: 36, costNote: 'almoço, 3 pessoas' },
          { id: 'opo-ribeira', kind: 'lugar', name: 'Cais da Ribeira', neighborhood: 'Ribeira', lat: 41.1407, lng: -8.6131, wikiTitle: 'Ribeira (Porto)', dayISO: '2026-05-15', cost: 0 },
          { id: 'opo-ponte', kind: 'lugar', name: 'Ponte Luís I', neighborhood: 'Ribeira', lat: 41.1399, lng: -8.6094, wikiTitle: 'Puente Don Luis I', dayISO: '2026-05-15', cost: 0 },
          { id: 'opo-serra-pilar', kind: 'lugar', name: 'Mosteiro da Serra do Pilar', neighborhood: 'Vila Nova de Gaia', lat: 41.1385, lng: -8.6083, wikiTitle: 'Mosteiro da Serra do Pilar', dayISO: '2026-05-16', cost: 0 },
          { id: 'opo-caves', kind: 'lugar', name: 'Caves do Vinho do Porto', neighborhood: 'Vila Nova de Gaia', lat: 41.1376, lng: -8.6138, wikiTitle: 'Vinho do Porto', dayISO: '2026-05-16', cost: 75, costNote: 'visita com prova, 3 pessoas' },
          { id: 'opo-guedes', kind: 'restaurante', name: 'Casa Guedes', neighborhood: 'Bolhão', lat: 41.1462, lng: -8.6039, dayISO: '2026-05-16', cost: 27, costNote: 'sanduíches de pernil' },
          { id: 'opo-serralves', kind: 'lugar', name: 'Fundação de Serralves', neighborhood: 'Lordelo do Ouro', lat: 41.1597, lng: -8.6598, wikiTitle: 'Fundação de Serralves', dayISO: '2026-05-17', cost: 66, costNote: '3 ingressos' },
          { id: 'opo-queijo', kind: 'lugar', name: 'Castelo do Queijo', neighborhood: 'Foz do Douro', lat: 41.1683, lng: -8.6908, wikiTitle: 'Castelo do Queijo', dayISO: '2026-05-17', cost: 0 },
        ],
      },
    ],
  },
];

export function getExamplePastTrip(id: string | undefined): ExamplePastTrip | undefined {
  return EXAMPLE_PAST_TRIPS.find((t) => t.id === id);
}

// ---------- fotos de exemplo dos lugares (docs/ajustes-78-... e ajustes-79-fotos-do-grupo-na-recordacao.md) ----------

/**
 * Viajante da viagem de EXEMPLO — fictício (simulação, mesmo espírito de
 * mockCompanions.ts), de propósito com nomes diferentes de Marina/Rodrigo pra
 * não misturar com o cenário fixo de teste.
 */
export interface ExampleTraveler {
  id: string;
  name: string;
  initials: string;
}

/**
 * Foto real do lugar (Wikimedia Commons, crédito obrigatório) fazendo o papel
 * da foto que alguém do grupo adicionou na parada durante a viagem (ajustes-75).
 * Nunca é foto do viajante: a tela sempre sinaliza que é exemplo.
 */
export interface ExamplePhoto {
  id: string;
  stopId: string;
  /** `${import.meta.env.BASE_URL}memorias-exemplo/<id>.jpg` — respeita o --base do GitHub Pages */
  url: string;
  author: string;
  license: string;
  sourcePage: string;
  /** ExampleTraveler.id de quem adicionou a foto na parada */
  addedBy: string;
}

export const EXAMPLE_TRAVELERS: ExampleTraveler[] = photoData.travelers;

const EXAMPLE_PHOTOS: ExamplePhoto[] = photoData.photos.map((p) => ({
  ...p,
  url: `${import.meta.env.BASE_URL}memorias-exemplo/${p.id}.jpg`,
}));

export function photosOfStop(stopId: string): ExamplePhoto[] {
  return EXAMPLE_PHOTOS.filter((p) => p.stopId === stopId);
}

export function travelerById(id: string): ExampleTraveler | undefined {
  return EXAMPLE_TRAVELERS.find((t) => t.id === id);
}
