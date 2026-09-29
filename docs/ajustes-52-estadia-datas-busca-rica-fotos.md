# Ajuste 52 — Estadia: check-in/check-out num campo só com calendário, sem "Cancelar", busca de hotel com foto e detalhes

Feedback da Adriana (24/set/2026), vendo o `ajustes-51` construído (formulário de Estadia):

1. **Check-in e check-out viram um componente só, com calendário.** Hoje são dois campos de texto livre `dd/mm/aaaa hh:mm`.
2. **Tirar o "Cancelar" do fim do formulário.** Não faz sentido ali.
3. **Busca de hotel com mais detalhes e com foto.** Pergunta dela: "Onde aparecem as fotos dele?". Hoje a foto só aparece no card depois de salvar, e só em 2 dos 15 hotéis (os que têm artigo na Wikipedia).

Decisões tomadas com ela (AskUserQuestion) antes de especificar:
- **Fotos**: uma foto oficial de cada hotel, tirada do site do próprio hotel e salva na pasta do protótipo (`public/hotels/`). Uso interno de teste de usabilidade, não publicado. Todos os 15 hotéis com foto, funciona sem internet. **Substitui a busca na Wikipedia para hotéis** (a Wikipedia continua valendo pra Lugares/Roteiro/Início, nada muda lá).
- **Detalhes na busca**: categoria (estrelas ou selo), descrição curta, faixa de preço ($ a $$$$) e distância do centro. Todos já estão em `docs/dados/hotels.json` (atualizado junto com este doc).

Sobre os dados novos do `hotels.json`:
- `stars`: só quando a categoria é informada pelo próprio hotel ou por fontes de reserva (Booking, Michelin, site oficial). Quando não existe classificação oficial, fica `null` e aparece o `badge` (ex.: "Hostel", "Relais & Châteaux", "Lodge tudo incluso", "Bed & breakfast").
- `priceLevel` (1 a 4) é **relativo aos outros hotéis do mesmo destino**, não um valor em dinheiro. Curadoria minha, mesmo critério das descrições de Lugares.
- `distanceLabel` é aproximado (referência: Obelisco em Buenos Aires, Plaza de Armas em Santiago, centro do povoado em San Pedro).
- `photo` é o caminho da foto local (`hotels/<id>.jpg`); `photoSourceUrl` é de onde tirar a foto (seção 1). `wikiTitle` saiu.

---

## 1. Fotos dos hotéis: baixar pra `public/hotels/`

Criar a pasta `public/hotels/`. Para cada item de `docs/dados/hotels.json`:
1. Abrir `photoSourceUrl`. Se já for uma imagem (Palacio Duhau e Magnolia Buenos Aires), baixar direto. Se for a página do hotel, pegar a imagem da meta tag `og:image`; se não tiver, a primeira foto grande da página (fachada, quarto ou área comum; nunca logo nem ícone).
2. Salvar como `public/hotels/<id>.jpg` (ex.: `public/hotels/ba-alvear-palace.jpg`).
3. Reduzir pra no máximo 800px de largura, JPEG. No Mac: `sips -Z 800 -s format jpeg <arquivo> --out public/hotels/<id>.jpg`.

Se algum hotel não tiver foto utilizável, **não inventar e não usar foto de outro lugar**: pular esse arquivo e me avisar no fim quais faltaram. O app já trata foto ausente (seção 4, `onError`), então não quebra nada.

No fim, listar quais das 15 fotos foram salvas.

---

## 2. Dados: `src/data/hotels.json` + `src/data/index.ts`

Copiar `docs/dados/hotels.json` → `src/data/hotels.json` (substitui o arquivo inteiro; aqui pode, porque não teve correção manual no `src/`).

Em `src/data/index.ts`, atualizar `HotelEntry`:
```ts
export interface HotelEntry {
  id: string;
  cityId: string;
  name: string;
  type: StayType;
  address: string;
  neighborhood: string;
  locality: string;
  /** 1–5 quando existe classificação oficial; null quando não existe (aí vale o badge) */
  stars: number | null;
  badge: string | null;
  /** 1–4, relativo aos outros hotéis do mesmo destino */
  priceLevel: 1 | 2 | 3 | 4;
  distanceLabel: string;
  description: string;
  /** caminho relativo a public/, ex.: "hotels/ba-alvear-palace.jpg" */
  photo: string | null;
  photoSourceUrl: string;
}
```
(tirar o `wikiTitle?`.)

