# Ajuste 63 — Linha do tempo dentro do Roteiro: "Agenda do dia" com transporte, hospedagem, passeios e eventos

Terceira parte faltante (02/out/2026): **etapa 7 do fluxo proposto, "Linha do tempo"**. Em vez de uma tela nova, a linha do tempo entra no **Roteiro → Lista**. Cada dia passa a mostrar tudo o que tem hora marcada (voo, trem, ônibus, carro, check-in e check-out, passeio, ingresso, evento), puxado do que já foi preenchido na Central e nas Sugestões. A pessoa vê a viagem inteira num lugar só, sem cadastrar nada duas vezes.

Nada é digitado de novo: tudo vem de `transportItems`, `stayItems`, `otherItems` e `selectedEventIds`. A fonte continua sendo onde a pessoa cadastrou; o Roteiro só mostra.

---

## 1. Juntar os itens com data — `src/utils/agenda.ts` (novo)

```ts
export type AgendaKind = 'transporte' | 'checkin' | 'checkout' | 'retirada' | 'devolucao' | 'passeio' | 'ingresso' | 'evento';

export interface AgendaItem {
  id: string;            // `${kind}-${sourceId}` (carro e hospedagem geram 2 itens cada)
  sourceId: string;
  kind: AgendaKind;
  dateISO: string;       // yyyy-mm-dd
  time: string;          // "hh:mm" ou "" (sem hora vai pro fim do dia)
  icon: string;
  title: string;
  subtitle: string;
  /** pra onde levar ao tocar */
  link: { path: '/central'; tab: 'transporte' | 'estadia' | 'outros' } | { path: '/roteiro'; tab: 'sugestoes' }; // 'sugestoes' = aba Sugestões; usar o valor interno que a aba tiver hoje (ex.: 'lugares') e trocar de aba com setMainTab, sem navegar
}

export function buildAgenda(trip): AgendaItem[]; // ordenado por dateISO, depois time ("" por último)
export function parseDisplayDateTime(value: string): { dateISO: string; time: string } | null;
// "22/11/2026 14:00" → { dateISO: '2026-11-22', time: '14:00' }; só data também vale; texto fora do formato → null
```

Regras:
| Origem | Item(s) | Data/hora | Ícone | Título | Subtítulo |
|---|---|---|---|---|---|
| Voo / Ônibus / Trem | 1 | `departureAt` | ✈️ / 🚌 / 🚆 (`transportTypeIcon`) | `transportItemTitle` | "{origem} → {destino} · chega {hora de arrivalAt}" |
| Carro locado | 2: retirada e devolução | `pickupAt` / `dropoffAt` | 🚗 | "Retirada do carro" / "Devolução do carro" | locadora · local |
| Hospedagem | 2: check-in e check-out | `checkInDate` + `checkInTime` / `checkOutDate` + `checkOutTime` | 🛏️ / 🧳 | "Check-in: {nome}" / "Check-out: {nome}" | endereço ou cidade |
| Outros: passeio, ingresso | 1 | `startDate` + `time` | 🎟️ / 🎫 | título do registro | local/ponto de encontro |
| Outros: seguro | — | não entra (vale a viagem toda) | | | |
| Evento escolhido (Sugestões) | 1 | `date` + começo de `time` se tiver hh:mm | ícone do tipo (`EVENT_KIND_ICONS`) | nome | venue |

Item sem data válida não entra na agenda (continua só na Central). Hora sem formato hh:mm vira `""`, e no caso de evento o texto original (ex.: "a noite toda") aparece no subtítulo.

## 2. No dia — `src/screens/Itinerary.tsx`, aba Roteiro → Lista

Cada card de dia passa a ter **dois blocos**, nesta ordem:

### 2.1 "Agenda do dia" (só se houver item naquele dia)
- Subtítulo pequeno `🕒 Agenda do dia` (`--text-sm`, `--font-weight-semibold`, `--muted`).
- Lista compacta, uma linha por item (novo `src/components/itinerary/AgendaRow.tsx`):
  - à esquerda, a **hora** em coluna fixa de 48px (`--font-weight-semibold`; sem hora → "—");
  - ícone em círculo de 32px;
  - título (`--text-base`, semibold) e subtítulo (`--text-sm`, `--muted`);
  - linha vertical fina ligando os ícones (mesmo estilo de conectora do `TimelineStop`, mais discreta).
- Linha inteira é um botão (altura mínima 44px, foco visível) que leva pra origem: Central na aba certa (`navigate('/central', { state: { tab } })`) ou Sugestões. Eventos mantêm o "Remover" do ajuste 60 como ação secundária à direita.
- **Os eventos saem da lista de paradas** (onde o ajuste 60 colocou) e passam a ficar só aqui, já que têm hora marcada.

### 2.2 "Lugares do dia" (o que já existe)
- Subtítulo `📍 Lugares pra visitar`, seguido da timeline de paradas atual, com mover/pulei.
- Dia sem lugares mas com agenda: em vez de "Nenhum lugar alocado", mostrar "Sem lugares pra esse dia. Veja as Sugestões." com link pra aba Sugestões.

Espaçamento: `--space-5` entre os dois blocos; `--space-3` entre linhas da agenda.

### 2.3 Itens fora das datas da viagem
Se algum item da agenda cair fora do intervalo da viagem (ex.: voo de ida no dia anterior), ele aparece num card extra **no fim da lista**, "🗓️ Fora das datas da viagem", com a data escrita em cada linha. Assim nada fica escondido e a pessoa percebe se digitou errado.

### 2.4 Filtro por dia
As pills de data continuam iguais; filtrar um dia filtra os dois blocos.

## 3. Central abre na aba certa — `src/screens/Central.tsx`
Ler `useLocation().state?.tab` (`'transporte' | 'estadia' | 'outros'`) pra iniciar a aba. Sem state, Transporte (como hoje).

## 4. Mapa
Sem mudança: mapa continua mostrando lugares e eventos com coordenada.

## 5. `CLAUDE.md`
No item do Roteiro: a etapa 7 do fluxo (Linha do tempo) foi incorporada como "Agenda do dia" (`docs/ajustes-63-agenda-do-dia-no-roteiro.md`), montada a partir da Central e dos eventos escolhidos, sem cadastro duplicado.

## 6. Conferir (com o cenário fixo e os vouchers de exemplo)
- [ ] Hotel Magnolia (20–22/11) → 20/11 "Check-in" e 22/11 "Check-out" em Buenos Aires.
- [ ] Voo LA 4550 (22/11 14:00) aparece no 22/11 às 14:00, com "Buenos Aires (EZE) → Santiago (SCL) · chega 16:20".
- [ ] Trem Tren de la Costa (21/11 10:00) no 21/11.
- [ ] Carro Hertz → retirada e devolução no 23/11.
- [ ] Passeio Valle de la Luna (24/11 15:30) no 24/11; seguro não aparece.
- [ ] Feira de San Telmo escolhida → 22/11 na Agenda, não mais nas paradas.
- [ ] Mesmo dia: itens em ordem de horário, sem hora por último.
- [ ] Item com data 19/11 → card "Fora das datas da viagem".
- [ ] Tocar no voo → Central na aba Transporte.
- [ ] `npm run lint` e `npm run build` sem erro.
