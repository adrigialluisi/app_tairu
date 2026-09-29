# Ajuste 53 — Central, aba Outros: seguro viagem, passeios, ingressos e outros registros, com anexo de arquivos

Pedido da Adriana (24/set/2026): fazer a aba **Outros** da Central (hoje placeholder "em construção"), para seguro viagem e outros itens práticos. Com **botão de upload de arquivos**, e **a própria pessoa escolhe o que é aquele registro**.

**Depende do `ajustes-52` já aplicado** (usa a prop `required={false}` do `DateRangeField` e segue o padrão sem "Cancelar").

Decisões de desenho, seguindo o que já existe em Transporte e Estadia:
- **A pessoa escolhe o tipo do registro**, sem reconhecimento automático. Tipos: 🛡️ Seguro viagem, 🎟️ Passeio ou excursão, 🎫 Ingresso ou evento, 📶 Chip ou internet, 📋 Outro. Cada tipo mostra só os campos que fazem sentido pra ele (mesma lógica de Voo/Ônibus/Carro locado).
- **Anexo de arquivos, mais de um por registro.** Diferente do voucher de Transporte/Estadia (um arquivo só, que preenche campos), aqui o anexo é **só guardar o documento**: não preenche nada. Ex.: apólice + carteirinha do seguro; ingresso de cada pessoa do grupo.
- **O arquivo anexado abre de verdade** ao tocar no nome (abre numa aba nova com `URL.createObjectURL`). Vale só enquanto o app está aberto, igual o resto do estado em memória do protótipo.
- **Lista única da viagem, não agrupada por destino.** Seguro e chip normalmente valem pra viagem toda. Cada registro tem o campo **"Vale para"**: "Viagem toda" (padrão) ou um dos destinos cadastrados. O card mostra isso.
- Custo + moeda (começa em BRL), nunca aparece no card, fica guardado pra Fase 4 (Custos). Igual Transporte/Estadia.
- **Sem botão "Cancelar"**, seguindo o feedback do `ajustes-52`.

Arquivos já entregues junto com este doc (não precisa criar), pra ter o que anexar no teste:
- `public/mock-vouchers/seguro-viagem-exemplo.pdf`: apólice de exemplo, vigência 20–25/11/2026, Argentina e Chile, central 24h.
- `public/mock-vouchers/ingresso-passeio-valle-de-la-luna-exemplo.pdf`: passeio Valle de la Luna ao pôr do sol, 24/11/2026, 15:30.
Os dois têm rodapé dizendo que são documentos de exemplo.

---

## 1. Modelo de dados: `src/context/TripContext.tsx`

Abaixo de `StayItem`:
```ts
export type OtherItemType = 'seguro' | 'passeio' | 'ingresso' | 'chip' | 'outro';

export interface Attachment {
  id: string;
  fileName: string;
  /** URL.createObjectURL(file) — só vale enquanto o app está aberto */
  url: string;
}

export interface OtherItem {
  id: string;
  type: OtherItemType;
  /** null = viagem toda; senão TripDestination.id */
  destinationId: string | null;
  /** nome do passeio, do evento, do plano de chip ou título livre (em Seguro, o nome do plano) */
  title: string;
  /** seguradora, agência, operadora ou fornecedor */
  provider: string;
  /** nº da apólice, código da reserva, localizador */
  referenceCode: string;
  /** período (seguro, chip) ou dia do passeio/evento (só startDate) — ISO yyyy-mm-dd */
  startDate: string | null;
  endDate: string | null;
  /** "hh:mm" ou "" — passeio e ingresso */
  time: string;
  /** ponto de encontro (passeio) ou local (ingresso) */
  location: string;
  /** telefone da central 24h — só seguro */
  emergencyPhone: string;
  notes: string;
  /** nunca exibido no card, só guardado pra Fase 4 (Custos) */
  costAmount: string;
  costCurrencyCode: string;
  attachments: Attachment[];
}
```
Um tipo "achatado" (todos os campos sempre existem, o form só mostra os do tipo escolhido). Assim, trocar de tipo no meio do preenchimento não perde nada do que já foi digitado.

No `TripState`: `otherItems: OtherItem[];`. No `TripContextValue`: `saveOtherItem(item)` e `removeOtherItem(id)`, com a mesma implementação de `saveStayItem`/`removeStayItem`. `setOtherItems([])` no `resetTrip()` e `otherItems` no array de dependências do `useMemo`.