Mudar `searchHotels` pra **mostrar sugestões mesmo sem digitar**: com o campo vazio (ou menos de 2 letras), devolve todos os hotéis da cidade; com 2+ letras, filtra como hoje. Tirar o `.slice(0, 6)`: são 5 por cidade, cabe tudo.
```ts
export function searchHotels(cityId: string, query: string): HotelEntry[] {
  const inCity = hotels.filter((h) => h.cityId === cityId);
  const q = normalize(query.trim());
  if (q.length < 2) return inCity;
  return inCity.filter(
    (h) =>
      normalize(h.name).includes(q) ||
      normalize(h.neighborhood).includes(q) ||
      normalize(h.locality).includes(q),
  );
}
```

Novo helper em `src/utils/staySummary.ts`:
```ts
import type { HotelEntry } from '../data';

/** "$$" até "$$$$". Sempre acompanhado de texto acessível (ver HotelInfo). */
export function priceLevelLabel(level: HotelEntry['priceLevel']): string {
  return '$'.repeat(level);
}

export function priceLevelA11y(level: HotelEntry['priceLevel']): string {
  return ['', 'Econômico', 'Preço médio', 'Preço alto', 'Luxo'][level];
}

export function hotelPhotoUrl(hotel: Pick<HotelEntry, 'photo'>): string | null {
  return hotel.photo ? `${import.meta.env.BASE_URL}${hotel.photo}` : null;
}
```

---

## 3. Check-in/check-out num campo só, com calendário

### 3.1 Modelo: `src/context/TripContext.tsx`
No `StayItem`, trocar
```ts
  checkInAt: string;
  checkOutAt: string;
```
por
```ts
  /** ISO yyyy-mm-dd, igual as datas de TripDestination */
  checkInDate: string | null;
  checkOutDate: string | null;
  /** "hh:mm" ou "" (opcional) */
  checkInTime: string;
  checkOutTime: string;
```

### 3.2 `DateRangeField`: aceitar campo não obrigatório
Hoje o label sempre mostra `*` e o texto "(obrigatório…)". Adicionar prop `required?: boolean` (default `true`, então Destinos não muda nada). Com `required={false}`, não mostra o `*` e o texto escondido vira só "(formato dia/mês/ano até dia/mês/ano)". Nenhuma outra mudança no componente.

### 3.3 `StayItemForm.tsx`
Trocar os dois `TextField` de Check-in e Check-out por:

```tsx
<DateRangeField
  key={datesKey}
  label="Check-in e check-out"
  required={false}
  startISO={checkInDate}
  endISO={checkOutDate}
  onChange={(start, end) => {
    setCheckInDate(start);
    setCheckOutDate(end);
  }}
/>

<div className={formStyles.timeRow}>
  <TextField
    id={`${baseId}-checkin-time`}
    label="Horário do check-in"
    placeholder="Ex.: 15:00"
    inputMode="numeric"
    value={checkInTime}
    onChange={(v) => setCheckInTime(maskTime(v))}
    autoComplete="off"
  />
  <TextField
    id={`${baseId}-checkout-time`}
    label="Horário do check-out"
    placeholder="Ex.: 11:00"
    inputMode="numeric"
    value={checkOutTime}
    onChange={(v) => setCheckOutTime(maskTime(v))}
    autoComplete="off"
  />
</div>
```

Detalhes:
- **Valor inicial das datas = datas do destino** quando está criando: `useState(initialItem?.checkInDate ?? destination.dateStart)` e `useState(initialItem?.checkOutDate ?? destination.dateEnd)`. Quase sempre a estadia é o trecho inteiro; se não for, a pessoa ajusta. De quebra, o calendário já abre no mês certo (novembro), não no mês atual.
- **`key={datesKey}`**: o `DateRangeField` guarda o texto digitado num `useState` inicializado uma vez só, então ele **não atualiza sozinho** quando o voucher preenche as datas. Criar `const [datesKey, setDatesKey] = useState(0)` e fazer `setDatesKey((k) => k + 1)` no fim do `handleVoucherFile` quando o voucher for reconhecido. Isso remonta o campo com as datas novas.
- **`maskTime`**: helper local no arquivo: só dígitos, no máximo 4, insere `:` depois do 2º (`"1500"` → `"15:00"`). Sem validação de erro nessa fase.
- Os horários são opcionais e não têm `(opcional)` no label, porque ficam logo abaixo do campo de datas e já são claramente complementares. Se ela quiser, é só trocar o texto.
- **`.timeRow`** em `StayItemForm.module.css` (arquivo novo, só pra isso):
  ```css
  .timeRow {
    display: flex;
    gap: var(--space-3);
  }
  .timeRow > * {
    flex: 1;
    min-width: 0;
  }
  ```
  e `import formStyles from './StayItemForm.module.css';` (o `styles` de `TransportItemForm.module.css` continua como está).
