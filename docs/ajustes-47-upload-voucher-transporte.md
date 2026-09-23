# Ajuste 47 — Upload de voucher (mock) em Transporte, com preenchimento automático

Feedback da Adriana (22/set/2026), depois de ver o `ajustes-46` (aba Transporte por destino) funcionando: faltou o botão de subir voucher, com preenchimento automático dos campos — ela pediu pra eu também produzir os arquivos de voucher de exemplo.

**Cenário usado nos vouchers**: o mesmo cenário fixo de teste (`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md`) — viagem Buenos Aires → Santiago → San Pedro de Atacama, 20-25/nov/2026. O roteiro de teste já reserva a tarefa de **voo São Paulo → Buenos Aires pra preenchimento manual** (tarefa 7) — por isso os vouchers de exemplo cobrem os OUTROS trechos da viagem (a lógica de trajeto que ela pediu): o deslocamento Buenos Aires→Santiago, um carro alugado em Santiago pra um passeio até Viña del Mar, e a chegada em San Pedro de Atacama via Calama (voo + transfer, forma real de chegar lá — não existe trem nessa região, troquei pelo transfer terrestre que existe de verdade).

**4 arquivos PDF já entregues** (enviados no chat e salvos em `Prototipo_Mes2/public/mock-vouchers/` — pasta nova, visível no Finder):
1. `voucher-voo-buenosaires-santiago.pdf` — LATAM (exemplo), voo LA 4550, Buenos Aires (EZE) → Santiago (SCL), 22/11/2026, 14:00–16:20.
2. `voucher-carro-santiago-vinadelmar.pdf` — Hertz (exemplo), retirada e devolução no Aeroporto de Santiago, 23/11/2026 09:00–20:00 (passeio de um dia até Viña del Mar).
3. `voucher-voo-santiago-calama.pdf` — LATAM (exemplo), voo LA 250, Santiago (SCL) → Calama (CJC), 24/11/2026, 08:00–09:45.
4. `voucher-transfer-calama-sanpedro.pdf` — Transvip (exemplo), transfer Aeroporto de Calama → San Pedro de Atacama, 24/11/2026, saída 10:15, chegada estimada 11:45.

Todos os 4 têm uma nota no rodapé deixando claro que são documentos de exemplo pro teste, não reservas reais. **Importante**: o reconhecimento automático nesta fase é só por **nome do arquivo** (não é OCR/IA de verdade — o protótipo não tem backend nem leitura de conteúdo de arquivo) — funciona só com esses 4 arquivos exatos. Qualquer outro arquivo enviado (uma foto qualquer, um PDF diferente) é aceito, mas não preenche nada sozinho — a pessoa preenche manualmente, o que já é o comportamento hoje.

## 1. Novo lookup — `src/data/mockVouchers.ts`

```ts
import type { TransportItem, TransportType } from '../context/TripContext';

type MockVoucherFields = Omit<TransportItem, 'id' | 'destinationId' | 'cost' | 'voucherFileName'>;

export const MOCK_TRANSPORT_VOUCHERS: Record<string, MockVoucherFields> = {
  'voucher-voo-buenosaires-santiago.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 4550',
    origin: 'Buenos Aires (EZE)',
    destination: 'Santiago (SCL)',
    departureAt: '22/11/2026 14:00',
    arrivalAt: '22/11/2026 16:20',
  },
  'voucher-carro-santiago-vinadelmar.pdf': {
    type: 'carro-locado',
    company: 'Hertz',
    vehicleCategory: 'Compacto',
    pickupLocation: 'Aeroporto de Santiago (SCL)',
    pickupAt: '23/11/2026 09:00',
    dropoffLocation: 'Aeroporto de Santiago (SCL)',
    dropoffAt: '23/11/2026 20:00',
  },
  'voucher-voo-santiago-calama.pdf': {
    type: 'voo',
    company: 'LATAM Airlines',
    flightNumber: 'LA 250',
    origin: 'Santiago (SCL)',
    destination: 'Calama (CJC)',
    departureAt: '24/11/2026 08:00',
    arrivalAt: '24/11/2026 09:45',
  },
  'voucher-transfer-calama-sanpedro.pdf': {
    type: 'onibus',
    company: 'Transvip',
    origin: 'Calama (CJC)',
    destination: 'San Pedro de Atacama',
    departureAt: '24/11/2026 10:15',
    arrivalAt: '24/11/2026 11:45',
  },
};

/** Reconhecimento só por nome do arquivo (mock, sem OCR/backend) — case-insensitive. */
export function lookupMockTransportVoucher(fileName: string): MockVoucherFields | null {
  return MOCK_TRANSPORT_VOUCHERS[fileName.toLowerCase()] ?? null;
}
```