**Liberar memória**: no `removeOtherItem` e no `resetTrip`, chamar `URL.revokeObjectURL(a.url)` para cada anexo dos itens que estão saindo.

---

## 2. Resumo do card: `src/utils/otherSummary.ts` (novo)

```ts
import type { OtherItem, OtherItemType, TripDestination } from '../context/TripContext';
import { formatISOToDisplay } from './dateMask';

const TYPE_LABELS: Record<OtherItemType, string> = {
  seguro: 'Seguro viagem',
  passeio: 'Passeio ou excursão',
  ingresso: 'Ingresso ou evento',
  chip: 'Chip ou internet',
  outro: 'Outro',
};

const TYPE_ICONS: Record<OtherItemType, string> = {
  seguro: '🛡️',
  passeio: '🎟️',
  ingresso: '🎫',
  chip: '📶',
  outro: '📋',
};

export const OTHER_TYPES: OtherItemType[] = ['seguro', 'passeio', 'ingresso', 'chip', 'outro'];

export function otherTypeLabel(type: OtherItemType): string {
  return TYPE_LABELS[type];
}

export function otherTypeIcon(type: OtherItemType): string {
  return TYPE_ICONS[type];
}

export function otherItemTitle(item: OtherItem): string {
  if (item.type === 'seguro') return item.provider.trim() || item.title.trim() || TYPE_LABELS.seguro;
  return item.title.trim() || item.provider.trim() || TYPE_LABELS[item.type];
}

export function otherItemScope(item: OtherItem, destinations: TripDestination[]): string {
  if (!item.destinationId) return 'Viagem toda';
  const d = destinations.find((x) => x.id === item.destinationId);
  return d ? d.city : 'Viagem toda';
}

/** Uma informação por linha (critério do ajustes-48). Nunca inclui custo. */
export function otherItemDetailRows(item: OtherItem): string[] {
  const rows: string[] = [];
  const period =
    item.startDate && item.endDate && item.endDate !== item.startDate
      ? `${formatISOToDisplay(item.startDate)} → ${formatISOToDisplay(item.endDate)}`
      : item.startDate
        ? formatISOToDisplay(item.startDate)
        : '';
  const when = [period, item.time].filter(Boolean).join(' · ');

  switch (item.type) {
    case 'seguro':
      if (item.title) rows.push(item.title);
      if (when) rows.push(`Vigência: ${when}`);
      if (item.referenceCode) rows.push(`Apólice ${item.referenceCode}`);
      if (item.emergencyPhone) rows.push(`Central 24h: ${item.emergencyPhone}`);
      break;
    case 'passeio':
    case 'ingresso':
      if (item.provider && item.type === 'passeio') rows.push(item.provider);
      if (when) rows.push(when);
      if (item.location) rows.push(item.type === 'passeio' ? `Encontro: ${item.location}` : item.location);
      if (item.referenceCode) rows.push(`Código ${item.referenceCode}`);
      break;
    case 'chip':
      if (item.provider) rows.push(item.provider);
      if (when) rows.push(`Validade: ${when}`);
      break;
    case 'outro':
      if (item.provider) rows.push(item.provider);
      if (when) rows.push(when);
      if (item.referenceCode) rows.push(`Código ${item.referenceCode}`);
      break;
  }
  if (item.notes) rows.push(item.notes);
  return rows.length ? rows : ['Detalhes a preencher'];
}
```

---

## 3. Anexos: `src/components/central/AttachmentList.tsx` (novo)

Componente próprio, porque a regra é outra (vários arquivos, sem preencher campos). **Visual reaproveitado do `VoucherUpload.module.css`**: mesmo botão pill "Enviar voucher" e mesma linha-card de arquivo anexado (`.voucherButton`, `.voucherAttached`, `.voucherFileIcon`, `.voucherFileName`, `.voucherFileActions`, `.voucherIconButton`, `.voucherIconButtonDanger`, `.hiddenFileInput`, `.voucherHint`, `.voucherUploadRow`). Importar esse CSS direto, sem duplicar.