- `handleSave` passa `checkInDate`, `checkOutDate`, `checkInTime`, `checkOutTime` no lugar de `checkInAt`/`checkOutAt`.

### 3.4 Vouchers: `src/data/mockVouchers.ts`
Nos 3 itens de `MOCK_STAY_VOUCHERS`, trocar `checkInAt`/`checkOutAt` por:
| voucher | checkInDate | checkInTime | checkOutDate | checkOutTime |
|---|---|---|---|---|
| magnolia | `'2026-11-20'` | `'15:00'` | `'2026-11-22'` | `'11:00'` |
| cumbreslastarria | `'2026-11-22'` | `'17:00'` | `'2026-11-24'` | `'06:00'` |
| casasolcor | `'2026-11-24'` | `'14:00'` | `'2026-11-25'` | `'11:00'` |

No `handleVoucherFile` do form, trocar os `setCheckInAt`/`setCheckOutAt` pelos 4 setters novos + `setDatesKey`.

### 3.5 Card: `src/utils/staySummary.ts` → `stayItemDetailRows`
Trocar as 2 linhas de Check-in/Check-out por uma linha de datas + uma de horários:
```ts
import { formatISOToDisplay, fromISODate } from './dateMask';

function nightsBetween(startISO: string, endISO: string): number {
  const a = fromISODate(startISO);
  const b = fromISODate(endISO);
  const ms = Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

// dentro de stayItemDetailRows, no lugar das linhas de check-in/check-out:
if (item.checkInDate && item.checkOutDate) {
  const n = nightsBetween(item.checkInDate, item.checkOutDate);
  rows.push(
    `${formatISOToDisplay(item.checkInDate)} → ${formatISOToDisplay(item.checkOutDate)} · ${n} ${n === 1 ? 'noite' : 'noites'}`,
  );
} else if (item.checkInDate) {
  rows.push(`Check-in: ${formatISOToDisplay(item.checkInDate)}`);
}
const times = [
  item.checkInTime && `Check-in ${item.checkInTime}`,
  item.checkOutTime && `Check-out ${item.checkOutTime}`,
].filter(Boolean).join(' · ');
if (times) rows.push(times);
```
Exemplo de card: `20/11/2026 → 22/11/2026 · 2 noites` / `Check-in 15:00 · Check-out 11:00`.

---

## 4. Busca de hotel com foto e detalhes

### 4.1 Novo componente de apresentação: `src/components/central/HotelInfo.tsx`
Um bloco só, usado em 3 lugares (lista da busca, prévia do hotel escolhido e card salvo), pra não repetir marcação:

```tsx
import { useState } from 'react';
import type { HotelEntry } from '../../data';
import { hotelPhotoUrl, priceLevelA11y, priceLevelLabel, stayTypeIcon } from '../../utils/staySummary';
import styles from './HotelInfo.module.css';

interface HotelInfoProps {
  hotel: HotelEntry;
  /** 'compact' = linha da busca (foto 64px); 'preview' = hotel escolhido (foto larga no topo) */
  variant: 'compact' | 'preview';
}

export function HotelInfo({ hotel, variant }: HotelInfoProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = photoFailed ? null : hotelPhotoUrl(hotel);

  return (
    <span className={`${styles.wrap} ${styles[variant]}`}>
      <span className={styles.photo}>
        {photo ? (
          <img src={photo} alt="" loading="lazy" onError={() => setPhotoFailed(true)} />
        ) : (
          <span className={styles.photoFallback} aria-hidden="true">{stayTypeIcon(hotel.type)}</span>
        )}
      </span>
      <span className={styles.info}>
        <span className={styles.nameRow}>
          <span className={styles.name}>{hotel.name}</span>
          <span className={styles.price} aria-label={priceLevelA11y(hotel.priceLevel)}>
            {priceLevelLabel(hotel.priceLevel)}
          </span>
        </span>
        <span className={styles.category}>
          {hotel.stars ? (
            <span aria-label={`${hotel.stars} estrelas`}>{'★'.repeat(hotel.stars)}</span>
          ) : null}
          {hotel.badge && <span className={styles.badge}>{hotel.badge}</span>}
        </span>
        <span className={styles.description}>{hotel.description}</span>
        <span className={styles.meta}>
          {hotel.neighborhood} · {hotel.distanceLabel}
        </span>
      </span>
    </span>
  );
}
```
Obs.: tudo em `<span>` de propósito, porque na lista ele fica dentro de um `<button role="option">` (e `<div>` dentro de `<button>` é HTML inválido).

