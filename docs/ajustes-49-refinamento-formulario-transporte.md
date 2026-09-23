# Ajuste 49 — Refinamento do formulário de transporte (Central, Fase 1)

Contexto: feedback visual sobre o formulário de transporte (`TransportItemForm`) depois do ajuste 48. Cinco pontos, todos no mesmo formulário/grupo.

## 1. Moeda do custo sempre inicia em Real (BRL)

Hoje o campo `costCurrencyCode` nasce com o valor de `destinationCurrencyCode` (moeda do destino, ex.: CLP em Santiago). Trocar para sempre nascer em `'BRL'`, independente do destino — o usuário troca manualmente se precisar.

**`src/components/central/TransportItemForm.tsx`**
- Remover a prop `destinationCurrencyCode` da interface `TransportItemFormProps` e da desestruturação dos parâmetros (não é mais usada).
- Trocar:
  ```ts
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? destinationCurrencyCode);
  ```
  por:
  ```ts
  const [costCurrencyCode, setCostCurrencyCode] = useState(initialItem?.costCurrencyCode ?? 'BRL');
  ```

**`src/components/central/TransportDestinationGroup.tsx`**
- Remover a prop `destinationCurrencyCode={destination.currencyCode}` das duas chamadas de `<TransportItemForm>` (a de edição e a de criação — "new").

(`destination.currencyCode` continua existindo no destino em si, só não é mais repassado pra esse formulário. Vai ser usado depois em Estadia/Custos.)

## 2. Mais iconografia — ícone de upload + tipos de transporte com ícone

- Criar `src/components/shell/Icons.tsx` com um `UploadIcon` (SVG simples, seta pra cima entrando numa bandeja, `fill="currentColor"`, mesmo estilo do `PlatformIcons.tsx` já existente):
  ```tsx
  export function UploadIcon() {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 .7.29l4 4a1 1 0 0 1-1.4 1.42L13 6.41V15a1 1 0 1 1-2 0V6.41L8.7 8.71a1 1 0 0 1-1.4-1.42l4-4A1 1 0 0 1 12 3z"
        />
        <path
          fill="currentColor"
          d="M5 15a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 1 1 2 0v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-3a1 1 0 0 1 1-1z"
        />
      </svg>
    );
  }
  ```
- No botão "Enviar voucher" (`TransportItemForm.tsx`), usar esse ícone antes do texto e remover "(opcional)" do rótulo (mais detalhes no ponto 3, já que o botão também muda de estilo).
- Nos chips de "Tipo de transporte", usar os mesmos emojis já definidos em `transportSummary.ts` (`transportTypeIcon`). Importar `transportTypeIcon` de `../../utils/transportSummary` e trocar:
  ```ts
  const TYPE_OPTIONS: { value: TransportType; label: string }[] = [
    { value: 'voo', label: 'Voo' },
    { value: 'onibus', label: 'Ônibus' },
    { value: 'carro-locado', label: 'Carro locado' },
  ];
  ```
  por:
  ```ts
  const TYPE_OPTIONS: { value: TransportType; label: string }[] = [
    { value: 'voo', label: `${transportTypeIcon('voo')} Voo` },
    { value: 'onibus', label: `${transportTypeIcon('onibus')} Ônibus` },
    { value: 'carro-locado', label: `${transportTypeIcon('carro-locado')} Carro locado` },
  ];
  ```

## 3. Botão de voucher não pode mais parecer campo de input

Causa raiz: o componente `Button` (variant secondary) usa exatamente o mesmo fundo (`var(--card)`), borda (`var(--field-border)`) e raio (`--radius-ios-input`/`--radius-android-input`) que o `TextField` usa no `.inputWrap`. Visualmente são quase idênticos — por isso o botão "Enviar voucher" lê como campo de texto.

Solução: parar de usar o componente `Button` genérico nesse botão específico (assim como `Cancelar`/`Remover transporte`/`Trocar` já são `<button>` simples com classe própria nesse mesmo arquivo) e criar um botão próprio, em formato de pill (igual aos chips de `OptionChipGroup`, que também são `border-radius: 999px`), com cor de destaque — pra ficar claramente diferente de qualquer campo de input do app (nenhum campo de input do Tairu é redondo/pill).

**`src/components/central/TransportItemForm.tsx`** — trocar:
```tsx
<Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
  Enviar voucher (opcional)
</Button>
```
por:
```tsx
<button type="button" className={styles.voucherButton} onClick={() => fileInputRef.current?.click()}>
  <UploadIcon />
  Enviar voucher
</button>
```

