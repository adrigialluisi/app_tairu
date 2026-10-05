# Ajuste 61 — Custos: lançar gasto, lançamentos com conversão e rateio final

Pedido da Adriana (02/out/2026): construir as partes que faltam do fluxo, em sequência. Esta é a primeira: **etapa 9 do fluxo proposto, "Controle financeiro com rateio final"**: cada pessoa lança seus gastos (com conversão de moeda), a tela mostra o que cada um registrou e, no fim, monta o rateio (estilo Splitwise).

Já existe e é reaproveitado:
- Os custos digitados em **Central** (Transporte, Hospedagem, Outros: `costAmount` + `costCurrencyCode`) nunca apareceram em lugar nenhum: eles entram automaticamente aqui.
- `CurrencySelect`, `OptionChipGroup`, `MultiOptionChipGroup`, `AttachmentList`, `TextField`, `maskSingleDate`, padrão de formulário inline sem "Cancelar".

Dado novo, já entregue (não precisa criar): **`src/data/exchangeRates.json`** (fonte em `docs/dados/exchange-rates.json`): cotação real de 02/out/2026 das 36 moedas de `currencies.json`, base BRL (quanto 1 real vale em cada moeda), fonte ExchangeRate-API. Fixa no protótipo pra funcionar offline. **A data da cotação aparece sempre que houver conversão** (nunca apresentar como câmbio "ao vivo").

Moeda de referência da viagem: **BRL**, fixa nesta leva (o público é brasileiro). Se a Adriana quiser escolher a moeda de referência, vira ajuste à parte.

---

## 1. Dinheiro e conversão — `src/utils/money.ts` (novo)

```ts
import rates from '../data/exchangeRates.json';

/** "1.234,56" | "1234,56" | "1234.56" | "450" → número; vazio/ inválido → null */
export function parseAmount(value: string): number | null;
// regra: se tiver vírgula, é formato BR (tira pontos, troca vírgula por ponto);
// sem vírgula: se casar /^\d+\.\d{1,2}$/ o ponto é decimal; senão tira os pontos.

export function toBRL(amount: number, currencyCode: string): number | null; // amount / rates.rates[code]
export function fromBRL(amountBRL: number, currencyCode: string): number | null;

/** Intl.NumberFormat('pt-BR', { style: 'currency', currency }) — ex.: "R$ 1.234,56", "ARS 12.000,00" */
export function formatMoney(amount: number, currencyCode: string): string;

export const RATES_AS_OF: string; // "02/10/2026" (formatado de rates.asOf)
export const RATES_SOURCE_LABEL: string;
```
Moeda sem cotação → `toBRL` devolve `null` e a interface mostra "sem conversão" (nunca inventa).

## 2. Modelo — `src/context/TripContext.tsx`

```ts
export type ExpenseCategory = 'transporte' | 'hospedagem' | 'alimentacao' | 'passeios' | 'compras' | 'outros';

/** 'voce' = a pessoa usando o app; senão TripCompanion.id */
export type MemberId = string;

export interface Expense {
  id: string;
  description: string;
  amount: string;            // texto como digitado; converter com parseAmount
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
  sourceId: string;          // id do TransportItem / StayItem / OtherItem
  paidBy: MemberId;
  splitWith: MemberId[] | null;
}
```
No estado: `expenses: Expense[]`, `centralCostOverrides: CentralCostOverride[]`, `settledTransferKeys: string[]`.
No contexto: `saveExpense`, `removeExpense` (mesma implementação de `saveOtherItem`/`removeOtherItem`, revogando URLs dos anexos), `saveCentralCostOverride`, `toggleSettledTransfer(key)`. Zerar os três no `resetTrip()` e incluir nas dependências do `useMemo`.

## 3. Juntar tudo — `src/utils/costs.ts` (novo)

