# Ajuste 67 — Convidados do cenário entram na viagem e contribuem (dados simulados)

Pedido da Adriana (02/out/2026): a visão do convidado vai ser **um protótipo separado**. Neste protótipo (visão de quem organiza), o Roteiro precisa **simular que os convidados também contribuíram**, senão o teste não mostra o lado colaborativo, que é a proposta do app (planejar "sozinho ou em grupo").

Decisões (escolhidas por ela):
- **Gatilho:** ao convidar os e-mails do cenário fixo (**marina.duarte@email.com** e **rodrigo.antunes@email.com**), a pessoa "entra" na viagem poucos segundos depois e as contribuições dela aparecem. **Qualquer outro e-mail continua só "Convite enviado"**, como hoje.
- **Onde aparecem:** **Roteiro** (lugares que eles adicionaram e lugares que eles também querem) e **Custos** (gastos pagos por eles, pra o rateio ficar realista).
- Isso **muda a regra antiga** "nunca simular aceito": agora vale "**só os dois convidados do cenário fixo simulam entrada, e tudo o que eles fazem vem de um arquivo de mock identificado**". Registrar no `CLAUDE.md`.
- Lugares deles são **lugares reais do `places.json`** (nada inventado); gastos têm valores plausíveis, marcados no código como simulação.

---

## 1. Dados simulados — `src/data/mockCompanions.ts` (novo)

```ts
export interface MockCompanionProfile {
  email: string;            // comparação sem diferenciar maiúsculas
  name: string;
  initials: string;
  /** placeIds de places.json; só entram os da cidade que existir na viagem */
  places: string[];
  expenses: {
    key: string;            // estável, pra não duplicar
    description: string;
    amount: string;
    currencyCode: string;
    cityId: string;         // vira destinationId do destino com essa cidade (ou null se não existir)
    category: ExpenseCategory;
    dateISO: string;
  }[];
}

export const MOCK_COMPANIONS: MockCompanionProfile[] = [
  {
    email: 'marina.duarte@email.com',
    name: 'Marina Duarte',
    initials: 'MD',
    places: [
      'ba-don-julio', 'ba-malba', 'ba-cafe-tortoni',
      'sc-bocanariz', 'sc-cerro-san-cristobal',
      'atc-laguna-cejar',
    ],
    expenses: [
      { key: 'marina-tatio', description: 'Tour Géiseres del Tatio (3 pessoas)', amount: '135000',
        currencyCode: 'CLP', cityId: 'san-pedro-de-atacama-cl', category: 'passeios', dateISO: '2026-11-25' },
    ],
  },
  {
    email: 'rodrigo.antunes@email.com',
    name: 'Rodrigo Antunes',
    initials: 'RA',
    places: [
      'ba-la-bombonera', 'ba-recoleta-cemiterio',
      'sc-mercado-central', 'sc-barrio-lastarria',
      'atc-valle-de-la-luna', 'atc-geiseres-del-tatio',
    ],
    expenses: [
      { key: 'rodrigo-transfer-eze', description: 'Transfer Ezeiza → hotel', amount: '45000',
        currencyCode: 'ARS', cityId: 'buenos-aires-ar', category: 'transporte', dateISO: '2026-11-20' },
    ],
  },
];

export function findMockCompanion(email: string): MockCompanionProfile | undefined;
```
Comentário no topo do arquivo: "SIMULAÇÃO — dados de convidados fictícios do cenário fixo de teste. Não há backend; nada aqui vem de outra pessoa de verdade."

## 2. Modelo — `src/context/TripContext.tsx`

- `TripCompanion` ganha:
  ```ts
  status: 'convite-enviado' | 'entrou';
  /** só preenchido quando é um convidado simulado do cenário */
  name?: string;
  initials?: string;
  ```
- `TripPlaceSelection` ganha:
  ```ts
  /** quem adicionou: 'voce' ou TripCompanion.id */
  addedBy: MemberId;
  /** outros membros que também querem ir */
  alsoWantedBy: MemberId[];
  ```
  Tudo o que a pessoa adiciona continua `addedBy: 'voce'`, `alsoWantedBy: []`.
- `Expense` não muda (já tem `paidBy`); gastos simulados usam `paidBy = companion.id`, `splitWith: null` e id `mock-${key}`.

## 3. Entrada simulada — `addCompanion`

Depois de adicionar o convite (como hoje):
1. Se `findMockCompanion(email)` existir, após **2,5 s** (`setTimeout`, limpo se o convite for removido antes) o convidado muda pra `status: 'entrou'` com `name`/`initials`.
2. Toast: "**Marina Duarte entrou na viagem** e sugeriu 5 lugares" (contar só os que entraram de fato).
3. Aplicar as contribuições (seção 4).

## 4. Aplicar contribuições (idempotente) — `src/utils/mockContributions.ts` (novo)