## 2. `src/components/central/TransportItemForm.tsx` — botão de upload no topo do formulário

Adicionar, como primeiro elemento do formulário (antes do seletor de tipo `OptionChipGroup`):

- Estado local novo: `const [voucherFileName, setVoucherFileName] = useState<string | null>(initialItem?.voucherFileName ?? null);` e `const [voucherRecognized, setVoucherRecognized] = useState<boolean | null>(null);` (`null` = nada enviado ainda nessa sessão de edição; `true`/`false` só depois de um upload, pra saber se mostra a mensagem de sucesso ou de "não reconhecido").
- Um `<input type="file" accept="application/pdf,image/*">` escondido, disparado por um botão visível **"Enviar voucher (opcional)"** (`Button variant="secondary"`) — mesmo padrão de "input escondido + botão estilizado" é comum em apps reais pra upload, sem depender de estilizar o `<input type=file>` nativo direto.
- No `onChange` do input: pega `event.target.files?.[0]`, chama `lookupMockTransportVoucher(file.name)`.
  - Se encontrou: `setVoucherFileName(file.name)`, `setVoucherRecognized(true)`, e **sobrescreve os estados de `type` e de todos os campos do formulário** com os valores do voucher (isso já deixa o restante do formulário — seletor de tipo + campos — preenchido, do jeito que a pessoa via em Destinos ao usar autocomplete).
  - Se não encontrou: `setVoucherFileName(file.name)`, `setVoucherRecognized(false)` — não mexe em nenhum campo.
- Mensagem logo abaixo do botão, condicional:
  - `voucherRecognized === true`: `"✓ Voucher enviado: {voucherFileName} — campos preenchidos automaticamente. Confira antes de salvar."` (cor de sucesso/`--text`, ícone ✓).
  - `voucherRecognized === false`: `"Não reconhecemos esse voucher automaticamente — confira/preencha os campos manualmente abaixo."` (cor `--muted`).
  - `voucherFileName` preenchido (edição de um item que já tinha voucher, sem novo upload nesta sessão): `"📎 Voucher anexado: {voucherFileName}"` com um link "Trocar" que reabre o seletor de arquivo.
- Ao montar o `TransportItem` final no "Salvar transporte", incluir `voucherFileName` (novo campo já existe no tipo desde o `ajustes-46`).
- Sem leitura/armazenamento real do conteúdo do arquivo — só o nome. Não há backend nesse protótipo, então isso é intencional (mesmo princípio já usado nas fotos da Wikipedia — nunca fingir tem quando não tem).

## 3. `src/components/central/TransportItemCard.tsx` — indicar que tem voucher

Quando `item.voucherFileName` existe, adicionar uma linha pequena abaixo do detalhe (cor `--muted`, ícone 📎): `"Voucher anexado"`. Não precisa mostrar o nome do arquivo aqui (já aparece no formulário ao editar).

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Adicionar um novo transporte, clicar "Enviar voucher", escolher `voucher-voo-buenosaires-santiago.pdf` (da pasta `public/mock-vouchers/`, visível no Finder dentro de `Prototipo_Mes2`): tipo muda pra "Voo" automaticamente, todos os campos aparecem preenchidos (LATAM Airlines, LA 4550, Buenos Aires (EZE) → Santiago (SCL), datas/horas) — mensagem de sucesso aparece. Salvar funciona normalmente.
- Testar os outros 3 vouchers — cada um preenche o tipo e os campos certos (o `voucher-transfer-calama-sanpedro.pdf` deve cair no tipo "Ônibus", já que é o tipo mais próximo de transporte terrestre coletivo que o app tem).
- Enviar um arquivo qualquer que não seja um dos 4 (ex.: uma foto aleatória): mensagem de "não reconhecido" aparece, nenhum campo é preenchido/sobrescrito, formulário continua editável normalmente.
- Card salvo com voucher mostra "📎 Voucher anexado"; sem voucher, não mostra nada a mais.
- Editar um item que tem voucher: o formulário reabre mostrando "📎 Voucher anexado: <nome>" com opção de trocar.