```ts
export interface CostEntry {
  id: string;                         // id do Expense ou sourceId da Central
  origin: 'manual' | 'central';
  description: string;
  amount: number;
  currencyCode: string;
  amountBRL: number | null;
  destinationId: string | null;
  category: ExpenseCategory;
  paidBy: MemberId;
  splitWith: MemberId[];              // já resolvido (null → todos os membros)
  date: string | null;
}

export function getMembers(trip): { id: MemberId; label: string }[];
// [{ id: 'voce', label: 'Você' }, ...companions.map(c => ({ id: c.id, label: parte do e-mail antes do @ }))]

export function buildCostEntries(trip): CostEntry[];
```
Regras do `buildCostEntries`:
- **Manuais**: todos os `trip.expenses` com valor válido.
- **Da Central**: todo item de `transportItems`, `stayItems`, `otherItems` com `parseAmount(costAmount) > 0`. Descrição = mesmo título do card da Central (`transportItemTitle`, nome da hospedagem, título do registro de Outros). Categoria: transporte → `transporte`; hospedagem → `hospedagem`; Outros: seguro → `outros`, passeio/ingresso → `passeios`. `destinationId` do item (Outros "viagem toda" → `null`). Data: hospedagem = check-in; Outros = `startDate`; transporte = parte da data de `departureAt`/`pickupAt` se estiver no formato dd/mm/aaaa, senão `null`. `paidBy`/`splitWith` vêm do `CentralCostOverride` se existir; senão `'voce'` e todos.
- `splitWith` resolvido: `null` → todos os membros; ids de convidados removidos depois são ignorados; se ficar vazio, cai em todos.

```ts
export interface MemberBalance { memberId: MemberId; paidBRL: number; shareBRL: number; balanceBRL: number; }
export function computeBalances(entries: CostEntry[], members): MemberBalance[];
// cada entrada: quem pagou recebe +amountBRL em paid; cada membro de splitWith recebe amountBRL/splitWith.length em share.
// Entradas sem amountBRL (moeda sem cotação) ficam de fora do rateio e são contadas à parte.

export interface Transfer { key: string; from: MemberId; to: MemberId; amountBRL: number; }
export function computeTransfers(balances): Transfer[];
// greedy: maior devedor paga ao maior credor até zerar; ignora < R$ 0,01; key = `${from}->${to}`.
```

## 4. Tela — `src/screens/Costs.tsx` (novo) na rota `/custos`

Troca o `SectionComingSoon` em `App.tsx`. `AppBar` "Custos da viagem" + subtítulo nome da viagem + `onHome`, `BottomNav`, `SaveToast`.

### 4.1 Card de resumo (topo, sempre visível)
- "Total da viagem" em `--text-2xl`/`--font-weight-bold`: soma em BRL.
- Embaixo: "≈ {valor} por pessoa" (total ÷ nº de membros) quando houver convidados.
- **Barra empilhada por categoria** (uma barra horizontal de 12px, raio cheio) + legenda com ícone, nome e valor de cada categoria que tiver gasto. Ícones: 🚆 Transporte, 🛏️ Hospedagem, 🍽️ Alimentação, 🎟️ Passeios, 🛍️ Compras, 📋 Outros. Cores: tons dos tokens existentes (`--accent`, `--accent-dark`, `--bg-low`, `--bg-bottom`, `--bg-mid`, `--muted`), sempre acompanhadas do ícone + texto (nunca só cor).
- Linha `--text-sm`/`--muted`: "Valores convertidos pra real com a cotação de 02/10/2026 ({fonte})."
- Se houver gasto em moeda sem cotação: "1 gasto em {moeda} ficou fora do total (sem cotação)."
- Sem nenhum custo: estado vazio com 💰 "Nenhum gasto ainda. Os valores que você colocar na Central aparecem aqui sozinhos, e você pode lançar outros gastos."

### 4.2 Abas: **Lançamentos** | **Rateio** (componente `Tabs`)

**Lançamentos**
- Botão "+ Lançar gasto" (secundário, largura cheia) → abre o formulário inline (4.3) no topo da lista.
- Lista agrupada por destino, na ordem: "Viagem toda / outros lugares" e depois cada destino (mesmo cabeçalho de grupo da Central, `TransportDestinationGroup.module.css`).
- Cada linha (card): ícone da categoria num círculo de 40px; descrição (`--text-lg`); embaixo "Pago por {quem} · dividido entre {n}" (`--text-sm`, `--muted`); à direita, valor na moeda original e, abaixo, "≈ R$ X" quando a moeda não for BRL. Se veio da Central, selo pequeno "🧾 Da Central".
- Tocar em "Editar":
  - gasto manual → formulário completo;
  - gasto da Central → formulário reduzido só com "Quem pagou" e "Dividir com" + link "Editar valor na Central" (`navigate('/central')`).

