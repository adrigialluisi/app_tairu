# Ajuste 57 — Central: Trem como tipo de transporte (com voucher) + aba "Estadia" vira "Hospedagem"

Pedido da Adriana (02/out/2026):
1. **Trem tem que entrar como opção de transporte**, com campos próprios e upload de voucher que preenche os campos, igual Voo/Ônibus/Carro locado.
2. Renomear a aba **Estadia → Hospedagem** (palavra que ela usa).
3. Seguro viagem **continua** na aba Outros (é da viagem: período, custo, compartilhado com o grupo). Só ganha um aviso apontando o seguro anual/do cartão pra Meus documentos (o tipo novo entra no `ajustes-58`).

Depende de: `ajustes-56` aplicado (form de Transporte sem "Cancelar").

Arquivo já entregue junto com este doc (não precisa criar): `public/mock-vouchers/voucher-trem-buenosaires-tigre.pdf` — Tren de la Costa, Estación Maipú (Olivos) → Estación Delta (Tigre), 21/11/2026, 10:00–10:30, classe Turista, vagão 2 · assento livre, código TDC-48217. Rodapé dizendo que é documento de exemplo. É um passeio de trem dentro do trecho de Buenos Aires (mesma lógica do carro locado dentro do trecho de Santiago).

---

## 1. Modelo: `src/context/TripContext.tsx`

```ts
export type TransportType = 'voo' | 'onibus' | 'trem' | 'carro-locado';

export interface TrainTransportItem extends TransportItemBase {
  type: 'trem';
  /** operadora, ex.: Tren de la Costa, Renfe, Trenitalia */
  company: string;
  /** número do trem ou nome da linha/ramal */
  trainNumber: string;
  /** estação de embarque */
  origin: string;
  /** estação de desembarque */
  destination: string;
  departureAt: string;
  arrivalAt: string;
  /** "Turista", "Primeira", "Executiva"… (opcional) */
  travelClass: string;
  /** texto livre: "Vagão 2 · assento 14" (opcional) */
  seat: string;
  bookingCode: string;
}

export type TransportItem =
  | FlightTransportItem
  | BusTransportItem
  | TrainTransportItem
  | CarRentalTransportItem;
```
Ordem do tipo na união e nos chips: Voo, Ônibus, **Trem**, Carro locado.

## 2. Resumo: `src/utils/transportSummary.ts`

- `TYPE_LABELS.trem = 'Trem'`, `TYPE_ICONS.trem = '🚆'`.
- `transportItemTitle`: `case 'trem': return [item.company, item.trainNumber].filter(Boolean).join(' · ') || 'Trem';`
- `transportItemDetailRows`: o `case 'trem'` usa a mesma lógica de `voo`/`onibus` (Saída / Chegada / data · horários), trocando os prefixos pra **"Embarque: "** e **"Desembarque: "** (são estações), e acrescenta no fim uma linha com `[travelClass, seat].filter(Boolean).join(' · ')` quando tiver algo. Código da reserva não aparece no card (mesmo critério de voo). Sugestão: extrair a montagem das linhas de origem/destino/horário pra um helper interno e chamar dos 3 casos, em vez de copiar.

## 3. Formulário: `src/components/central/TransportItemForm.tsx`

- `TYPE_OPTIONS`: incluir `{ value: 'trem', label: \`${transportTypeIcon('trem')} Trem\` }` entre Ônibus e Carro locado.
- `flightOrBus` passa a aceitar `'trem'` também (origem, destino, partida e chegada são os mesmos campos). Renomear pra `routeItem` se quiser deixar mais claro.
- Estados novos: `trainNumber`, `travelClass`, `seat`, `bookingCode` (iniciam do `initialItem` quando `type === 'trem'`, senão `''`).
- Bloco `{type === 'trem' && (…)}`, nesta ordem, todos `TextField` com `autoComplete="off"`:
  1. "Operadora" (`company`) — placeholder "Ex.: Tren de la Costa"
  2. "Número do trem ou linha" (`trainNumber`)
  3. "Estação de embarque" (`origin`)
  4. "Estação de desembarque" (`destination`)
  5. "Data/hora de partida" (`departureAt`, placeholder `DATETIME_PLACEHOLDER`)
  6. "Data/hora de chegada" (`arrivalAt`, placeholder `DATETIME_PLACEHOLDER`)
  7. "Classe (opcional)" (`travelClass`) — placeholder "Ex.: Turista"
  8. "Vagão e assento (opcional)" (`seat`) — placeholder "Ex.: Vagão 2, assento 14"
  9. "Código da reserva (opcional)" (`bookingCode`, `autoCapitalize="characters"`)