```tsx
import { useRef, type ChangeEvent } from 'react';
import { UploadIcon, TrashIcon } from '../shell/Icons';
import type { Attachment } from '../../context/TripContext';
import styles from './VoucherUpload.module.css';
import listStyles from './AttachmentList.module.css';

interface AttachmentListProps {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}

export function AttachmentList({ attachments, onChange }: AttachmentListProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const added = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      url: URL.createObjectURL(file),
    }));
    onChange([...attachments, ...added]);
  }

  function handleRemove(att: Attachment) {
    URL.revokeObjectURL(att.url);
    onChange(attachments.filter((a) => a.id !== att.id));
  }

  return (
    <div className={listStyles.wrap}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/*"
        className={styles.hiddenFileInput}
        onChange={handleFiles}
      />
      <div className={styles.voucherUploadRow}>
        <span className={styles.voucherHint}>
          {attachments.length === 0
            ? 'Anexe a apólice, o ingresso ou qualquer comprovante (PDF ou foto).'
            : `${attachments.length} ${attachments.length === 1 ? 'arquivo anexado' : 'arquivos anexados'}`}
        </span>
        <button type="button" className={styles.voucherButton} onClick={() => inputRef.current?.click()}>
          <UploadIcon />
          {attachments.length === 0 ? 'Anexar arquivos' : 'Anexar mais'}
        </button>
      </div>

      {attachments.length > 0 && (
        <ul className={listStyles.list}>
          {attachments.map((att) => (
            <li key={att.id} className={styles.voucherAttached}>
              <span className={styles.voucherFileIcon} aria-hidden="true">📎</span>
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className={`${styles.voucherFileName} ${listStyles.fileLink}`}
                title={`Abrir ${att.fileName}`}
              >
                {att.fileName}
              </a>
              <div className={styles.voucherFileActions}>
                <button
                  type="button"
                  className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger}`}
                  onClick={() => handleRemove(att)}
                  aria-label={`Excluir ${att.fileName}`}
                  title="Excluir arquivo"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```
**`AttachmentList.module.css`**:
```css
.wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fileLink {
  text-decoration: underline;
  text-underline-offset: 2px;
}
```
Obs.: `.voucherIconButton` tem 32px. O `CLAUDE.md` pede alvo de toque de 44px; se o `VoucherUpload` já foi ajustado pra isso, aqui herda. Se não, aumentar a área clicável só aqui (`min-width/min-height: 44px` num seletor local), sem mexer no Transporte/Estadia.

**Cuidado com a remoção no formulário**: se a pessoa edita um registro e exclui um anexo, a URL é revogada na hora. Isso está certo porque não existe "Cancelar" que precisaria desfazer a exclusão.

---

## 4. Componentes da aba em `src/components/central/`

| Existe (Estadia) | Novo (Outros) |
|---|---|
| `StaySection` + `StayDestinationGroup` | `OtherSection` (lista única) |
| `StayItemCard` | `OtherItemCard` |
| `StayItemForm` | `OtherItemForm` |

### 4.1 `OtherSection.tsx`
- Se não tem destino cadastrado: o mesmo `EmptyTripState` das outras abas.
- Topo: parágrafo curto (14px, `var(--muted)`): `Seguro viagem, passeios, ingressos, chip de internet e outros comprovantes da viagem.`
- Lista de itens em ordem: primeiro os de "Viagem toda", depois por ordem dos destinos, e dentro de cada grupo na ordem em que foram criados. **Sem cabeçalho de grupo**: o escopo aparece em cada card.
- Mesmo mecanismo de `editingId` do `StayDestinationGroup`: começa em `'new'` quando não tem nenhum item; `+ Adicionar registro` (Button secondary) quando `editingId === null`.
- Gap entre cards: `var(--space-3)` (item→item). Reaproveitar `TransportDestinationGroup.module.css` (`.group`) pro container.

### 4.2 `OtherItemCard.tsx`
Mesmo visual do `TransportItemCard` (**reaproveitar `TransportItemCard.module.css`**):
- Header: ícone do tipo + título (`otherItemTitle`) + `Editar`.
- Linha logo abaixo do título (12px, `var(--muted)`): `{otherTypeLabel(type)} · {otherItemScope(item, trip.destinations)}` (ex.: `Seguro viagem · Viagem toda`, `Passeio ou excursão · San Pedro de Atacama`). Pode reaproveitar `.titleWrap`/`.typeLabel` do `StayItemCard.module.css`.
- Linhas de `otherItemDetailRows`.
- Anexos: em vez do "📎 Voucher anexado" genérico, listar os nomes como links que abrem o arquivo (`<a href={att.url} target="_blank" rel="noreferrer">`), 12px, cada um numa linha com 📎, com reticências se o nome for grande. Assim dá pra abrir a apólice direto do card, sem entrar em Editar.
- **Seguro com telefone**: o telefone da central 24h vira link `tel:` (`<a href={\`tel:${phone.replace(/[^\d+]/g, '')}\`}>`). Faz sentido no celular, na hora da emergência.

