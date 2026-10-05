# Ajuste 62 — Conversor de moedas (ferramenta de apoio)

Segunda parte faltante do fluxo (02/out/2026). No fluxo proposto, o conversor é uma **ferramenta de apoio independente**, que a pessoa usa a qualquer momento, sem estar presa a lançar um gasto. Por exemplo, pra conferir quanto custa algo antes de comprar.

Depende do `ajustes-61` (usa `src/utils/money.ts` e `src/data/exchangeRates.json`, mesma cotação de 02/10/2026).

Onde fica:
1. **3ª aba de Custos**: Lançamentos · Rateio · **Conversor**.
2. **Atalho em Dicas locais**: no bloco "Dinheiro e câmbio" de cada cidade, um link "💱 Abrir conversor" que abre Custos já na aba Conversor, com a moeda daquela cidade.

---

## 1. Conversão entre quaisquer moedas — `src/utils/money.ts`
Acrescentar:
```ts
/** amount em `from` → `to`, passando pela base BRL. null se faltar cotação. */
export function convert(amount: number, from: string, to: string): number | null;
// amount / rates[from] * rates[to]
```

## 2. Componente — `src/components/costs/CurrencyConverter.tsx` (novo)

Props: `initialFrom: string`, `tripCurrencies: string[]` (moedas dos destinos da viagem, sem repetir, + BRL), `onLaunchExpense(amount: string, currencyCode: string)`.

De cima pra baixo:
1. **"Valor"**: `TextField` `inputMode="decimal"`, usando `parseAmount`. Começa vazio.
2. **"De"** e **"Para"**: dois `CurrencySelect` lado a lado com um botão redondo **⇅** de 44px entre eles, que inverte as moedas (`aria-label="Inverter moedas"`). Padrão: De = `initialFrom`, Para = BRL. Se `initialFrom` for BRL, Para = moeda do primeiro destino.
3. **Atalhos de moeda**: linha de chips com as `tripCurrencies` (ex.: `ARS` `CLP` `BRL`) logo abaixo do "De". Tocar troca o "De".
4. **Resultado**: card em destaque (`--card`, raio do card, padding `--space-5`): valor convertido em `--text-2xl`/`--font-weight-bold` com `formatMoney`, e embaixo, em `--text-sm`, a taxa unitária: "1 ARS = R$ 0,0034 · 1 BRL = 293,56 ARS". Sem valor digitado, o card mostra só a taxa unitária.
5. **"Valores de referência"**: tabelinha de 4 linhas na moeda "De" → "Para", pra consultar rápido na rua. Os valores mudam conforme a moeda:
   - moedas com cotação > 100 por real (ARS, CLP, COP, PYG, KRW, IDR, VND…): 1.000 · 5.000 · 10.000 · 50.000
   - entre 10 e 100 (JPY, INR…): 100 · 500 · 1.000 · 5.000
   - abaixo de 10 (BRL, USD, EUR…): 10 · 50 · 100 · 500
6. **"Lançar como gasto"**: botão secundário, só habilitado com valor válido. Chama `onLaunchExpense(valor digitado, moeda De)`.
7. Rodapé `--text-sm`/`--muted`: "Cotação de {RATES_AS_OF} ({RATES_SOURCE_LABEL}). Pode variar na hora da compra."

Moeda sem cotação → no lugar do resultado: "Sem cotação pra {código} no protótipo."

## 3. Custos com 3 abas — `src/screens/Costs.tsx`
- `tab` passa a aceitar `'conversor'`; item `{ value: 'conversor', label: 'Conversor' }` no fim.
- **Estado inicial vindo da navegação**: ler `useLocation().state` → `{ tab?: 'conversor'; currencyCode?: string }`. Se vier `tab`, abrir nela; `currencyCode` vira o `initialFrom`. Sem state, `initialFrom` = moeda do primeiro destino da viagem (ou BRL sem destino).
- **"Lançar como gasto"**: muda pra aba Lançamentos e abre o `ExpenseForm` novo já com valor e moeda preenchidos. O `ExpenseForm` ganha uma prop opcional `prefill?: { amount: string; currencyCode: string }`, usada só quando `initialExpense` é null. O destino ("Onde foi?") fica sem escolha, pra não trocar a moeda sozinho.
- O `CostSummary` continua no topo nas três abas.

## 4. Atalho em Dicas locais — `src/screens/Itinerary.tsx`
Na aba Dicas locais, dentro do bloco cuja `cat.category === 'dinheiro'`, depois da lista de dicas:
```tsx
<button type="button" className={styles.converterLink}
  onClick={() => navigate('/custos', { state: { tab: 'conversor', currencyCode: tipsDestination.currencyCode } })}>
  <span aria-hidden="true">💱</span> Abrir conversor ({tipsDestination.currencyCode} → BRL)
</button>
```
Estilo: link de texto em `--accent-dark`, `font-weight` semibold, altura mínima 44px, foco visível. Se a cidade não tiver bloco "dinheiro" nas dicas, mostrar o mesmo link no fim da lista de dicas daquela cidade.

## 5. `CLAUDE.md`
No item de Custos, acrescentar: aba Conversor (`docs/ajustes-62-conversor-de-moedas.md`), atalho a partir de Dicas locais → Dinheiro e câmbio, e "Lançar como gasto" com valor e moeda preenchidos.

## 6. Conferir
- [ ] Custos → Conversor: De = ARS (1º destino Buenos Aires), Para = BRL. Digitar 10000 → "R$ 34,06".
- [ ] ⇅ inverte; chip CLP troca o "De"; a tabela de referência muda de escala (1.000…50.000 pra ARS/CLP; 10…500 pra BRL/USD).
- [ ] "Lançar como gasto" → aba Lançamentos, formulário novo com 10000 ARS preenchidos.
- [ ] Roteiro → Dicas locais → Santiago → "Abrir conversor (CLP → BRL)" abre Custos na aba Conversor com CLP.
- [ ] Rodapé com a data da cotação sempre visível.
- [ ] `npm run lint` e `npm run build` sem erro.