- `handleSave`: `else if (type === 'trem') onSave({ ...base, type, company, trainNumber, origin, destination, departureAt, arrivalAt, travelClass, seat, bookingCode });`
- `handleVoucherFile`: novo ramo `match.type === 'trem'` preenchendo todos os campos acima.
- Custo + moeda continuam iguais (aparecem pra qualquer tipo).

## 4. Voucher mock: `src/data/mockVouchers.ts`

Acrescentar em `MOCK_TRANSPORT_VOUCHERS`:
```ts
'voucher-trem-buenosaires-tigre.pdf': {
  type: 'trem',
  company: 'Tren de la Costa',
  trainNumber: 'Ramal Maipú–Delta',
  origin: 'Estación Maipú (Olivos)',
  destination: 'Estación Delta (Tigre)',
  departureAt: '21/11/2026 10:00',
  arrivalAt: '21/11/2026 10:30',
  travelClass: 'Turista',
  seat: 'Vagão 2 · assento livre',
  bookingCode: 'TDC-48217',
},
```
O `DistributiveOmit` já cobre o tipo novo sem mudança.

## 5. Aba "Estadia" vira "Hospedagem" (só texto visível)

Não renomear rota, tipos (`StayItem`, `StayType`), arquivos nem o valor interno `'estadia'` da aba — só o que aparece pra pessoa:
- `src/screens/Central.tsx`: `{ value: 'estadia', label: 'Hospedagem' }`.
- `src/components/central/StayItemForm.tsx`: "Salvar estadia" → **"Salvar hospedagem"**; "Remover estadia" → **"Remover hospedagem"**.
- `src/components/central/StayDestinationGroup.tsx`: "+ Adicionar estadia" → **"+ Adicionar hospedagem"**.
- Conferir com `grep -rni "estadia" src` se sobrou algum texto visível (comentários podem ficar).

## 6. Aviso do seguro anual na aba Outros

`src/components/central/OtherItemForm.tsx`: quando `type === 'seguro'`, logo abaixo do `OptionChipGroup` "O que é esse registro?", mostrar um parágrafo curto (mesmo estilo de hint já usado no projeto, cor `--muted`, 13px):

> Tem seguro anual ou do cartão de crédito? Guarde em **Meus documentos**, assim ele vale pra todas as suas viagens.

"Meus documentos" é um link (`useNavigate` → `/documentos`), com alvo de toque ≥ 44px de altura ou, se ficar inline, pelo menos com foco visível. Depende do tipo "Seguro anual" do `ajustes-58` (se for aplicar o 57 antes do 58, o link já funciona; só o tipo novo é que aparece depois).

## 7. Conferir

- [ ] Central → Transporte → escolher Trem: aparecem os 9 campos + custo.
- [ ] Enviar `voucher-trem-buenosaires-tigre.pdf`: tipo vira Trem e todos os campos são preenchidos, mensagem "Campos preenchidos automaticamente".
- [ ] Card do trem: título "Tren de la Costa · Ramal Maipú–Delta", linhas Embarque/Desembarque/data·horário e "Turista · Vagão 2 · assento livre".
- [ ] Editar o trem e trocar pra Voo e de volta: origem/destino/horários continuam preenchidos.
- [ ] Aba diz "Hospedagem"; botões "Salvar hospedagem", "+ Adicionar hospedagem", "Remover hospedagem".
- [ ] Outros → Seguro viagem mostra o aviso com link pra Meus documentos.
- [ ] `npm run lint` e `npm run build` sem erro (o `switch` de `transportItemTitle`/`transportItemDetailRows` precisa cobrir `'trem'`, senão o TypeScript acusa).
