# Ajuste 09 — Datas por destino, não mais um campo único da viagem

Pedido da Adriana: hoje só existe um campo de data pra viagem inteira; precisa separar e dizer qual data fica em cada destino. **Atualizado em 10/set/2026:** a regra de validação foi corrigida — datas de destinos diferentes podem se TOCAR (fim de um = início do outro, ex.: sai de Buenos Aires de manhã e chega em Santiago ainda de manhã no mesmo dia), só não podem se sobrepor de verdade. Esse ajuste muda o modelo de dados e mexe em várias telas já construídas — ler inteiro antes de começar.

Specs canônicas já atualizadas: `docs/tela-01-criar-viagem.md` (seção "Datas" e "Detalhes por destino") e `docs/tela-04b-roteiro-e-dicas.md` (seção "Como os dias da viagem viram dias por destino"). Este documento é o guia técnico de migração — o que muda em cada arquivo de código.

## 1. `src/context/TripContext.tsx`

- `TripDestination` ganha dois campos novos:
  ```ts
  export interface TripDestination {
    id: string;
    cityId: string;
    city: string;
    country: string;
    currencyCode: string;
    dateStart: string | null;
    dateEnd: string | null;
  }
  ```
- **Remover** do `TripState`/`TripContextValue`/`TripProvider`: `dateStart`, `dateEnd` (nível viagem) e `setDateRange`. Não existe mais data solta da viagem — só por destino.
- `addDestination`: continua recebendo `Omit<TripDestination, 'id' | 'dateStart' | 'dateEnd'>` (o chamador só sabe cidade/país/moeda no momento da seleção) — ao criar o registro, preencher `dateStart: null, dateEnd: null` internamente.
- Nova função: `setDestinationDateRange(id: string, start: string | null, end: string | null)` — atualiza `dateStart`/`dateEnd` do destino com aquele `id`, mesmo padrão de `setDestinationCurrency`.
- `toggleItinerarySkipped`: hoje chama `splitDaysByDestination(destinations, dateStart, dateEnd)` (variáveis de nível viagem que deixam de existir) — trocar pra `splitDaysByDestination(destinations)` (nova assinatura, ver item 2).

## 2. `src/utils/itinerary.ts` — reescrever `splitDaysByDestination`

Em vez de um "intervalo contíguo por destino" (`startGlobalDay` + `dayCount`), a função agora **percorre dia a dia** e decide de quem é cada dia — isso resolve o caso de datas se tocando sem duplicar nem perder nenhum dia no Roteiro:

```ts
export interface DestinationDayRange {
  destinationId: string;
  cityId: string;
  city: string;
  /** dias globais (0-based, relativos ao início da viagem) que pertencem a esse destino, em ordem */
  globalDayIndexes: number[];
}

function toMs(iso: string): number {
  const { day, month, year } = fromISODate(iso);
  return new Date(year, month - 1, day).getTime();
}

export function getTripStartISO(destinations: TripDestination[]): string | null {
  const withStart = destinations.filter((d) => d.dateStart);
  if (withStart.length === 0) return null;
  return withStart.reduce((earliest, d) => (toMs(d.dateStart!) < toMs(earliest) ? d.dateStart! : earliest), withStart[0].dateStart!);
}

export function splitDaysByDestination(destinations: TripDestination[]): DestinationDayRange[] {
  const withDates = destinations.filter((d) => d.dateStart && d.dateEnd);
  if (withDates.length === 0) return [];

  const tripStartISO = getTripStartISO(destinations)!;
  const tripStartMs = toMs(tripStartISO);
  const tripEndMs = Math.max(...withDates.map((d) => toMs(d.dateEnd!)));
  const totalDays = Math.round((tripEndMs - tripStartMs) / 86_400_000) + 1;

  const byDestination = new Map<string, number[]>(withDates.map((d) => [d.id, []]));

  for (let globalDay = 0; globalDay < totalDays; globalDay++) {
    const dayMs = tripStartMs + globalDay * 86_400_000;
    // destinos cujo intervalo [dateStart, dateEnd] contém esse dia
    const matches = withDates.filter((d) => toMs(d.dateStart!) <= dayMs && dayMs <= toMs(d.dateEnd!));
    if (matches.length === 0) continue; // dia livre — nenhum destino reivindica, não entra em nenhuma lista

    // Dia de fronteira (fim de um destino == início do outro): pertence a
    // quem CHEGA (dateStart mais tardio entre os que bateram), não a quem
    // está saindo — é o dia em que a pessoa já está na cidade nova, mesmo
    // tendo saído da anterior de manhã. Ver docs/tela-01-criar-viagem.md.
    const owner = matches.reduce((latest, d) => (toMs(d.dateStart!) > toMs(latest.dateStart!) ? d : latest));
    byDestination.get(owner.id)!.push(globalDay);
  }

  return withDates.map((d) => ({
    destinationId: d.id,
    cityId: d.cityId,
    city: d.city,
    globalDayIndexes: byDestination.get(d.id)!,
  }));
}
```

