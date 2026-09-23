# Ajuste 12 — Tela 4b (Roteiro): cabeçalho por data, mapa por dia, alternador Lista/Mapa em ícone

Feedback da Adriana (10/set/2026) vendo a Tela 4b construída (screenshot com "Dia 1 — 08/09/2026", alternador Lista/Mapa em texto): três ajustes de usabilidade, nenhum muda a lógica de distribuição de lugares por dia (essa já está certa — ver `docs/ajustes-09-datas-por-destino.md` e `docs/ajustes-11-lugares-add-topo-e-mais-opcoes.md` sobre "mais de uma atração por dia").

## 1. Cabeçalho de cada dia: data em primeiro plano, não "Dia N"

Hoje (`src/screens/Itinerary.tsx`, dentro do `.map` que monta `styles.dayCard`) o título é `Dia {globalDay + 1} — {formatISOToDisplay(dateISO)}`, ex.: "Dia 1 — 08/09/2026". A Adriana quer a separação organizada por **data**, não por "Dia 1, Dia 2" — isso é mais fácil de acompanhar junto com o resto da viagem (reservas, timeline etc. também vão ser por data).

Trocar pra:
- **Título principal do card (h3):** dia da semana + data completa, por extenso curto. Ex.: "Terça-feira, 08/09/2026".
- **Texto secundário, abaixo/ao lado do título** (estilo mais discreto, como já é `styles.dayCity` hoje): "Dia 1 de 6 · Buenos Aires" — mantém a contagem de dia como informação de apoio, não mais como identificador principal, e mantém a cidade.
- No card de "dia livre", mesma troca: título "Terça-feira, 08/09/2026", texto secundário "Dia livre — nenhum destino cadastrado pra esse dia" no lugar do texto corrido atual.

Pra gerar o dia da semana, adicionar em `src/utils/dateMask.ts`:

```ts
const WEEKDAYS_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function formatISOToWeekdayDisplay(iso: string): string {
  const { day, month, year } = fromISODate(iso);
  const weekday = WEEKDAYS_PT[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${formatISOToDisplay(iso)}`;
}
```

(Não usar `Date.toLocaleDateString` pra isso — já teve inconsistência de timezone/locale entre navegador e SO em telas anteriores; a tabela fixa evita esse risco.)

**No seletor "Mover pra outro dia" (`<select>` dentro de `ItineraryRow`)**, cada opção hoje mostra só `Dia {globalDay + 1}`. Trocar pra mostrar a data também, pra ficar consistente com o novo cabeçalho: `{dd/mm} (dia {N})`, ex.: "09/09 (dia 2)". Precisa passar `tripStartISO` (ou as datas já resolvidas) até o `ItineraryRow` pra montar isso — hoje ele só recebe `globalDayIndexes`.

## 2. Mapa também filtrável por dia

Hoje, na visualização "Mapa" (`RouteMap`), o mapa mostra de uma vez **todos** os lugares marcados pro destino ativo, coloridos/numerados por dia. Funciona, mas a Adriana pediu pra também poder ver "por dia e as atrações" — ou seja, focar só num dia específico dentro do mapa, não só o destino inteiro de uma vez.

Adicionar, dentro do painel do Mapa (`roteiroView === 'mapa'`), **abaixo** do seletor de destino (`MAP_DESTINATION_TABS_NAME`) e **acima** do `<RouteMap>`, um segundo seletor de dia, reaproveitando o componente `Tabs` já existente (mesmo padrão visual, não um componente novo):

- Primeira opção: "Todos os dias" (valor `all`) — comportamento atual, mostra tudo colorido por dia.
- Uma opção por dia do destino ativo, rotulada com a data curta (ex.: "08/09", "09/09"...) — ao escolher, filtra `mapPins` pra só os pinos daquele dia (usar o `dayNumber` que o pino já carrega) antes de passar pra `<RouteMap>`, e o `FitBounds` já existente vai focar automaticamente só nesses pinos.
- Resetar pra "Todos os dias" sempre que o destino ativo do mapa mudar (mesmo padrão que já existe hoje pro próprio destino).

Estado novo em `Itinerary.tsx`: `const [mapDayFilter, setMapDayFilter] = useState<'all' | number>('all');` (o número é o `localDayIndex`, não o `globalDay`, pra bater com o range do destino ativo). Resetar pra `'all'` no `onChange` do seletor de destino do mapa.

## 3. Alternador Lista/Mapa em ícone, não texto

Hoje o alternador Lista/Mapa usa o componente `Tabs` genérico com `label` em texto ("Lista" / "Mapa"). A Adriana pediu ícone em vez de texto especificamente pra esse alternador — **não** mexer nos outros usos de `Tabs` da tela (abas Roteiro/Dicas locais, seletor de destino), só nesse.

Em vez de criar um componente novo do zero, **estender o `Tabs` existente** (`src/components/shell/Tabs.tsx`) com duas props novas, opcionais (não quebra nenhum uso atual):

```ts
export interface TabItem {
  value: string;
  label: string;
  icon?: string; // glyph/emoji opcional, ex.: '☰'
}

interface TabsProps {
  // ...props existentes
  iconOnly?: boolean; // default false — quando true, mostra só o icon de cada item
}
```

Quando `iconOnly` for `true` e o item tiver `icon`: renderizar `<span aria-hidden="true">{item.icon}</span>` + um `<span className="visually-hidden">{item.label}</span>` (texto continua existindo pra leitor de tela) + `title={item.label}` no `<button>` (tooltip pra quem usa mouse). Isso segue a mesma regra do `CLAUDE.md` de nunca deixar estado/ação só em ícone sem alternativa textual acessível.

Uso em `Itinerary.tsx`, no alternador Lista/Mapa:

```tsx
<Tabs
  name={ROTEIRO_VIEW_TABS_NAME}
  label="Visualização do roteiro"
  iconOnly
  items={[
    { value: 'lista', label: 'Lista', icon: '☰' },
    { value: 'mapa', label: 'Mapa', icon: '🗺️' },
  ]}
  value={roteiroView}
  onChange={(v) => setRoteiroView(v as 'lista' | 'mapa')}
/>
```

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Cabeçalho de cada dia mostra o dia da semana + data completa como título principal; "Dia N de X · Cidade" aparece como informação secundária, não mais como título.
- Dia livre também segue o novo formato de cabeçalho.
- Seletor "Mover pra outro dia" mostra a data junto do número do dia.
- No modo Mapa, dá pra escolher "Todos os dias" ou um dia específico do destino ativo, e o mapa recentraliza só nos pinos daquele dia.
- Trocar de destino no mapa volta o filtro de dia pra "Todos os dias".
- O alternador Lista/Mapa mostra só ícones (☰ / 🗺️), sem texto visível — mas com `aria-label`/texto oculto acessível e `title` funcionando ao passar o mouse.
- Nenhum outro uso de `Tabs` na tela (Roteiro/Dicas locais, seletor de destino/cidade) virou ícone — só o Lista/Mapa.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`.
