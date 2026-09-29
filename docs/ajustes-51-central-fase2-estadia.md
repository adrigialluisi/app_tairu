# Ajuste 51 — Central, Fase 2: aba Estadia (formulário manual + busca de hotéis reais + upload de voucher)

Pedido da Adriana (24/set/2026): seguir pra próxima fase da Central. Estadia com campos manuais e upload de voucher, **mesma lógica de Transporte** (`ajustes-46` a `ajustes-50`). Decisões tomadas com ela antes de especificar:

- **Busca de hotéis reais entra já nesta fase**: ao digitar o nome da hospedagem, aparecem sugestões de uma lista curada de hotéis REAIS do destino (pesquisados, com endereço verificado). Ao escolher, preenche nome, tipo, endereço e cidade. Mesmo princípio do resto do protótipo: dado real, nunca fingido. Se a pessoa não achar o hotel dela, digita livre e segue.
- **Tipos de hospedagem**: Hotel, Apartamento, Hostel, Pousada. Os campos são os mesmos pra todos os tipos; só muda o ícone e o rótulo.
- **Organização por destino**, igual Transporte. Dá pra adicionar mais de uma estadia por destino.
- **Campo "Cidade / local"** próprio, porque o hotel pode ficar numa cidade vizinha ao destino (ex.: Sheraton Miramar em Viña del Mar, dentro do trecho de Santiago). Nasce preenchido com a cidade do destino, editável.
- Custo + moeda no formulário (começa em BRL, igual Transporte), **nunca aparece no card**. Só vai ser usado na Fase 4 (Custos).
- Check-in/check-out em texto livre `dd/mm/aaaa hh:mm`, igual Transporte (sem calendário nesta fase).

Arquivos já entregues junto com este doc (não precisa criar):
- `docs/dados/hotels.json`: 15 hospedagens reais (5 por destino). Endereços conferidos em sites oficiais / Michelin / Booking / Yelp em 24/set/2026.
- `public/mock-vouchers/voucher-hotel-buenosaires-magnolia.pdf`
- `public/mock-vouchers/voucher-hotel-santiago-cumbreslastarria.pdf`
- `public/mock-vouchers/voucher-pousada-sanpedro-casasolcor.pdf`

Os 3 vouchers seguem o cenário fixo de teste (20–25/nov/2026) e batem com os vouchers de transporte que já existem: Buenos Aires 20→22/11, Santiago 22→24/11 (chega às 16:20 do voo LA 4550; sai cedo pro voo LA 250 das 08:00), San Pedro 24→25/11. Todos têm rodapé dizendo que são documentos de exemplo.

---

## 0. Pré-requisito: San Pedro de Atacama ainda não existe no app

Descoberto ao preparar este ajuste: a parte 2 do `ajustes-30` (Atacama como 3º destino do cenário fixo) **nunca foi aplicada em `src/data/`**. `src/data/cities.json` não tem San Pedro de Atacama, e `src/data/places.json` / `src/data/localTips.json` só têm Buenos Aires e Santiago. Sem isso a pessoa não consegue cadastrar o 3º destino, e a Estadia de Atacama (e o voucher da Casa Solcor) não tem onde entrar.

**`src/data/cities.json`**: adicionar logo depois da linha de Viña del Mar:
```json
  { "id": "san-pedro-de-atacama-cl", "city": "San Pedro de Atacama", "country": "Chile", "currencyCode": "CLP" },
```

**`src/data/places.json`**: ⚠ **NÃO sobrescrever o arquivo inteiro com `docs/dados/places.json`.** O `src/` tem `wikiTitle` corrigidos à mão que nunca voltaram pro `docs/`. Só **acrescentar no fim do array** os 10 itens com `"cityId": "san-pedro-de-atacama-cl"` (ids começando com `atc-`) que estão em `docs/dados/places.json`. Os 43 itens existentes ficam intactos.

**`src/data/localTips.json`**: acrescentar no fim do array o bloco com `"cityId": "san-pedro-de-atacama-cl"` que está em `docs/dados/local-tips.json`.

Conferência: depois disso `src/data/places.json` tem 53 itens e `localTips.json` tem 3 blocos.

---

