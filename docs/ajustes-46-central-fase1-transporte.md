# Ajuste 46 — Central, Fase 1: aba Transporte organizada por destino, com formulário salvar/editar

Pedido da Adriana (22/set/2026): dar conteúdo de verdade à Central (hoje placeholder "em construção" nas 3 abas). Ela descreveu um bloco grande de uma vez — decidido em conversa que vai ser entregue em **4 fases sequenciais**, cada uma testável sozinha:

1. **(este ajuste) Transporte** — organizado por destino, tipo (Voo/Ônibus/Carro locado) com campos próprios, salvar → resumo com Editar, dá pra adicionar mais de um por destino.
2. **Estadia** — mesmo padrão de formulário/resumo + busca de hotel (lista curada de hotéis reais por destino, com foto/nome/endereço).
3. **Upload de voucher (mock)** — arquivos de exemplo (voo, ônibus/trem, carro locado, hotel) que, ao serem "enviados", preenchem os campos automaticamente.
4. **Custos** — os valores indicados em Transporte/Estadia (campo já existe desde a Fase 1, mas nunca aparece ali) passam a alimentar a tela de Custos, que ainda está em "em construção" e será desenhada nessa fase.

Decisões tomadas com ela antes de especificar: organizar por destino (não lista única da viagem toda) — cabe o cenário que ela deu de exemplo, tipo um carro locado com retirada/devolução em Viña del Mar dentro do trecho de Santiago, sem precisar inventar uma entidade "local" nova (os próprios campos de origem/destino ou retirada/devolução de cada tipo de transporte já resolvem isso — quem vai precisar de um campo de "local específico" à parte é a Estadia, na Fase 2, porque lá o endereço do hotel pode ficar numa cidade vizinha ao destino). Custo é um campo do formulário, mas nunca aparece no card/resumo — só granzy pra Fase 4. Datas/horas são campo de texto livre nessa fase (placeholder indicando o formato), não o mesmo componente de máscara+calendário que `DateRangeField` usa pras datas gerais do destino — se depois de ver funcionando ela quiser esse nível de acabamento, vira um ajuste à parte.

## 1. Modelo de dados — `src/context/TripContext.tsx`

Novos tipos (união discriminada por `type`, cada variante só com os campos que faz sentido pra aquele meio de transporte):

```ts
export type TransportType = 'voo' | 'onibus' | 'carro-locado';

interface TransportItemBase {
  id: string;
  /** TripDestination.id — a qual trecho da viagem esse transporte pertence */
  destinationId: string;
  /** nunca exibido no card/resumo — só guardado pra Fase 4 (Custos) */
  cost: string;
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

export interface CarRentalTransportItem extends TransportItemBase {
  type: 'carro-locado';
  company: string;
  vehicleCategory: string;
  pickupLocation: string;
  pickupAt: string;
  dropoffLocation: string;
  dropoffAt: string;
}

export type TransportItem = FlightTransportItem | BusTransportItem | CarRentalTransportItem;
```

No `TripState`/`TripContextValue`/`TripProvider`, seguir exatamente o mesmo padrão já usado pra `selectedPlaces` (lista + upsert por id + remove):

- `TripState` ganha `transportItems: TransportItem[];`
- `TripContextValue` ganha:
  ```ts
  saveTransportItem: (item: TransportItem) => void; // cria se o id não existe, substitui se existe
  removeTransportItem: (id: string) => void;
  ```
- `TripProvider`: `const [transportItems, setTransportItems] = useState<TransportItem[]>([]);`, incluído no `value` do `useMemo` e na array de dependências, com:
  ```ts
  saveTransportItem: (item) =>
    setTransportItems((prev) => {
      const exists = prev.some((t) => t.id === item.id);
      return exists ? prev.map((t) => (t.id === item.id ? item : t)) : [...prev, item];
    }),
  removeTransportItem: (id) => setTransportItems((prev) => prev.filter((t) => t.id !== id)),
  ```
- `resetTrip()` ganha `setTransportItems([]);` junto dos outros resets.

## 2. Utilitário de resumo — novo arquivo `src/utils/transportSummary.ts`