- `globalDayToISO(tripStartISO, globalDayIndex)`: sem mudança de comportamento, só que `tripStartISO` agora vem de `getTripStartISO(destinations)` (novo helper acima), não mais de `trip.dateStart`.
- `computeDestinationAssignments` e `computeUnpinnedLocalDay`: hoje recebem `dayCount: number` — passar `dayCount = range.globalDayIndexes.length` no lugar de `range.dayCount` (o resto da lógica de round-robin/`localDayIndex` não muda, `localDayIndex` continua sendo um índice 0-based dentro da lista de dias daquele destino). Pra converter `localDayIndex` numa data de verdade, usar `globalDayToISO(tripStartISO, range.globalDayIndexes[localDayIndex])`.

## 3. `src/screens/CreateTrip.tsx` — validação corrigida (toque na fronteira permitido)

- Remover o `<DateRangeField startISO={trip.dateStart} ... />` solto da tela.
- `hasDates`: todo destino precisa ter `dateStart` e `dateEnd` preenchidos.
- **Validação de sobreposição (regra corrigida):** ordenar os destinos com data por `dateStart`; para cada par consecutivo nessa ordem, é inválido se `próximo.dateStart < anterior.dateEnd` (comparação estrita). Se `próximo.dateStart === anterior.dateEnd`, é **válido** (dia de fronteira/viagem). Exemplo válido: Buenos Aires 20-22/nov, Santiago 22-25/nov. Exemplo inválido: Buenos Aires 20-23/nov, Santiago 22-25/nov (23 e 22 seriam dias de sobreposição real de ambos).
- Mensagem de campos faltando ajusta o texto de "as datas" pra "as datas de cada destino"; erro de sobreposição só aparece quando a regra acima for violada de verdade (nunca por causa de datas apenas se tocando).

## 4. `src/components/inputs/DestinationField.tsx` e `DateRangeField.tsx`

- `DateRangeField` ganha uma prop opcional `label?: string` (default `"Datas"` se não passar).
- `DestinationField.tsx`: renomear a seção hoje chamada `currencyGroup` (label "Moeda por destino") pra um bloco mais amplo "Detalhes por destino", e dentro dela, pra cada destino, mostrar dois campos: o `CurrencySelect` que já existe e um novo `DateRangeField` (`label` tipo "Datas em {cidade}", `startISO={d.dateStart}`, `endISO={d.dateEnd}`, `onChange={(start, end) => onDateRangeChange(d.id, start, end)}`).
- `DestinationFieldProps` ganha `onDateRangeChange: (id: string, start: string | null, end: string | null) => void` — `CreateTrip.tsx` passa `trip.setDestinationDateRange`.
- Erro de sobreposição (item 3) aparece dentro da seção "Detalhes por destino", não em cada campo individual — é uma regra entre 2+ destinos.

## 5. `src/screens/Itinerary.tsx`

- `dayRanges = splitDaysByDestination(trip.destinations)`.
- `tripStartISO = getTripStartISO(trip.destinations)` (novo helper do item 2).
- **Total de dias da viagem** pra iterar no Roteiro = da menor `dateStart` até a maior `dateEnd` entre todos os destinos (mesmo `totalDays` calculado dentro de `splitDaysByDestination` — pode expor como retorno extra ou recalcular do mesmo jeito).
- Pra cada dia global desse total: procurar em qual `DestinationDayRange.globalDayIndexes` ele aparece. Se aparecer em algum, mostra normalmente (cidade + lugares daquele dia — dia de fronteira já vem corretamente atribuído a só um destino, o que chega). **Se não aparecer em nenhum, mostrar como "Dia N — [data] — Dia livre"**, sem lista de lugares nem botão de abrir dicas locais pra esse dia.
- Estado vazio (nenhum destino com datas preenchidas): usar a mesma mensagem/botão do ajuste 08.

## Checklist antes de considerar pronto

- `npm run build` limpo.
- Cadastrar Buenos Aires (20-22/nov) e Santiago (23-25/nov) — sem dia livre, dias 1-3 Buenos Aires, dias 4-6 Santiago.
- **Cadastrar com datas se tocando** (Buenos Aires 20-22/nov, Santiago 22-25/nov) — a Tela 1 **permite** avançar, e no Roteiro o dia 22/nov aparece **uma única vez**, do lado de Santiago (não duplicado, não do lado de Buenos Aires).
- Testar com um intervalo real entre os dois destinos (ex.: Buenos Aires até 22/nov, Santiago a partir de 24/nov) — o dia 23 aparece como "Dia livre".
- Tentar cadastrar datas com sobreposição de verdade (ex.: Buenos Aires 20-23/nov, Santiago 22-25/nov) — a Tela 1 barra o avanço com mensagem clara.
- Testar em 375px e 390px, nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`.