**`src/components/central/TransportItemForm.module.css`** — adicionar:
```css
.voucherButton {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 var(--space-4);
  background: #f6e2e5;
  border: 1.5px solid var(--accent);
  border-radius: 999px;
  color: var(--accent-dark);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.voucherButton:active {
  transform: scale(0.98);
}
```
(`#f6e2e5` é um tom claro do `--accent` — não existe token de "accent suave" no `tokens.css` hoje, então o valor vai direto em hex, comentado no CSS.)

## 4. Formulário já vir aberto, com "Voo" pré-selecionado

Hoje, ao criar um transporte novo, nenhum tipo vem selecionado (`type` nasce `null`) e o grupo por destino só mostra o formulário depois de clicar em "+ Adicionar transporte". Trocar os dois pontos pra já vir tudo visível:

**`src/components/central/TransportItemForm.tsx`** — trocar:
```ts
const [type, setType] = useState<TransportType | null>(initialItem?.type ?? null);
```
por:
```ts
const [type, setType] = useState<TransportType | null>(initialItem?.type ?? 'voo');
```
(só afeta criação de item novo — ao editar um item existente continua usando o tipo salvo.)

**`src/components/central/TransportDestinationGroup.tsx`** — o formulário de "novo transporte" deve já vir aberto quando aquele destino ainda não tem nenhum transporte cadastrado (evita 1 clique a mais logo na primeira vez; se já existe pelo menos 1 item, continua fechado por padrão, do jeito que é hoje). Mover o cálculo de `items` pra antes do `useState` e usar inicialização preguiçosa:
```ts
export function TransportDestinationGroup({ destination }: TransportDestinationGroupProps) {
  const trip = useTrip();
  const items = trip.transportItems.filter((t) => t.destinationId === destination.id);
  const [editingId, setEditingId] = useState<string | 'new' | null>(() => (items.length === 0 ? 'new' : null));
  const dates = formatDestinationDates(destination);
  // ... resto do componente continua igual, só remove a segunda declaração de `items` que existia mais abaixo
```

## 5. Melhorar a distribuição visual do topo do formulário

O botão de voucher sozinho, ocupando a primeira linha inteira do card antes de qualquer outro conteúdo, pesa visualmente. Reorganizar em uma linha horizontal: um texto pequeno explicando o que é ("Tem um voucher?") ao lado esquerdo, botão compacto (já reduzido pelo ponto 3) à direita — assim ele para de parecer o elemento principal do formulário e o seletor de tipo de transporte volta a ser o primeiro destaque visual.

**`src/components/central/TransportItemForm.tsx`** — estrutura do bloco de upload passa a ser:
```tsx
<div className={styles.voucherUpload}>
  <input
    ref={fileInputRef}
    type="file"
    accept="application/pdf,image/*"
    className={styles.hiddenFileInput}
    onChange={handleVoucherFileChange}
  />
  <div className={styles.voucherUploadRow}>
    <span className={styles.voucherHint}>Tem um voucher? Anexe pra preencher os campos automaticamente.</span>
    <button type="button" className={styles.voucherButton} onClick={() => fileInputRef.current?.click()}>
      <UploadIcon />
      Enviar voucher
    </button>
  </div>

  {voucherRecognized === true && ( ... mantém igual ... )}
  {voucherRecognized === false && ( ... mantém igual ... )}
  {voucherRecognized === null && voucherFileName && ( ... mantém igual ... )}
</div>
```

**`src/components/central/TransportItemForm.module.css`** — adicionar:
```css
.voucherUploadRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.voucherHint {
  flex: 1;
  min-width: 160px;
  font-size: 13px;
  color: var(--muted);
}
```
(`.voucherUpload` continua como está, só passa a conter essa nova linha em vez do botão solto direto.)

## Import a adicionar

No topo de `TransportItemForm.tsx`:
```ts
import { UploadIcon } from '../shell/Icons';
import { transportTypeIcon } from '../../utils/transportSummary';
```

## Resultado esperado

- Custo de um transporte novo já abre em R$ (Real), qualquer que seja o destino.
- Botão "Enviar voucher" com ícone de upload, sem "(opcional)", em formato de pill com cor de destaque — lido claramente como botão, não como campo.
- Chips de tipo de transporte com ícone (✈️ Voo, 🚌 Ônibus, 🚗 Carro locado).
- Ao adicionar o primeiro transporte de um destino, o formulário já abre com "Voo" selecionado e os campos visíveis — sem precisar clicar em "+ Adicionar transporte" nem escolher o tipo.
- Topo do formulário mais leve: texto pequeno + botão compacto lado a lado, em vez de um botão grande sozinho.