```ts
import type { TransportItem, TransportType } from '../context/TripContext';

const TYPE_LABELS: Record<TransportType, string> = {
  voo: 'Voo',
  onibus: 'Ônibus',
  'carro-locado': 'Carro locado',
};

const TYPE_ICONS: Record<TransportType, string> = {
  voo: '✈️',
  onibus: '🚌',
  'carro-locado': '🚗',
};

export function transportTypeLabel(type: TransportType): string {
  return TYPE_LABELS[type];
}

export function transportTypeIcon(type: TransportType): string {
  return TYPE_ICONS[type];
}

/** Linha de título do card — tipo + identificador principal (nunca custo). */
export function transportItemTitle(item: TransportItem): string {
  switch (item.type) {
    case 'voo':
      return [item.company, item.flightNumber].filter(Boolean).join(' ') || 'Voo';
    case 'onibus':
      return item.company || 'Ônibus';
    case 'carro-locado':
      return [item.company, item.vehicleCategory].filter(Boolean).join(' — ') || 'Carro locado';
  }
}

/** Linha de detalhe do card — trajeto/local + horários (nunca custo). */
export function transportItemDetail(item: TransportItem): string {
  switch (item.type) {
    case 'voo':
    case 'onibus': {
      const route = [item.origin, item.destination].filter(Boolean).join(' → ');
      const times = [item.departureAt, item.arrivalAt].filter(Boolean).join(' – ');
      return [route, times].filter(Boolean).join(' · ') || 'Detalhes a preencher';
    }
    case 'carro-locado': {
      const parts: string[] = [];
      const pickup = [item.pickupLocation, item.pickupAt].filter(Boolean).join(', ');
      const dropoff = [item.dropoffLocation, item.dropoffAt].filter(Boolean).join(', ');
      if (pickup) parts.push(`Retirada: ${pickup}`);
      if (dropoff) parts.push(`Devolução: ${dropoff}`);
      return parts.join(' · ') || 'Detalhes a preencher';
    }
  }
}
```

## 3. Novos componentes — pasta `src/components/central/`

Seguir o mesmo padrão visual/token do resto do app (cards com `background: var(--card)`, `border: 1px solid var(--card-border)`, raio de canto por plataforma via `--radius-android-card`/equivalente iOS, espaçamento pela escala `--space-*` — mesma linguagem de `StepSection.module.css` e do `.detailsCard` em `DestinationField.module.css`, pra não destoar visualmente do resto do app).

### `TransportItemForm.tsx` — formulário de adicionar/editar um item

```tsx
interface TransportItemFormProps {
  destinationId: string;
  /** null = criando um novo item; preenchido = editando um item existente */
  initialItem: TransportItem | null;
  onSave: (item: TransportItem) => void;
  onCancel: () => void;
  /** só passado quando initialItem existe (editando) */
  onRemove?: () => void;
}
```
- Seletor de tipo com `OptionChipGroup<TransportType>` (legend "Tipo de transporte", opções Voo/Ônibus/Carro locado) — estado local `type`, inicializado de `initialItem?.type ?? null`.
- Campos por tipo, todos `TextField` (texto livre, sem máscara nessa fase — placeholders indicando o formato esperado, ex.: `placeholder="dd/mm/aaaa hh:mm"` nos campos de data/hora):
  - **Voo**: Companhia aérea, Número do voo, Origem, Destino, Data/hora de partida, Data/hora de chegada.
  - **Ônibus**: Empresa, Origem, Destino, Data/hora de saída, Data/hora de chegada.
  - **Carro locado**: Locadora, Categoria do veículo (ex.: Econômico, SUV), Local de retirada, Data/hora de retirada, Local de devolução, Data/hora de devolução.
  - Campos renderizados só depois que um `type` é escolhido (antes disso, só aparece o seletor).
- **Custo (opcional)** — `TextField` sempre visível no fim do formulário, independente do tipo (placeholder "Ex.: R$ 450" — texto livre, sem validação de moeda). Nunca é lido de volta em nenhum resumo/card desta fase.
- Botão **"Salvar transporte"** (`Button fullWidth`, primário): habilitado só com `type` escolhido. Ao clicar, monta o `TransportItem` completo (usa `initialItem.id` se estiver editando, senão gera um id novo no mesmo padrão do resto do contexto — `` `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` ``) e chama `onSave`.
- Link/botão de texto **"Cancelar"** ao lado do Salvar, chama `onCancel` sem gravar nada.
- Quando `onRemove` existe (só no modo edição): um botão de texto discreto **"Remover transporte"** (cor `--error` ou `--muted`, sem confirmação — mesmo padrão sem confirm dialog do `Chip`/`removeDestination` já usados no app), chama `onRemove`.

### `TransportItemCard.tsx` — resumo salvo, com Editar