**`HotelInfo.module.css`**: só tokens existentes do Tairu (nada novo em `tokens.css`):
```css
.wrap { display: flex; gap: var(--space-3); width: 100%; text-align: left; }
.compact { align-items: flex-start; }
.preview { flex-direction: column; gap: var(--space-2); }

.photo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-top);
  border-radius: 8px;
}
.compact .photo { width: 64px; height: 64px; }
.preview .photo { width: 100%; height: 140px; border-radius: var(--radius-android-card); }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.photoFallback { font-size: 24px; }

.info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.nameRow { display: flex; align-items: baseline; gap: var(--space-2); }
.name { flex: 1; min-width: 0; font-size: 15px; font-weight: 700; color: var(--text); }
.price { flex: 0 0 auto; font-size: 13px; font-weight: 700; color: var(--muted); letter-spacing: 1px; }

.category { display: flex; align-items: center; gap: var(--space-2); font-size: 12px; color: var(--accent-dark); }
.badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  border: 1px solid var(--card-border);
  border-radius: 999px;
  padding: 1px var(--space-2);
}
.description { font-size: 13px; color: var(--text); line-height: 1.35; }
.meta { font-size: 12px; color: var(--muted); }
```
Conferir contraste: estrelas em `--accent-dark` e textos em `--muted` sobre `--card` têm que passar 4.5:1 (checklist do `CLAUDE.md`).

### 4.2 `HotelSearchField.tsx`
- Cada opção da lista vira `<HotelInfo hotel={hotel} variant="compact" />` dentro do mesmo `<button role="option">` de hoje (sai o texto de ícone + nome / bairro · cidade).
- **Abrir a lista ao focar, mesmo vazio** (já vem de `searchHotels`): trocar `const showListbox = open && value.trim().length >= 2;` por `const showListbox = open && (suggestions.length > 0 || value.trim().length >= 2);`. Assim a mensagem "Nenhuma hospedagem da nossa lista…" continua aparecendo só quando a pessoa digitou algo que não bate.
- Com o campo vazio, colocar um cabeçalho não clicável no topo da lista: `<li role="presentation" className={hintStyles.listHeader}>Sugestões em {cityName}</li>` (12px, 700, `var(--muted)`, padding `var(--space-2) var(--space-3)`).
- A lista fica mais alta com fotos: em `HotelSearchField.module.css` criar `.listbox` que estende o do `DestinationField` com `max-height: 420px` (aplicar as duas classes no `<ul>`). Opções com `padding: var(--space-3)`, separadas por `border-bottom: 1px solid var(--card-border)` (menos a última).
- Hint abaixo do campo passa a ser: `Toque no campo pra ver hotéis de {cityName}, ou digite o nome da sua hospedagem.`

### 4.3 Prévia do hotel escolhido: `StayItemForm.tsx`
Logo abaixo do `HotelSearchField`, quando `hotelId` não é `null`:
```tsx
{selectedHotel && (
  <div className={formStyles.hotelPreview}>
    <HotelInfo hotel={selectedHotel} variant="preview" />
  </div>
)}
```
com `const selectedHotel = getHotel(hotelId);`. Some sozinha quando a pessoa edita o nome (o form já zera `hotelId` nesse caso).
```css
.hotelPreview {
  background: var(--bg-top);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-3);
}
```

