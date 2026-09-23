# Ajuste 48 — Card de transporte mais legível (linhas separadas) e moeda explícita no custo

Feedback da Adriana (22/set/2026), vendo o card de um voo salvo (ex.: "LATAM Airlines LA 4550 / Buenos Aires (EZE) → Santiago (SCL) · 22/11/2026 14:00 – 22/11/2026 16:20"): a linha de detalhe está densa demais — pediu linhas separadas pra saída/chegada e uma linha própria pra data/horário. E: o campo de custo precisa indicar a moeda — "nem sempre o usuário vai comprar em real".

## 1. Card de transporte — linhas separadas em vez de uma linha só

**`src/utils/transportSummary.ts`** — trocar a função `transportItemDetail` (retornava uma `string` só) por `transportItemDetailRows`, que retorna um array de linhas:

```ts
/**
 * Linhas de detalhe do card — nunca inclui custo. Assume que data de
 * partida e chegada é a mesma (formato "dd/mm/aaaa hh:mm" nos dois campos,
 * como o app já pede) pra juntar as duas horas numa linha só — é uma
 * simplificação aceitável pro cenário de teste (trechos curtos, mesmo
 * dia); se algum dia precisar cobrir voos com pernoite, essa função é o
 * único lugar a ajustar.
 */
export function transportItemDetailRows(item: TransportItem): string[] {
  switch (item.type) {
    case 'voo':
    case 'onibus': {
      const rows: string[] = [];
      if (item.origin) rows.push(`Saída: ${item.origin}`);
      if (item.destination) rows.push(`Chegada: ${item.destination}`);
      const depParts = item.departureAt.trim().split(' ');
      const arrParts = item.arrivalAt.trim().split(' ');
      const date = depParts[0] || arrParts[0] || '';
      const depTime = depParts.slice(1).join(' ');
      const arrTime = arrParts.slice(1).join(' ');
      const timeRange = [depTime, arrTime].filter(Boolean).join(' – ');
      if (date || timeRange) rows.push([date, timeRange].filter(Boolean).join(' · '));
      return rows.length ? rows : ['Detalhes a preencher'];
    }
    case 'carro-locado': {
      const rows: string[] = [];
      if (item.pickupLocation || item.pickupAt) {
        rows.push(`Retirada: ${[item.pickupLocation, item.pickupAt].filter(Boolean).join(' — ')}`);
      }
      if (item.dropoffLocation || item.dropoffAt) {
        rows.push(`Devolução: ${[item.dropoffLocation, item.dropoffAt].filter(Boolean).join(' — ')}`);
      }
      return rows.length ? rows : ['Detalhes a preencher'];
    }
  }
}
```
(remove a função antiga `transportItemDetail` — só essa nova é usada agora.)

Resultado esperado pro exemplo dela:
```
Saída: Buenos Aires (EZE)
Chegada: Santiago (SCL)
22/11/2026 · 14:00 – 16:20
```

**`src/components/central/TransportItemCard.tsx`** — trocar o import e o uso:
```tsx
import { transportItemDetailRows, transportItemTitle, transportTypeIcon } from '../../utils/transportSummary';
// ...
{transportItemDetailRows(item).map((row, i) => (
  <p key={i} className={styles.detail}>{row}</p>
))}
```
(era um `<p>` só com `transportItemDetail(item)`.)

**`src/components/central/TransportItemCard.module.css`** — a classe `.detail` provavelmente tem `margin` de parágrafo padrão do navegador ou nenhuma definida — com várias linhas agora, garantir que fica compacta e legível: `margin: 0;` no `.detail` e um `display: flex; flex-direction: column; gap: 2px;` no container que envolve as linhas (ou, se `.detail` for aplicado direto em cada `<p>`, um `margin-bottom` pequeno tipo `2px` nela, `0` na última — o que for mais simples de aplicar sem quebrar o restante do card).

## 2. Custo ganha campo de moeda

**`src/context/TripContext.tsx`** — em `TransportItemBase`, trocar:
```ts
cost: string;
```
por:
```ts
costAmount: string;
costCurrencyCode: string;
```
(só o tipo muda — nenhuma outra parte do `TripContext` lê ou grava esse campo diretamente, é só passado adiante pelo formulário.)

**`src/components/central/TransportItemForm.tsx`**:
- Trocar `const [cost, setCost] = useState(initialItem?.cost ?? '');` por:
  ```ts
  const [costAmount, setCostAmount] = useState(initialItem?.costAmount ?? '');
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? destinationCurrencyCode);
  ```
- A prop `destinationCurrencyCode: string` é nova nesse componente (ver abaixo) — moeda sugerida é a do próprio destino, mas editável (mesmo princípio já usado em Destinos: "moeda sugerida mas editável").
- Trocar `const base = { id, destinationId, cost, voucherFileName };` por `const base = { id, destinationId, costAmount, costCurrencyCode, voucherFileName };`.
- Trocar o bloco do campo de custo (hoje um `TextField` só, com placeholder "Ex.: R$ 450") por um par lado a lado — `TextField` pro valor + `CurrencySelect` pra moeda, mesmo componente já usado em Destinos (`import { CurrencySelect } from '../inputs/CurrencySelect';`):
  ```tsx
  {type && (
    <div className={styles.costRow}>
      <TextField
        id={`${baseId}-cost-amount`}
        label="Custo (opcional)"
        placeholder="Ex.: 450"
        value={costAmount}
        onChange={setCostAmount}
        autoComplete="off"
      />
      <CurrencySelect
        id={`${baseId}-cost-currency`}
        label="Moeda do custo"
        value={costCurrencyCode}
        onChange={setCostCurrencyCode}
      />
    </div>
  )}
  ```
- Import novo: `import { CurrencySelect } from '../inputs/CurrencySelect';`.
- Adicionar `destinationCurrencyCode: string;` na interface `TransportItemFormProps`.

**`src/components/central/TransportItemForm.module.css`** — novo `.costRow`:
```css
.costRow {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
}

.costRow > *:first-child {
  flex: 1;
  min-width: 0;
}
```
(`align-items: flex-end` alinha a base do `CurrencySelect` com a base do campo de texto, já que o `TextField` tem um `label` acima do input e o `CurrencySelect` não.)

**`src/components/central/TransportDestinationGroup.tsx`** — passar a moeda do destino pro formulário nas duas ocorrências de `<TransportItemForm>` (a de edição, dentro do `.map`, e a de "novo item"):
```tsx
<TransportItemForm
  destinationId={destination.id}
  destinationCurrencyCode={destination.currencyCode}
  ...
/>
```

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Card de um voo salvo mostra 3 linhas: "Saída: <origem>", "Chegada: <destino>", "<data> · <hora saída> – <hora chegada>" — não mais tudo numa linha só.
- Card de carro locado mostra "Retirada: <local> — <data/hora>" e "Devolução: <local> — <data/hora>" em linhas separadas.
- Formulário de novo transporte: campo de custo abre já com a moeda do destino pré-selecionada (e editável) ao lado do valor.
- Editar um item que já tem custo salvo: valor e moeda aparecem preenchidos corretamente.
- Card salvo continua sem mostrar o custo em nenhum lugar (só o formulário tem esse campo).