### 4.3 `OtherItemForm.tsx`
**Reaproveitar `TransportItemForm.module.css`** (`.form`, `.costRow`, `.actions`, `.removeButton`) e o `.timeRow` do `StayItemForm.module.css` se precisar de campos lado a lado.

Props:
```ts
interface OtherItemFormProps {
  destinations: TripDestination[];
  initialItem: OtherItem | null;
  onSave: (item: OtherItem) => void;
  /** só quando está editando */
  onRemove?: () => void;
}
```

Ordem dos elementos:
1. **"O que é esse registro?"**: `OptionChipGroup` com os 5 tipos (`${otherTypeIcon(t)} ${otherTypeLabel(t)}`). **Começa sem nada selecionado** (`null`) quando é um registro novo: a pessoa escolhe o tipo antes de ver os campos. É o pedido dela ("o usuário escolhe o que é aquele registro"). Enquanto `type === null`, mostrar só essa pergunta + o bloco de anexos (dá pra anexar primeiro e classificar depois).
   - `OptionChipGroup` hoje recebe `value: T | null`, então já aceita `null`.
   - Com 5 opções, os chips quebram em mais de uma linha; tudo bem, é o mesmo componente do Quiz.
2. **Anexos**: `<AttachmentList attachments={attachments} onChange={setAttachments} />`. Sempre visível, logo depois do tipo (mesma posição do voucher em Transporte/Estadia: no topo).
3. **"Vale para"**: `OptionChipGroup` com `Viagem toda` + um chip por destino (`d.city`). Valor `'viagem'` ↔ `destinationId = null`. Padrão: `Viagem toda` pra seguro/chip/outro; **ao escolher Passeio ou Ingresso num registro novo**, se a viagem tem 1 destino só, já seleciona esse destino; se tem mais, deixa `Viagem toda` e a pessoa troca. (Só na primeira escolha de tipo; depois não mexe mais sozinho.)
4. Campos por tipo (todos `TextField` com `autoComplete="off"`):

| Campo | Seguro | Passeio | Ingresso | Chip | Outro |
|---|---|---|---|---|---|
| `provider` | **Seguradora** | Agência / empresa (opcional) | — | **Operadora** | Fornecedor (opcional) |
| `title` | Plano (opcional), placeholder `Ex.: Mundo, cobertura USD 60 mil` | **Nome do passeio**, placeholder `Ex.: Valle de la Luna` | **Evento ou atração**, placeholder `Ex.: Show, museu, jogo` | Plano (opcional), placeholder `Ex.: eSIM 10 GB` | **Título**, placeholder `Ex.: Reserva de restaurante` |
| datas | `DateRangeField` **"Vigência"** | `DateRangeField` **"Data"** * | `DateRangeField` **"Data"** * | `DateRangeField` **"Validade"** | `DateRangeField` **"Data ou período"** |
| `time` | — | Horário de saída | Horário | — | — |
| `location` | — | Ponto de encontro | Local | — | — |
| `referenceCode` | Nº da apólice | Código da reserva (opcional) | Código do ingresso (opcional) | — | Código / localizador (opcional) |
| `emergencyPhone` | **Telefone da central 24h**, `inputMode="tel"`, placeholder `Ex.: +55 11 0000-0000` | — | — | — | — |
| `notes` | Observações (opcional) | Observações (opcional), placeholder `Ex.: levar casaco` | Observações (opcional) | Observações (opcional) | Observações (opcional) |

   Em negrito o campo principal de cada tipo. Nenhum campo é obrigatório (igual Transporte/Estadia).

   \* **Passeio e ingresso são de um dia só.** O `DateRangeField` é de intervalo; aqui usar ele mesmo assim, com `required={false}`, e aceitar que a pessoa selecione só o início (o componente já propaga o início sozinho, ver o comentário em `handleInputChange`). No resumo, `endDate` vazio ou igual ao início mostra só uma data (a função `otherItemDetailRows` já trata). Não criar um componente de data única novo nesta fase. Se no teste confundir, vira ajuste à parte.

   - `DateRangeField` com `key` que muda quando o tipo muda (`key={type ?? 'none'}`), pra ele trocar o label sem carregar estado velho do calendário.
   - Datas iniciais em registro novo: se "Vale para" é um destino, iniciar com as datas daquele destino **só pra Seguro e Chip**; Passeio/Ingresso começam vazios (é um dia específico, não o trecho inteiro). Viagem toda: seguro/chip iniciam do `dateStart` do primeiro destino ao `dateEnd` do último (quando existirem).
   - Horário: mesmo `maskTime` do `StayItemForm` (mover o helper para `src/utils/dateMask.ts` como `maskTime` exportado e usar nos dois forms).