## 1. Dados de hotéis: `src/data/hotels.json` + `src/data/index.ts`

Copiar `docs/dados/hotels.json` → `src/data/hotels.json` (cópia inteira, o arquivo é novo).

Formato de cada item:
```json
{
  "id": "ba-alvear-palace",
  "cityId": "buenos-aires-ar",
  "name": "Alvear Palace Hotel",
  "type": "hotel",
  "address": "Av. Alvear 1891",
  "neighborhood": "Recoleta",
  "locality": "Buenos Aires",
  "wikiTitle": "Alvear Palace Hotel"
}
```
`wikiTitle` é opcional: só os 2 hotéis que têm artigo na Wikipedia (Alvear Palace, Palacio Duhau) têm. `locality` é a cidade onde o hotel fica de fato (Viña del Mar no Sheraton Miramar, mesmo estando no trecho de Santiago).

Em **`src/data/index.ts`**, junto dos outros imports/exports:
```ts
import hotelsRaw from './hotels.json';
import type { StayType } from '../context/TripContext';

export interface HotelEntry {
  id: string;
  cityId: string;
  name: string;
  type: StayType;
  address: string;
  neighborhood: string;
  locality: string;
  wikiTitle?: string;
}

export const hotels: HotelEntry[] = hotelsRaw as HotelEntry[];

/**
 * Busca de hospedagem real, só dentro da cidade do destino. 2+ letras,
 * ignora acento/caixa, casa nome, bairro ou cidade (locality). Reaproveita
 * o mesmo normalize() de searchCities.
 */
export function searchHotels(cityId: string, query: string): HotelEntry[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return hotels
    .filter((h) => h.cityId === cityId)
    .filter(
      (h) =>
        normalize(h.name).includes(q) ||
        normalize(h.neighborhood).includes(q) ||
        normalize(h.locality).includes(q),
    )
    .slice(0, 6);
}

export function getHotel(id: string | null): HotelEntry | undefined {
  return id ? hotels.find((h) => h.id === id) : undefined;
}
```

---

## 2. Modelo de dados: `src/context/TripContext.tsx`

Novos tipos, logo abaixo de `TransportItem`:
```ts
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
  checkInAt: string;
  checkOutAt: string;
  confirmationCode: string;
  roomType: string;
  /** nunca exibido no card/resumo, só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  voucherFileName: string | null;
}
```

No `TripState`: `stayItems: StayItem[];`
No `TripContextValue`:
```ts
  saveStayItem: (item: StayItem) => void;
  removeStayItem: (id: string) => void;
```
No provider, mesmo padrão de `transportItems`:
```ts
  const [stayItems, setStayItems] = useState<StayItem[]>([]);
  // ...no objeto do useMemo:
  stayItems,
  saveStayItem: (item) =>
    setStayItems((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      return exists ? prev.map((s) => (s.id === item.id ? item : s)) : [...prev, item];
    }),
  removeStayItem: (id) => setStayItems((prev) => prev.filter((s) => s.id !== id)),
  // ...no resetTrip():
  setStayItems([]);
```
E acrescentar `stayItems` no array de dependências do `useMemo`.

---

## 3. Extrair o upload de voucher pra um componente compartilhado

Regra do `CLAUDE.md` de reaproveitar componentes: o bloco de voucher hoje vive dentro do `TransportItemForm.tsx`. Em vez de copiar pra Estadia, extrair pra **`src/components/central/VoucherUpload.tsx`** + **`VoucherUpload.module.css`** e usar nos dois formulários. **O comportamento e o visual do Transporte não podem mudar** (é o mesmo JSX e CSS, só mudam de arquivo).