`applyMockContributions(state) → state` roda **na entrada** e também **sempre que os destinos mudarem** (efeito em `TripProvider` dependente de `destinations` e `companions`), assim funciona mesmo se a pessoa convidar antes de cadastrar os 3 destinos:
- Pra cada convidado `entrou` com perfil mock, pra cada `placeId` cuja cidade exista na viagem:
  - se o lugar **já foi escolhido** naquele destino → acrescentar o id do convidado em `alsoWantedBy` (sem duplicar);
  - se **não foi** → criar `TripPlaceSelection` com `addedBy: companion.id`.
- Pra cada gasto mock cuja chave ainda não existe (`mock-${key}`), criar o `Expense` (destino = destino com aquela `cityId`, ou `null`).
- Nunca recriar algo que a pessoa removeu: guardar `dismissedMockKeys: string[]` no estado. Quando a pessoa remove um lugar adicionado por convidado ou um gasto mock, a chave (`place:${companionId}:${placeId}` / `expense:${key}`) entra ali.

**Remover o convite** de um convidado que entrou: tirar os lugares com `addedBy` dele (os que ninguém mais quer), tirar o id dele de `alsoWantedBy`, apagar os gastos `paidBy` dele e limpar os overrides/`splitWith` que citam ele.

## 5. Onde aparece

### 5.1 Convidados — `InviteCompanions.tsx`
- Linha de quem entrou: avatar redondo 32px com as iniciais (fundo `--bg-low`, texto `--text`), **nome** em destaque, e-mail embaixo, status **"✓ Entrou na viagem"** (em `--success` com ícone) e resumo "sugeriu 5 lugares · pagou 1 gasto".
- Enquanto não entra: "Convite enviado" como hoje.

### 5.2 Sugestões (Roteiro)
- Novo componente `MemberAvatars` (círculos de 24px sobrepostos, com iniciais; "Você" = "EU"). `aria-label` lista os nomes.
- `PlaceCard`: abaixo do bairro, quando alguém do grupo quer o lugar, `MemberAvatars` + texto curto: "Marina quer ir" / "Marina e Rodrigo querem ir" / "Você e Marina querem ir". O "✓" de adicionado continua valendo pro lugar estar no roteiro, venha de quem vier.
- **Nova seção no topo** (antes de Eventos), só quando houver contribuição de convidado na cidade ativa: **"👥 Escolhas do grupo"** — "O que quem você convidou quer fazer em {cidade}." com os lugares adicionados por convidados.
- Tocar no "✓" de um lugar adicionado por convidado remove do roteiro (registra em `dismissedMockKeys`) e mostra toast "Removido do roteiro. {Nome} tinha sugerido esse lugar."

### 5.3 Roteiro → Lista
- Em cada parada, junto das tags de categoria: `MemberAvatars` + "Sugerido por Marina" (quando `addedBy` ≠ você) ou "Marina também quer" (quando houver `alsoWantedBy`).

### 5.4 Custos
- Os gastos simulados entram normalmente em Lançamentos ("Pago por Marina Duarte") e no Rateio; o `memberLabel` passa a usar `name` quando existir (cai pro começo do e-mail quando não).
- Selo pequeno "👥 Lançado por Marina" no card do gasto (no lugar de "🧾 Da Central").

## 6. Roteiro de teste e `CLAUDE.md`
- `CLAUDE.md`: substituir a regra "nunca simular aceito" por: "só os dois convidados do cenário fixo (`src/data/mockCompanions.ts`) simulam entrada e contribuições; qualquer outro e-mail fica em 'Convite enviado'. A visão do convidado é outro protótipo (fora deste)". Registrar `docs/ajustes-67-convidados-simulados-contribuem.md`.
- O roteiro de teste já pede pra convidar Marina e Rodrigo; a revisão do roteiro (ajuste 68) vai incluir uma tarefa pra perceber as contribuições.

## 7. Conferir
- [ ] Convidar marina.duarte@email.com → "Convite enviado"; ~2,5 s depois "Entrou na viagem" + toast com o nº de lugares.
- [ ] Convidar fulano@teste.com → fica só "Convite enviado".
- [ ] Sugestões em Buenos Aires: seção "Escolhas do grupo" com Don Julio, MALBA, Café Tortoni; se você já tinha escolhido Don Julio, o card mostra "Você e Marina querem ir".
- [ ] Roteiro: paradas da Marina com "Sugerido por Marina".
- [ ] Convidar antes de cadastrar San Pedro de Atacama → ao cadastrar depois, Laguna Cejar aparece sozinha.
- [ ] Custos: "Tour Géiseres del Tatio" pago por Marina e "Transfer Ezeiza → hotel" pago por Rodrigo; rateio com 3 pessoas fecha.
- [ ] Remover um lugar sugerido pela Marina → não volta mais. Remover o convite da Marina → somem lugares e gasto dela.
- [ ] `npm run lint` e `npm run build` sem erro.
