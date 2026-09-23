# Ajuste 27 — Timeline no Roteiro (lista), inspirada numa referência do Figma

Feedback da Adriana (14/set/2026), depois de conectar o Figma MCP e compartilhar uma tela de referência:

> "Essa é a tela do roteiro que gostaria que você usasse de inspiração para organização da timeline do roteiro. Ela não tem todos os elementos que precisamos. Mas quero que você use uma estrutura assim de componentes."
>
> (Antes, sobre o uso do Figma em geral: "Quero que você pegue algumas referências de tela para montar igual. Não é pra pegar os tokens pq não corresponde a identidade do Tairu.")

Referência: [Trip Travel App — Mobile UI Kit (Community), nó 11003:453](https://www.figma.com/design/fWsd00wzwACEBes7Mfxfjw/Trip-Travel-App---Mobile-UI-Kit--Community-?node-id=11003-453) — uma tela "Itinerary" com timeline vertical (linha + bolinha conectando cada parada), horário, título, descrição e foto opcional por parada, mais uma faixa horizontal de "pills" de data acima.

**O que foi usado da referência (estrutura) e o que foi deixado de fora ou adaptado:**

- ✅ Timeline vertical com linha conectora + bolinha por parada — adotado.
- ✅ Faixa horizontal de pills de data pra navegar entre dias — adotado, mas junto com "Todos os dias" (a referência não tem essa opção; o Roteiro do Tairu sempre mostrou todos os dias empilhados, então isso vira uma forma *nova* de navegar, sem tirar a que já existe).
- ✅ Foto por parada — adotado, reaproveitando a busca ao vivo na Wikipedia já implementada no `ajustes-24` (`usePlaceThumbnail`), não uma foto nova/inventada.
- ❌ **Horário de cada parada (9:00 AM, 1:00 PM...)** — não adotado como está. O Tairu não coleta horário por parada, só o dia e a ordem dentro do dia. Inventar um horário seria dado fingido (contraria o princípio "dados reais, sem IA generativa" do `CLAUDE.md`). No lugar do horário, cada parada mostra "Parada 1", "Parada 2" etc. — mesmo estilo visual (caixa alta, cor de destaque, acima do título), só que com informação real.
- ❌ **Cores e tipografia da referência** (fundo bege `#faf9f6`, verde-petróleo `#0e6e6e`, serifada Playfair Display) — **não usadas**. Tudo abaixo usa só os tokens que já existem em `CLAUDE.md` (`--accent`, `--accent-dark`, `--card`, `--card-border`, `--field-border`, `--text`, `--muted`), como a Adriana pediu explicitmente.
- Escopo: só a aba **Roteiro → Lista** (dia a dia). A aba **Mapa** ganha só a nova pill de data (ver item 1), o resto dela não muda. A aba **Lugares** (seleção de pontos turísticos) também não muda — já tem foto desde o `ajustes-24`, mas em outro layout (lista de seleção, não timeline).

## 1. Pills de data — reaproveitando o `Tabs`, não um componente novo

Hoje o filtro de dia dentro de Roteiro → Mapa já existe (`MAP_DAY_TABS_NAME`), só que com a aparência de segmented control/sublinhado (a mesma do `Tabs` usado em qualquer outro lugar do app). A referência do Figma mostra outra forma visual pra isso — um "pill" quadrado arredondado, duas linhas (mês abreviado em cima, número do dia embaixo), rolagem horizontal. Em vez de criar um componente novo do zero, o `Tabs` ganha uma variante nova (`variant="pill-date"`) que reaproveita toda a lógica de acessibilidade e teclado que já existe, só mudando o visual:

**`src/components/shell/Tabs.tsx`** — adicionar:

```tsx
export interface TabItem {
  value: string;
  label: string;
  icon?: string;
  /** só usado com variant="pill-date": linha de cima do pill (ex.: mês abreviado) */
  pillTop?: string;
  /** só usado com variant="pill-date": linha de baixo do pill (ex.: número do dia) */
  pillBottom?: string;
}

interface TabsProps {
  name: string;
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  iconOnly?: boolean;
  /** 'segmented' (padrão, visual atual) ou 'pill-date' (pills de duas linhas, rolagem horizontal) */
  variant?: 'segmented' | 'pill-date';
}

export function Tabs({ name, items, value, onChange, label, iconOnly = false, variant = 'segmented' }: TabsProps) {
  // ...handleKeyDown sem mudança...

  return (
    <div
      className={`${styles.tablist} ${variant === 'pill-date' ? styles.tablistPillDate : ''}`}
      role="tablist"
      aria-label={label}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${name}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`${name}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            title={iconOnly && item.icon ? item.label : undefined}
            className={`${styles.tab} ${variant === 'pill-date' ? styles.tabPillDate : ''} ${selected ? styles.tabSelected : ''}`}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {variant === 'pill-date' && item.pillTop && item.pillBottom ? (
              <>
                <span className={styles.pillTop} aria-hidden="true">{item.pillTop}</span>
                <span className={styles.pillBottom} aria-hidden="true">{item.pillBottom}</span>
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : iconOnly && item.icon ? (
              <>
                <span aria-hidden="true">{item.icon}</span>
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**`src/components/shell/Tabs.module.css`** — adicionar (não mexe no que já existe pro `variant="segmented"`, que continua padrão):

```css
.tablistPillDate {
  overflow-x: auto;
  gap: var(--space-2);
  padding-bottom: var(--space-1); /* respiro pra barra de rolagem não colar no conteúdo */
}

.tabPillDate {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-android-card);
  border: 1.5px solid var(--field-border);
  background: var(--card);
  padding: 0;
}

.tabPillDate.tabSelected {
  background: var(--accent);
  border-color: var(--accent);
}

.pillTop {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.tabPillDate.tabSelected .pillTop {
  color: var(--text-on-dark);
  opacity: 0.85;
}

.pillBottom {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}

.tabPillDate.tabSelected .pillBottom {
  color: var(--text-on-dark);
}
```

**`src/utils/dateMask.ts`** — adicionar (tabela fixa em português, mesma lógica de `WEEKDAYS_PT` já existente — sem `Date.toLocaleDateString`, pelo mesmo motivo já documentado ali: risco de inconsistência de timezone/locale):

```ts
const MONTHS_ABBREV_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** Mês abreviado (3 letras, PT) + número do dia — usado nos pills de data do Roteiro. */
export function formatISOToDayPill(iso: string): { monthAbbrev: string; day: string } {
  const { day, month } = fromISODate(iso);
  return { monthAbbrev: MONTHS_ABBREV_PT[month - 1], day: String(day) };
}
```

## 2. `Itinerary.tsx` — pills de data em Mapa e em Lista

**Mapa** (troca a `Tabs` de dia que já existe lá por `variant="pill-date"`, mesmo comportamento, visual novo):

```tsx
{activeRange && activeRange.globalDayIndexes.length > 0 && (
  <Tabs
    name={MAP_DAY_TABS_NAME}
    label="Dia do mapa"
    variant="pill-date"
    items={[
      { value: 'all', label: 'Todos os dias' },
      ...activeRange.globalDayIndexes.map((globalDay, i) => {
        const { monthAbbrev, day } = formatISOToDayPill(globalDayToISO(tripStartISO, globalDay));
        return { value: String(i), label: formatISOToDisplay(globalDayToISO(tripStartISO, globalDay)), pillTop: monthAbbrev, pillBottom: day };
      }),
    ]}
    value={mapDayFilter === 'all' ? 'all' : String(mapDayFilter)}
    onChange={(v) => setMapDayFilter(v === 'all' ? 'all' : Number(v))}
  />
)}
```

**Lista** — novo filtro de dia, mesmo padrão, `listDayFilter` (novo state, `'all' | number`, começa em `'all'` pra não mudar o comportamento de quem já usa o Roteiro hoje):

```tsx
const [listDayFilter, setListDayFilter] = useState<'all' | number>('all');
```

Dentro do bloco `roteiroView === 'lista'`, antes do `<ul className={styles.dayList}>`:

```tsx
{totalDays > 1 && (
  <Tabs
    name="itinerary-list-day"
    label="Dia do roteiro"
    variant="pill-date"
    items={[
      { value: 'all', label: 'Todos os dias' },
      ...Array.from({ length: totalDays }, (_, globalDay) => {
        const { monthAbbrev, day } = formatISOToDayPill(globalDayToISO(tripStartISO, globalDay));
        return { value: String(globalDay), label: formatISOToWeekdayDisplay(globalDayToISO(tripStartISO, globalDay)), pillTop: monthAbbrev, pillBottom: day };
      }),
    ]}
    value={listDayFilter === 'all' ? 'all' : String(listDayFilter)}
    onChange={(v) => setListDayFilter(v === 'all' ? 'all' : Number(v))}
  />
)}
```

E o `Array.from({ length: totalDays }, ...)` que monta a lista de dias passa a filtrar por `listDayFilter` antes de mapear:

```tsx
{Array.from({ length: totalDays }, (_, i) => i)
  .filter((globalDay) => listDayFilter === 'all' || globalDay === listDayFilter)
  .map((globalDay) => {
    // ...corpo do map que já existe, sem mudança na lógica interna...
  })}
```

(Com um só dia de viagem, `totalDays === 1`, a pill nem aparece — não faz sentido escolher entre 1 opção.)

## 3. Nova `TimelineStop` — substitui `ItineraryRow` dentro de cada dia

**`src/components/itinerary/TimelineStop.tsx`** (novo arquivo, mesma pasta do `RouteMap.tsx`):

```tsx
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import styles from './TimelineStop.module.css';

interface TimelineStopProps {
  orderLabel: string;
  title: string;
  description?: string;
  /** título de busca na Wikipedia (wikiTitle ?? name) — só quando é um lugar real, não texto livre */
  photoSearchTitle?: string;
  skipped: boolean;
  isLast: boolean;
  actions: React.ReactNode;
}

export function TimelineStop({ orderLabel, title, description, photoSearchTitle, skipped, isLast, actions }: TimelineStopProps) {
  const thumbnailUrl = usePlaceThumbnail(photoSearchTitle ?? '');

  return (
    <li className={`${styles.stop} ${isLast ? styles.stopLast : ''}`}>
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.orderLabel}>{orderLabel}</span>
        <p className={`${styles.title} ${skipped ? styles.titleSkipped : ''}`}>
          {title}
          {skipped && <span className="visually-hidden"> (pulado)</span>}
        </p>
        {description && !skipped && <p className={styles.description}>{description}</p>}
        {photoSearchTitle && thumbnailUrl && !skipped && (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.photo} />
        )}
        <div className={styles.actions}>{actions}</div>
      </div>
    </li>
  );
}
```

(`photoSearchTitle` só é passado quando `assignment.place.placeId` existe — lugar customizado por texto livre não busca foto nem mostra descrição, porque não tem nenhuma das duas; ver item 4.)

**`src/components/itinerary/TimelineStop.module.css`** (novo arquivo):

```css
.stop {
  display: flex;
  gap: var(--space-3);
  position: relative;
  padding-bottom: var(--space-5);
}

.stopLast {
  padding-bottom: 0;
}

.dot {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 999px;
  background: var(--accent);
  border: 3px solid var(--bg-top);
  position: relative;
}

/* Linha conectora — pseudo-elemento no próprio dot, esticando até a próxima parada.
   Some sozinha na última parada porque .stopLast não recebe :not(:last-child). */
.stop:not(.stopLast) .dot::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  bottom: calc(-1 * var(--space-5));
  background: var(--field-border);
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.orderLabel {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-dark);
}

.title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.titleSkipped {
  text-decoration: line-through;
  color: var(--muted);
}

.description {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.photo {
  width: 100%;
  max-width: 280px;
  height: 140px;
  object-fit: cover;
  border-radius: var(--radius-android-card);
  border: 1.5px solid var(--card-border);
  margin-top: 2px;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  flex-wrap: wrap;
}
```

(`.dot` usa `border: 3px solid var(--bg-top)` de propósito — é o mesmo truque da referência do Figma, um "anel" na cor de fundo da tela pra a bolinha parecer vazada, só que com o token de fundo do Tairu em vez do bege fixo deles.)

## 4. `Itinerary.tsx` — trocar `ItineraryRow`/`.itemList` por `TimelineStop`/`.timelineList` dentro de cada dia

No corpo do `.map` de cada dia (onde hoje está `<ul className={styles.itemList}>{[...active, ...skipped].map(...)}`), trocar por:

```tsx
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
                onChange={(e) => trip.moveItineraryItem(assignment.place.id, Number(e.target.value))}
                aria-label={`Mover ${placeLabel(assignment.place)} pra outro dia`}
              >
                {range.globalDayIndexes.map((globalDay, i) => (
                  <option key={i} value={i}>
                    {formatISOToDisplay(globalDayToISO(tripStartISO, globalDay)).slice(0, 5)} (dia {i + 1})
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
```

Isso substitui o componente `ItineraryRow` inteiro (pode ser removido de `Itinerary.tsx` — a lógica dele migrou pra dentro do JSX acima + pro `TimelineStop`) e o import de `PlaceRow`/`getPlaceById` precisa incluir `getPlaceById` (já importado, usado em `placeLabel`).

**`Itinerary.module.css`** — adicionar `.timelineList` (o `.itemList`/`.item`/`.itemLabel`/`.itemLabelSkipped`/`.itemActions` antigos podem ser removidos se não forem usados em outro lugar do arquivo — conferir antes de apagar):

```css
.timelineList {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
```

`.moveSelect` e `.skipButton`/`.skipButtonUndo` continuam como estão hoje (só passam a ficar dentro do `.actions` do `TimelineStop` em vez do `.itemActions` antigo).

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Roteiro → Mapa: o filtro de dia aparece como pills de duas linhas (mês + número), com rolagem horizontal se não couber; "Todos os dias" continua funcionando igual.
- Roteiro → Lista, viagem com mais de 1 dia: aparece a mesma faixa de pills acima da lista; escolher um dia mostra só aquele dia; "Todos os dias" volta ao comportamento de hoje (todos empilhados).
- Roteiro → Lista, viagem com só 1 dia: a faixa de pills não aparece (não faz sentido escolher entre 1 opção).
- Cada parada mostra: linha conectora + bolinha, "Parada N", título, e — só quando é um lugar real (não texto livre) — descrição e foto (quando a Wikipedia encontrar).
- Lugar adicionado por texto livre (campo "Adicione um lugar" da aba Lugares) aparece na timeline só com "Parada N" + título, sem descrição nem foto quebrada/genérica.
- Parada marcada como "Pulei" continua com o título riscado, sem descrição nem foto (evita chamar atenção pra algo que não vai rolar).
- Botões de mover dia / pular continuam funcionando exatamente como hoje, só que reposicionados dentro do card da parada.
- Sem internet: a timeline continua funcionando normalmente, só sem fotos (mesma degradação graciosa do `ajustes-24`).
- Testar em 375px e 390px, e nas duas variantes iOS/Android — o pill de data (56×56px) e a foto (140px de altura) não devem apertar o resto do conteúdo.