**`VoucherUpload.tsx`**:
```tsx
import { useRef, type ChangeEvent } from 'react';
import { UploadIcon, ReplaceIcon, TrashIcon } from '../shell/Icons';
import styles from './VoucherUpload.module.css';

interface VoucherUploadProps {
  fileName: string | null;
  /** true = reconhecido e preencheu os campos; false = não reconhecido; null = nada enviado nesta edição */
  recognized: boolean | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

export function VoucherUpload({ fileName, recognized, onFileSelected, onRemove }: VoucherUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFileSelected(file);
  }

  return (
    <div className={styles.voucherUpload}>
      {/* mesmo JSX que hoje está no TransportItemForm, do <input type="file"> até
          as duas mensagens (voucherMessageSuccess / voucherMessageMuted), trocando:
          - voucherFileName → fileName
          - voucherRecognized → recognized
          - handleVoucherFileChange → handleChange
          - handleRemoveVoucher → onRemove */}
    </div>
  );
}
```
**`VoucherUpload.module.css`**: mover pra cá as classes de voucher que hoje estão no `TransportItemForm.module.css` (`.voucherUpload`, `.hiddenFileInput`, `.voucherMessageSuccess`, `.voucherMessageMuted`, `.voucherUploadRow`, `.voucherHint`, `.voucherButton` (+ `:active`), `.voucherAttached`, `.voucherFileIcon`, `.voucherFileName`, `.voucherFileActions`, `.voucherIconButton` (+ `:active`), `.voucherIconButtonDanger`), e apagar elas do `TransportItemForm.module.css`.

**`TransportItemForm.tsx`**: trocar o bloco `<div className={styles.voucherUpload}>…</div>` por:
```tsx
<VoucherUpload
  fileName={voucherFileName}
  recognized={voucherRecognized}
  onFileSelected={handleVoucherFile}
  onRemove={handleRemoveVoucher}
/>
```
`handleVoucherFileChange(e)` vira `handleVoucherFile(file: File)`: mesma lógica, sem as 3 primeiras linhas que liam o evento. Remover `fileInputRef`, `useRef`, `ChangeEvent` e os imports de ícones que ficarem sem uso.

---

## 4. Vouchers de estadia (mock): `src/data/mockVouchers.ts`

Mesmo mecanismo do Transporte: reconhecimento **só pelo nome do arquivo** (sem OCR, sem backend). Acrescentar no fim do arquivo:
```ts
import type { StayItem } from '../context/TripContext';

type MockStayVoucherFields = Omit<
  StayItem,
  'id' | 'destinationId' | 'costAmount' | 'costCurrencyCode' | 'voucherFileName'
>;

export const MOCK_STAY_VOUCHERS: Record<string, MockStayVoucherFields> = {
  'voucher-hotel-buenosaires-magnolia.pdf': {
    type: 'hotel',
    hotelId: 'ba-magnolia-boutique',
    name: 'Magnolia Hotel Boutique',
    address: 'Julián Álvarez 1746, Palermo Soho',
    locality: 'Buenos Aires',
    checkInAt: '20/11/2026 15:00',
    checkOutAt: '22/11/2026 11:00',
    confirmationCode: 'MAG-58213',
    roomType: 'Duplo Standard',
  },
  'voucher-hotel-santiago-cumbreslastarria.pdf': {
    type: 'hotel',
    hotelId: 'scl-cumbres-lastarria',
    name: 'Hotel Cumbres Lastarria',
    address: 'José Victorino Lastarria 299, Barrio Lastarria',
    locality: 'Santiago',
    checkInAt: '22/11/2026 17:00',
    checkOutAt: '24/11/2026 06:00',
    confirmationCode: 'CLT-40977',
    roomType: 'Superior Queen',
  },
  'voucher-pousada-sanpedro-casasolcor.pdf': {
    type: 'pousada',
    hotelId: 'atc-casa-solcor',
    name: 'Casa Solcor',
    address: 'Antonio León 74, Ayllú de Solcor',
    locality: 'San Pedro de Atacama',
    checkInAt: '24/11/2026 14:00',
    checkOutAt: '25/11/2026 11:00',
    confirmationCode: 'SOL-11846',
    roomType: 'Duplo',
  },
};

export function lookupMockStayVoucher(fileName: string): MockStayVoucherFields | null {
  return MOCK_STAY_VOUCHERS[fileName.toLowerCase()] ?? null;
}
```
(juntar o `import type { StayItem }` com o import que já existe no topo do arquivo.)

---

## 5. Resumo do card: `src/utils/staySummary.ts` (novo)