### 4.3 Formulário "Lançar gasto" — `src/components/costs/ExpenseForm.tsx` (novo)
Nesta ordem:
1. "O que foi?" (`description`) — placeholder "Ex.: Jantar no Don Julio"
2. "Onde foi?" — `OptionChipGroup` com os destinos da viagem (nome da cidade) + "Outro lugar". **Ao escolher um destino, a moeda muda sozinha pra moeda daquele destino** e aparece o hint "Moeda ajustada pra {código} ({cidade})." "Outro lugar" não muda a moeda. Se o form abrir sem destino escolhido, a moeda inicial é a do primeiro destino com data que contenha a data de hoje; senão BRL.
3. "Valor" (`TextField`, `inputMode="decimal"`) + "Moeda" (`CurrencySelect`) lado a lado (mesmo `costRow` do Transporte). Logo abaixo, preview ao vivo: "≈ R$ 85,17 · cotação de 02/10/2026" (some se valor vazio ou moeda BRL).
4. "Categoria" — chips com ícone (as 6 da 4.1).
5. "Quem pagou?" — `OptionChipGroup` com os membros (Você primeiro). Padrão: Você.
6. "Dividir com" — `MultiOptionChipGroup`, todos marcados por padrão (salva `null` se todos estiverem marcados). Abaixo: "Cada um: R$ X" calculado ao vivo.
7. "Data (opcional)" — `dd/mm/aaaa` com `maskSingleDate`, salvo como ISO.
8. "Comprovante (opcional)" — `AttachmentList`.
- "Salvar gasto" (desabilitado sem descrição ou valor válido); em edição, "Remover gasto". Sem "Cancelar". Toast "Gasto salvo".
- Sem convidados na viagem, os passos 5 e 6 não aparecem (tudo é "Você") e aparece uma linha: "Quer dividir os gastos? Convide alguém em Convidados." com link.

**Rateio**
- Sem convidados: card com 👥 "Convide alguém pra dividir os gastos da viagem." + botão secundário "Convidar" (`/convidar`).
- Com convidados:
  1. **"Quanto cada um"**: um card por membro — nome (`Você` em destaque), "Pagou R$ X", "Parte dele R$ Y" e o saldo grande: verde (`--success` + ícone ▲) "vai receber R$ Z" ou `--accent-dark` + ▼ "deve R$ Z", ou "✓ quite".
  2. **"Pra acertar as contas"**: lista de `computeTransfers`, cada linha "💸 {de} paga {valor} pra {para}", com botão "Marcar como acertado" (`toggleSettledTransfer(key)`). Acertado: linha riscada + "✓ Acertado" + "Desfazer". Se não houver transferências: "✓ Tudo certo, ninguém deve nada."
  3. Nota `--text-sm`/`--muted`: "Rateio em reais, pela cotação de 02/10/2026."
- O rateio é recalculado sempre que algo muda; se uma transferência acertada mudar de valor, a marcação some (a key inclui só de→para, então guardar junto o valor e comparar: `settledTransferKeys` guarda `${from}->${to}:${amountBRL.toFixed(2)}`).

## 5. Selo no menu — `src/utils/tripProgress.ts` + `BottomNav.tsx`
`isCustosComplete(trip)`: pelo menos 1 gasto manual **ou** 1 custo vindo da Central. Ligar no `BottomNav` igual Destinos/Roteiro.

## 6. `CLAUDE.md`
Item 5 da listagem de telas (Custos): construída neste ajuste; e em "Dados reais": cotação real fixa em `src/data/exchangeRates.json` com data e fonte sempre visíveis, nunca apresentada como ao vivo.

## 7. Conferir
- [ ] Sem gasto nenhum: estado vazio. Com custo de voo na Central (ex.: 450 BRL) → aparece sozinho em Lançamentos com selo "Da Central" e no total.
- [ ] Lançar "Jantar no Don Julio", Buenos Aires, 120000 → moeda vira ARS sozinha; preview "≈ R$ 408,77".
- [ ] Com 2 convidados: Rateio mostra 3 membros; Você pagou tudo → os outros dois devem 1/3 cada; transferências corretas.
- [ ] Mudar "Dividir com" de um gasto pra só 2 pessoas → saldos mudam.
- [ ] Marcar transferência como acertada → riscada; editar um gasto que muda o valor → volta a aparecer como pendente.
- [ ] Gasto da Central: editar só muda quem pagou/divide; link leva pra Central.
- [ ] Nova viagem zera tudo.
- [ ] `npm run lint` e `npm run build` sem erro.