5. `.costRow`: "Custo (opcional)" + `CurrencySelect` "Moeda do custo", inicia em `'BRL'`.
6. Ações: `Salvar registro` (Button fullWidth, **desabilitado enquanto `type === null`**) e, só editando, o link `Remover registro` alinhado à esquerda (mesma classe do `ajustes-52`). **Sem "Cancelar".**

Salvar: `id = initialItem?.id ?? \`other-${Date.now()}-${Math.random().toString(36).slice(2, 7)}\``, monta o `OtherItem` completo com todos os campos (inclusive os que o tipo atual não mostra).

---

## 5. Ligar a aba: `src/screens/Central.tsx`

- Importar `OtherSection` e renderizar quando `tab === 'outros'`.
- Com isso as 3 abas estão construídas: **remover o objeto `PANELS`**, o placeholder e, se ficar sem uso, o `Central.module.css` (conferir antes com grep).

---

## 6. Fechamento

- `CLAUDE.md`: no item da Central, registrar a aba Outros (ajustes-53): 5 tipos escolhidos pela pessoa, "Vale para" viagem toda ou destino, anexos múltiplos que abrem o arquivo (válidos só na sessão), telefone do seguro clicável. Registrar também o `maskTime` em `dateMask.ts`.
- `npm run lint` e `npm run build` passando.
- Acessibilidade: o input de arquivo é acionado por botão real (teclado ok); links dos anexos com `title`; botão de excluir com `aria-label` com o nome do arquivo; chips de tipo navegáveis por seta (já é do `OptionChipGroup`).

## 7. Como testar

1. Central → aba **Outros**: aparece o texto de introdução e o formulário aberto só com "O que é esse registro?" + anexos. "Salvar registro" desabilitado.
2. Anexar `seguro-viagem-exemplo.pdf` **antes** de escolher o tipo → aparece na lista de anexos; nenhum campo é preenchido (não é voucher).
3. Escolher 🛡️ Seguro viagem → aparecem Seguradora, Plano, Vigência (já com 20/11–25/11 se os destinos têm datas), Nº da apólice, Telefone da central 24h. Preencher e salvar.
4. Card: `🛡️ {seguradora}` / `Seguro viagem · Viagem toda` / Vigência / Apólice / Central 24h (tocar abre o discador no celular) / 📎 nome do PDF. Tocar no nome do PDF → abre o arquivo numa aba nova.
5. "+ Adicionar registro" → 🎟️ Passeio → Vale para: San Pedro de Atacama → Nome "Valle de la Luna", data 24/11 (só um dia), horário `1530` → `15:30`, ponto de encontro. Anexar `ingresso-passeio-valle-de-la-luna-exemplo.pdf` e mais uma foto qualquer → 2 anexos. Salvar → card com `24/11/2026 · 15:30`, "Encontro: …", 2 arquivos.
6. Ordem: o seguro (Viagem toda) aparece antes do passeio (San Pedro).
7. Editar o passeio → excluir um anexo → salvar → card com 1 arquivo. Não tem "Cancelar"; tem "Remover registro".
8. Trocar o tipo de um registro em edição (Passeio → Outro) e voltar → o que foi digitado continua lá.
9. 📋 Outro com título "Reserva no Don Julio", Vale para Buenos Aires → salva normal.
10. Início → Nova viagem → Central → Outros vazio de novo.
11. Abas Transporte e Estadia continuam funcionando igual.