```ts
import type { StayItem, StayType } from '../context/TripContext';

const TYPE_LABELS: Record<StayType, string> = {
  hotel: 'Hotel',
  apartamento: 'Apartamento',
  hostel: 'Hostel',
  pousada: 'Pousada',
};

const TYPE_ICONS: Record<StayType, string> = {
  hotel: '🏨',
  apartamento: '🏠',
  hostel: '🛏️',
  pousada: '🏡',
};

export function stayTypeLabel(type: StayType): string {
  return TYPE_LABELS[type];
}

export function stayTypeIcon(type: StayType): string {
  return TYPE_ICONS[type];
}

export function stayItemTitle(item: StayItem): string {
  return item.name.trim() || stayTypeLabel(item.type);
}

/** Linhas de detalhe do card, uma informação por linha (mesmo critério do ajustes-48). Nunca inclui custo. */
export function stayItemDetailRows(item: StayItem): string[] {
  const rows: string[] = [];
  const place = [item.address, item.locality].filter(Boolean).join(' · ');
  if (place) rows.push(place);
  if (item.checkInAt) rows.push(`Check-in: ${item.checkInAt}`);
  if (item.checkOutAt) rows.push(`Check-out: ${item.checkOutAt}`);
  const extra = [item.roomType, item.confirmationCode && `Reserva ${item.confirmationCode}`].filter(Boolean).join(' · ');
  if (extra) rows.push(extra);
  return rows.length ? rows : ['Detalhes a preencher'];
}
```

---

## 6. Componentes novos em `src/components/central/`

Estrutura espelhada no Transporte:

| Transporte (existe) | Estadia (novo) |
|---|---|
| `TransportSection` | `StaySection` |
| `TransportDestinationGroup` | `StayDestinationGroup` |
| `TransportItemCard` | `StayItemCard` |
| `TransportItemForm` | `StayItemForm` |
| (n/a) | `HotelSearchField` |

### 6.1 `StaySection.tsx`
Igual `TransportSection.tsx`: mesmo estado vazio (`EmptyTripState`, mesma mensagem) e um `StayDestinationGroup` por destino. **Reaproveitar `TransportSection.module.css`** (só tem `.groups` com gap de 32px), sem criar CSS novo.

### 6.2 `StayDestinationGroup.tsx`
Cópia da lógica do `TransportDestinationGroup.tsx` (mesmo header cidade + datas, mesmo `editingId` começando em `'new'` quando não tem item, **reaproveitando `TransportDestinationGroup.module.css`**), trocando:
- `trip.transportItems` → `trip.stayItems`, `saveTransportItem`/`removeTransportItem` → `saveStayItem`/`removeStayItem`
- `TransportItemCard`/`TransportItemForm` → `StayItemCard`/`StayItemForm`
- o form recebe `destination={destination}` (o objeto inteiro, não só o id, porque precisa de `cityId` pra busca e de `city` pro valor inicial de "Cidade / local")
- botão: `+ Adicionar estadia`

### 6.3 `StayItemCard.tsx`
Mesmo layout do `TransportItemCard` (**reaproveitar `TransportItemCard.module.css`**), com uma diferença: quando a estadia veio da busca e o hotel tem `wikiTitle`, mostra uma miniatura real no lugar do ícone de tipo.
```tsx
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import { getHotel } from '../../data';
import { stayItemDetailRows, stayItemTitle, stayTypeIcon, stayTypeLabel } from '../../utils/staySummary';
import type { StayItem } from '../../context/TripContext';
import styles from './TransportItemCard.module.css';
import stayStyles from './StayItemCard.module.css';

export function StayItemCard({ item, onEdit }: { item: StayItem; onEdit: () => void }) {
  const wikiTitle = getHotel(item.hotelId)?.wikiTitle ?? '';
  // hook sempre chamado (regra dos hooks); com '' não acha nada e cai no ícone
  const photo = usePlaceThumbnail(wikiTitle);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {photo ? (
          <img src={photo} alt="" className={stayStyles.thumb} loading="lazy" />
        ) : (
          <span className={styles.icon} aria-hidden="true">{stayTypeIcon(item.type)}</span>
        )}
        <span className={stayStyles.titleWrap}>
          <span className={styles.title}>{stayItemTitle(item)}</span>
          <span className={stayStyles.typeLabel}>{stayTypeLabel(item.type)}</span>
        </span>
        <button type="button" className={styles.editButton} onClick={onEdit}>Editar</button>
      </div>
      <div className={styles.detailRows}>
        {stayItemDetailRows(item).map((row, i) => (
          <p key={i} className={styles.detail}>{row}</p>
        ))}
      </div>
      {item.voucherFileName && (
        <p className={styles.voucherNote}><span aria-hidden="true">📎</span> Voucher anexado</p>
      )}
    </div>
  );
}
```
**`StayItemCard.module.css`** (só o que é novo):
```css
.thumb {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.titleWrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.typeLabel {
  font-size: 12px;
  color: var(--muted);
}
```
Obs.: `.title` do `TransportItemCard.module.css` tem `flex: 1`. Dentro de `.titleWrap` (coluna) isso não atrapalha, mas se aparecer algum espaço estranho, sobrescrever com `flex: none` num seletor local.