### 4.4 Card salvo: `StayItemCard.tsx`
Trocar a busca na Wikipedia pela foto local:
- Tirar `usePlaceThumbnail` e o import dele.
- `const hotel = getHotel(item.hotelId); const photo = hotel ? hotelPhotoUrl(hotel) : null;` + estado `photoFailed` com `onError`, igual o `HotelInfo`.
- Mesmo `<img className={stayStyles.thumb}>` de hoje (40px), ou o ícone do tipo quando não tiver foto.
- Quando `hotel` existe e tem `stars`, mostrar ao lado do `typeLabel`: `Hotel · ★★★★` (com `aria-label` "N estrelas" na parte das estrelas). Sem descrição nem preço no card: o card é o resumo da reserva, os detalhes do hotel ficam na busca.

---

## 5. Tirar o "Cancelar"

**`StayItemForm.tsx`**:
- Remover o botão `Cancelar` e a prop `onCancel` da interface.
- O bloco de ações fica: `Salvar estadia` (fullWidth) e, embaixo, **só quando está editando**, o link `Remover estadia`. Como ele fica sozinho na linha, alinhar à esquerda (em `StayItemForm.module.css`: `.removeOnly { margin-left: 0; }` aplicado junto com `styles.removeButton`, que hoje tem `margin-left: auto`).

**`StayDestinationGroup.tsx`**:
- Tirar os dois `onCancel={…}`.

Consequência a registrar: quem abre "+ Adicionar estadia" e desiste, não tem mais botão pra fechar o formulário vazio. O formulário vazio fica aberto até salvar. Se no teste isso incomodar, dá pra resolver depois com um "×" discreto no canto do formulário novo, em vez de voltar o "Cancelar".

**Transporte não muda neste ajuste.** O `TransportItemForm` continua com "Cancelar". Se ela quiser o mesmo lá, vira um ajuste à parte.

---

## 6. Fechamento

- `CLAUDE.md`: no item da Central, registrar o ajustes-52 (datas da estadia com `DateRangeField` + horários, busca com foto/detalhes, fotos locais em `public/hotels/`). Na seção de fotos reais, deixar claro: **hotéis usam foto oficial local (`public/hotels/`), não Wikipedia**; lugares/roteiro/início continuam na Wikipedia.
- Conferir que ninguém mais usa `checkInAt`/`checkOutAt` nem `wikiTitle` de hotel (`grep`).
- `npm run lint` e `npm run build` passando.
- Acessibilidade: opções da busca navegáveis por teclado com o conteúdo novo, `alt=""` nas fotos (decorativas, o nome está do lado), preço e estrelas com texto acessível.

## 7. Como testar

1. Central → Estadia → Buenos Aires: tocar em "Nome da hospedagem" **sem digitar** → abre "Sugestões em Buenos Aires" com os 5 hotéis, cada um com foto, nome, $–$$$$, estrelas ou selo, descrição e bairro · distância.
2. Digitar "palermo" → ficam Magnolia e Home Hotel. Escolher Magnolia → aparece a prévia grande com foto logo abaixo do campo; tipo/endereço/cidade preenchidos.
3. Campo "Check-in e check-out" já vem com 20/11/2026 – 22/11/2026 (datas do destino). Tocar no 📅 → calendário abre em novembro/2026. Mudar pra 20–21.
4. Horários: digitar `1500` → vira `15:00`.
5. Salvar → card com foto 40px, "Hotel · ★★★", `20/11/2026 → 21/11/2026 · 1 noite`, `Check-in 15:00 · …`. **Não tem "Cancelar"** no formulário.
6. Santiago: enviar `voucher-hotel-santiago-cumbreslastarria.pdf` → o campo de datas **atualiza** pra 22/11/2026 – 24/11/2026 e os horários pra 17:00 / 06:00 (confere o `key`).
7. Editar a estadia salva → aparece "Remover estadia" alinhado à esquerda, sem "Cancelar".
8. Digitar "Airbnb do Juan" (não tá na lista) → mensagem de "nenhuma hospedagem…", sem prévia; salvar funciona e o card mostra o ícone do tipo.
9. Renomear temporariamente uma foto em `public/hotels/` → o hotel mostra o ícone no lugar, sem imagem quebrada. Desfazer.
10. Destinos → campo de datas continua com `*` (obrigatório), igual antes.