```tsx
interface TransportItemCardProps {
  item: TransportItem;
  onEdit: () => void;
}
```
Card com ícone do tipo (`transportTypeIcon`) + título em negrito (`transportItemTitle`) numa linha, botão "Editar" alinhado à direita (mesmo texto/estilo do botão "Editar" do `StepSection`), e a linha de detalhe (`transportItemDetail`) abaixo, cor `--muted`. **Nunca mostra o campo de custo.**

### `TransportDestinationGroup.tsx` — um destino + seus itens

```tsx
interface TransportDestinationGroupProps {
  destination: TripDestination;
}
```
- Usa `useTrip()` internamente.
- Título: `{destination.city}, {destination.country}` (+ linha pequena com as datas do destino, se preenchidas, mesmo formato usado em `formatDestinoSummaryLine` de `CreateTrip.tsx` — pode reaproveitar/adaptar).
- Estado local: `const [editingId, setEditingId] = useState<string | 'new' | null>(null);`
- Filtra `trip.transportItems` por `destinationId === destination.id`.
- Pra cada item: se `editingId === item.id`, renderiza `TransportItemForm` (`initialItem={item}`, `onSave` chama `trip.saveTransportItem` e depois `setEditingId(null)`, `onCancel` só fecha, `onRemove` chama `trip.removeTransportItem(item.id)` e fecha); senão, renderiza `TransportItemCard` (`onEdit` seta `editingId` pro id do item).
- Se `editingId === 'new'`: renderiza `TransportItemForm` no fim da lista (`initialItem={null}`, `destinationId={destination.id}`, `onSave` chama `trip.saveTransportItem(novoItem)` e fecha).
- Se `editingId === null`: mostra o botão **"+ Adicionar transporte"** (`Button variant="secondary"`, sem `fullWidth` — menor ênfase que o "Salvar", igual o resto do app já reserva `secondary` pra ações de apoio) que abre `editingId = 'new'`.
- Enquanto algum item do MESMO grupo está sendo editado/adicionado, esconder o botão "+ Adicionar transporte" (evita competir com o formulário aberto).

### `TransportSection.tsx` — ponto de entrada da aba

```tsx
export function TransportSection() {
  const trip = useTrip();
  if (trip.destinations.length === 0) {
    return <EmptyTripState message="Essa viagem ainda não tem destinos cadastrados. Volte e cadastre a viagem primeiro." />;
  }
  return (
    <div className={styles.groups}>
      {trip.destinations.map((d) => (
        <TransportDestinationGroup key={d.id} destination={d} />
      ))}
    </div>
  );
}
```
`.groups` no CSS: `display: flex; flex-direction: column; gap: var(--space-8);` (mesmo espaçamento entre-grupos já usado no `.content` do `ScreenShell`).

## 4. `src/screens/Central.tsx` — trocar o conteúdo da aba Transporte

- Importar `TransportSection` de `../components/central/TransportSection`.
- `PANELS` passa a ter só as chaves `'estadia' | 'outros'` (tira `'transporte'` do objeto — não é mais usado como placeholder).
- Trocar o corpo do `tabpanel`:
  ```tsx
  <div role="tabpanel">
    {tab === 'transporte' ? (
      <TransportSection />
    ) : (
      <div className={styles.wrap}>
        <span className={styles.icon} aria-hidden="true">{PANELS[tab].icon}</span>
        <p className={styles.message}>{PANELS[tab].message}</p>
      </div>
    )}
  </div>
  ```
  (`styles.wrap` — que centraliza ícone+mensagem — continua só pras abas ainda-placeholder; `TransportSection` cuida do próprio layout, alinhado ao topo, rolável.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Com destinos cadastrados (ex.: Buenos Aires + Santiago): a aba Transporte mostra um grupo por destino, cada um com "+ Adicionar transporte".
- Adicionar um Voo num grupo: escolher tipo → campos de voo aparecem → preencher → Salvar → vira card com ícone ✈️, companhia/número, trajeto e horários — sem mostrar o custo, mesmo se ele foi preenchido.
- Testar os 3 tipos (Voo, Ônibus, Carro locado) — cada um mostra só os campos certos.
- Adicionar mais de um item no mesmo destino (ex.: o exemplo da Adriana: carro locado + depois outro item) — os dois ficam listados, cada um editável independente.
- Clicar "Editar" num item salvo: reabre o formulário preenchido, "Salvar transporte" atualiza o mesmo card (não duplica), "Remover transporte" some com o item.
- Sem destinos cadastrados: aba Transporte mostra o estado vazio com botão "Ir pra Destinos" (mesmo componente `EmptyTripState` já usado no Roteiro).
- Abas Estadia e Outros continuam exatamente como estão hoje (placeholder "em construção") — essa fase não mexe nelas.