### 6.4 `HotelSearchField.tsx` (combobox de busca)
Campo de texto "Nome da hospedagem" com sugestões de `searchHotels(cityId, query)`. **Reaproveitar o padrão e o CSS do `DestinationField`** (`role="combobox"`, `aria-activedescendant`, setas ↑/↓, Enter, Esc, `onMouseDown preventDefault` nas opções, abre com 2+ letras). Pode importar `DestinationField.module.css` direto (`.comboWrap`, `.inputWrap`, `.input`, `.listbox`, `.option`, `.optionActive`, `.optionCountry`, `.empty`) e o `.label` do `TextField.module.css`, pra ficar visualmente igual aos outros campos.

Diferenças em relação ao `DestinationField`:
- É um campo controlado de valor livre: `value` (o nome) e `onChange(text)` são do formulário. Digitar livre é permitido e é o caminho normal quando o hotel não está na lista.
- Escolher uma sugestão chama `onSelectHotel(hotel: HotelEntry)` e fecha a lista (sem chips).
- Cada opção mostra `name` na primeira linha e, embaixo (classe `.optionCountry`), `${neighborhood} · ${locality}`, e o ícone do tipo antes do nome (`stayTypeIcon(hotel.type)`).
- Quando tem 2+ letras e nenhum resultado: `<li className={styles.empty}>Nenhuma hospedagem da nossa lista. Pode continuar digitando e preencher o resto à mão.</li>`
- Abaixo do input, um hint fixo (13px, `var(--muted)`): `Digite pra buscar hotéis de {cidade}, ou preencha à mão.`

Props:
```ts
interface HotelSearchFieldProps {
  id: string;
  cityId: string;
  cityName: string;
  value: string;
  onChange: (value: string) => void;
  onSelectHotel: (hotel: HotelEntry) => void;
}
```

### 6.5 `StayItemForm.tsx`
Mesma estrutura do `TransportItemForm` (**reaproveitar `TransportItemForm.module.css`** pra `.form`, `.costRow`, `.actions`, `.secondaryActions`, `.textButton`, `.removeButton`). Ordem dos elementos:

1. `<VoucherUpload …/>` (componente da seção 3)
2. `OptionChipGroup` legend "Tipo de hospedagem", opções `🏨 Hotel`, `🏠 Apartamento`, `🛏️ Hostel`, `🏡 Pousada` (montar com `stayTypeIcon`/`stayTypeLabel`, igual `TYPE_OPTIONS` do Transporte). Inicia em `'hotel'`.
3. `HotelSearchField`: "Nome da hospedagem"
4. `TextField` "Endereço"
5. `TextField` "Cidade / local", placeholder `Ex.: Viña del Mar`. **Valor inicial = `destination.city`** quando está criando.
6. `TextField` "Check-in", placeholder `dd/mm/aaaa hh:mm`
7. `TextField` "Check-out", placeholder `dd/mm/aaaa hh:mm`
8. `TextField` "Código da reserva (opcional)"
9. `TextField` "Tipo de quarto (opcional)", placeholder `Ex.: Duplo, Suíte`
10. `.costRow`: "Custo (opcional)" + `CurrencySelect` "Moeda do custo", inicia em `'BRL'` (igual Transporte, `ajustes-49`)
11. Ações: `Salvar estadia` (Button fullWidth) / `Cancelar` / `Remover estadia` (só editando)

Todos os `TextField` com `autoComplete="off"` (autofill do navegador já deu problema antes, `ajustes-19`).

Comportamentos:
- **Escolher hotel na busca** (`onSelectHotel`): preenche `hotelId = hotel.id`, `name`, `type = hotel.type`, `address = ${hotel.address}, ${hotel.neighborhood}`, `locality = hotel.locality`.
- **Digitar no nome depois de ter escolhido** (`onChange` do HotelSearchField): atualiza `name` e zera `hotelId` pra `null` (deixou de ser aquele hotel da lista; a foto some do card). Endereço/cidade ficam como estão, a pessoa ajusta se quiser.
- **Voucher reconhecido** (`lookupMockStayVoucher(file.name)`): preenche `type`, `hotelId`, `name`, `address`, `locality`, `checkInAt`, `checkOutAt`, `confirmationCode`, `roomType`. `voucherRecognized` true/false exatamente como no Transporte.
- **Salvar**: `id = initialItem?.id ?? \`stay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}\``, monta o `StayItem` completo e chama `onSave`. Sem validação obrigatória (igual Transporte).

Props:
```ts
interface StayItemFormProps {
  destination: TripDestination;
  initialItem: StayItem | null;
  onSave: (item: StayItem) => void;
  onCancel: () => void;
  onRemove?: () => void;
}
```

---

## 7. Ligar a aba: `src/screens/Central.tsx`

- Importar `StaySection`.
- No `role="tabpanel"`: `transporte` → `<TransportSection />`, `estadia` → `<StaySection />`, `outros` continua o placeholder.
- Tirar `estadia` do objeto `PANELS` (fica só `outros`) e ajustar o tipo pra `Record<'outros', …>`.

---

## 8. Fechamento

- `CLAUDE.md`: na listagem de telas/seções, item da Central, registrar que a aba Estadia foi construída (ajustes-51), com busca de hotéis reais em `src/data/hotels.json` (fonte em `docs/dados/hotels.json`) e o `VoucherUpload` compartilhado entre Transporte e Estadia. Na seção de princípios de dado real, citar `hotels.json` junto de `places.json`/`localTips.json`.
- Rodar `npm run lint` e `npm run build`. Tem que passar sem erro.
- Checklist de acessibilidade do `CLAUDE.md`: foco visível no combobox e nas opções, alvos de toque de 44px, combobox navegável só por teclado.

## 9. Como testar (roteiro rápido)

1. Início → Nova viagem → cadastrar Buenos Aires (20–22/11), Santiago (22–24/11) e **San Pedro de Atacama** (24–25/11). Se San Pedro não aparecer no autocomplete, a seção 0 não foi aplicada.
2. Central → aba Estadia: aparecem 3 grupos, cada um já com o formulário aberto.
3. Buenos Aires: digitar "palermo" → aparecem Magnolia e Home Hotel → escolher Magnolia → nome, tipo, endereço e cidade preenchidos. Salvar → card com ícone 🏨, nome, "Hotel", endereço · cidade.
4. Buenos Aires → "+ Adicionar estadia" → digitar "alvear" → escolher Alvear Palace → salvar → card com **foto real** no lugar do ícone (se a Wikipedia responder).
5. Santiago: enviar `voucher-hotel-santiago-cumbreslastarria.pdf` → mensagem "✓ Campos preenchidos automaticamente", campos preenchidos, card de voucher com substituir/excluir.
6. Santiago → adicionar outra → digitar "viña" → Sheraton Miramar aparece com "Beira-mar · Viña del Mar" → escolher → Cidade / local = Viña del Mar.
7. San Pedro: enviar `voucher-pousada-sanpedro-casasolcor.pdf` → tipo muda sozinho pra 🏡 Pousada.
8. Digitar um nome que não existe ("Airbnb do Juan"), tipo Apartamento, preencher à mão → salva normal, card com 🏠.
9. Editar uma estadia, trocar de aba (Transporte) e voltar → dados continuam lá. Remover uma estadia → some.
10. Aba Transporte continua funcionando igual antes (upload de voucher, substituir, excluir). Isso confere a extração do `VoucherUpload`.
