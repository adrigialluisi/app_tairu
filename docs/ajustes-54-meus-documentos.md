# Ajuste 54 — Tela Meus documentos: passaporte, RG, CNH, permissão internacional e outros, com upload de arquivos

Pedido da Adriana (24/set/2026): a tela **Meus documentos** (acessada pela Início, hoje placeholder "em construção" desde o `ajustes-26`) precisa ter recurso pra **subir passaporte, carta de motorista, CNH, RG** e documentos desse tipo.

**Depende do `ajustes-53` já aplicado** (reaproveita o `AttachmentList` e o padrão de formulário da aba Outros).

Decisões de desenho:
- **Documentos são da pessoa, não da viagem.** Já era a premissa do `ajustes-26` (por isso Documentos saiu do menu fixo e ficou na Início). Na prática: **"Nova viagem" (`resetTrip`) não apaga os documentos.** Por isso eles ficam num contexto próprio, fora do `TripContext`.
- **A pessoa escolhe o tipo**, igual a aba Outros. Tipos: 🛂 Passaporte, 🪪 RG, 🚗 CNH, 🌎 Permissão Internacional para Dirigir (PID, a "carta de motorista internacional"), 📑 Visto, 💉 Certificado de vacina, 📄 Outro.
- **Vários arquivos por documento**: frente e verso do RG/CNH, página de dados do passaporte etc. Mesmo `AttachmentList` da aba Outros (tocar no nome abre o arquivo; válido só enquanto o app está aberto).
- **Número mascarado no card** (`•••• 4821`) com botão "Mostrar", porque é dado sensível e a tela pode ser aberta na frente de outras pessoas.
- **Aviso de validade**, calculado de verdade a partir da data digitada: "Vencido", "Vence antes do fim da viagem" (se existe viagem com datas em andamento) ou "Vence em menos de 6 meses". **Sem afirmar regra de país** (ex.: "a Argentina exige X"): o app não tem essa base e não vamos inventar. O aviso só compara datas.
- **Campo "Nome no documento" (opcional)**: permite guardar documentos de filhos ou de outra pessoa da família sem criar um conceito novo de "membro".
- **Sem "Cancelar"** (padrão do `ajustes-52`).
- **Sem arquivos de exemplo**: diferente dos vouchers, não vamos gerar passaporte/RG/CNH falsos, nem de mentira pra teste. No teste de usabilidade, o participante anexa qualquer foto ou PDF (o app aceita qualquer arquivo e não lê o conteúdo).

---

## 1. Contexto próprio: `src/context/DocumentsContext.tsx` (novo)

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Attachment } from './TripContext';

export type PersonalDocType = 'passaporte' | 'rg' | 'cnh' | 'pid' | 'visto' | 'vacina' | 'outro';

export interface PersonalDocument {
  id: string;
  type: PersonalDocType;
  /** título livre — usado em "Outro" e opcional em Visto/Vacina (ex.: "Visto americano", "Febre amarela") */
  title: string;
  /** nome de quem é o documento; vazio = da própria pessoa */
  holderName: string;
  number: string;
  /** país emissor (passaporte, visto, PID) ou órgão/UF (RG, CNH) */
  issuer: string;
  /** "dd/mm/aaaa" ou "" */
  issueDate: string;
  /** "dd/mm/aaaa" ou "" */
  expiryDate: string;
  notes: string;
  attachments: Attachment[];
}

interface DocumentsContextValue {
  documents: PersonalDocument[];
  saveDocument: (doc: PersonalDocument) => void;
  removeDocument: (id: string) => void;
}

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<PersonalDocument[]>([]);

  const value = useMemo<DocumentsContextValue>(
    () => ({
      documents,
      saveDocument: (doc) =>
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === doc.id);
          return exists ? prev.map((d) => (d.id === doc.id ? doc : d)) : [...prev, doc];
        }),
      removeDocument: (id) =>
        setDocuments((prev) => {
          prev.find((d) => d.id === id)?.attachments.forEach((a) => URL.revokeObjectURL(a.url));
          return prev.filter((d) => d.id !== id);
        }),
    }),
    [documents],
  );

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocuments(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments precisa estar dentro de <DocumentsProvider>');
  return ctx;
}
```
Sem `reset`: de propósito, nada no app apaga os documentos além do botão "Remover documento". Datas em texto `dd/mm/aaaa` (e não ISO) porque são datas soltas, não intervalos; ver seção 3.

**`src/App.tsx`**: envolver com o provider **por fora** do `TripProvider`:
```tsx
<PlatformProvider>
  <DocumentsProvider>
    <TripProvider>
      …
    </TripProvider>
  </DocumentsProvider>
</PlatformProvider>
```
e trocar a rota `/documentos` de `<DocumentosComingSoon />` para `<Documents />` (tela nova, seção 4). Apagar a função `DocumentosComingSoon` e o comentário acima dela (o comentário sobre `onBack`/sem `bottomNav` passa pro topo de `Documents.tsx`).

---

## 2. Resumo e validade: `src/utils/documentSummary.ts` (novo)

```ts
import type { PersonalDocType, PersonalDocument } from '../context/DocumentsContext';

const TYPE_LABELS: Record<PersonalDocType, string> = {
  passaporte: 'Passaporte',
  rg: 'RG',
  cnh: 'CNH',
  pid: 'Permissão Internacional para Dirigir',
  visto: 'Visto',
  vacina: 'Certificado de vacina',
  outro: 'Outro',
};

const TYPE_SHORT: Record<PersonalDocType, string> = { ...TYPE_LABELS, pid: 'PID (carta internacional)' };

const TYPE_ICONS: Record<PersonalDocType, string> = {
  passaporte: '🛂',
  rg: '🪪',
  cnh: '🚗',
  pid: '🌎',
  visto: '📑',
  vacina: '💉',
  outro: '📄',
};

export const DOC_TYPES: PersonalDocType[] = ['passaporte', 'rg', 'cnh', 'pid', 'visto', 'vacina', 'outro'];

export const docTypeLabel = (t: PersonalDocType) => TYPE_LABELS[t];
export const docTypeShort = (t: PersonalDocType) => TYPE_SHORT[t];
export const docTypeIcon = (t: PersonalDocType) => TYPE_ICONS[t];

export function documentTitle(doc: PersonalDocument): string {
  if ((doc.type === 'outro' || doc.type === 'visto' || doc.type === 'vacina') && doc.title.trim()) {
    return doc.title.trim();
  }
  return TYPE_LABELS[doc.type];
}

/** "•••• 4821" — últimos 4 caracteres alfanuméricos; número curto mostra só os pontos. */
export function maskDocNumber(value: string): string {
  const clean = value.replace(/[^0-9a-zA-Z]/g, '');
  if (!clean) return '';
  return clean.length <= 4 ? '••••' : `•••• ${clean.slice(-4)}`;
}

/** "dd/mm/aaaa" → Date (meio-dia local, evita problema de fuso) ou null se incompleto/inválido. */
export function parseDisplayDate(value: string): Date | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12);
  return d.getMonth() === Number(mm) - 1 ? d : null;
}

export type ExpiryStatus =
  | { kind: 'none' }
  | { kind: 'ok' }
  | { kind: 'expired' }
  | { kind: 'before-trip-end' }
  | { kind: 'soon' };

/**
 * Só compara datas — não afirma regra de nenhum país.
 * tripEndISO: último dateEnd dos destinos da viagem atual, se existir.
 */
export function expiryStatus(doc: PersonalDocument, tripEndISO: string | null, today = new Date()): ExpiryStatus {
  const expiry = parseDisplayDate(doc.expiryDate);
  if (!expiry) return { kind: 'none' };
  if (expiry < today) return { kind: 'expired' };
  if (tripEndISO) {
    const [y, m, d] = tripEndISO.split('-').map(Number);
    if (expiry < new Date(y, m - 1, d, 12)) return { kind: 'before-trip-end' };
  }
  const sixMonths = new Date(today);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (expiry < sixMonths) return { kind: 'soon' };
  return { kind: 'ok' };
}

export function expiryStatusLabel(status: ExpiryStatus): string | null {
  switch (status.kind) {
    case 'expired':
      return 'Vencido';
    case 'before-trip-end':
      return 'Vence antes do fim da viagem';
    case 'soon':
      return 'Vence em menos de 6 meses';
    default:
      return null;
  }
}
```

---

## 3. Campo de data única com máscara: `src/utils/dateMask.ts`

Emissão e validade são datas soltas, e a validade costuma estar anos à frente (passaporte vale 10 anos). Navegar mês a mês num calendário até 2034 seria pior que digitar. Por isso aqui é **só digitação com máscara**, sem calendário. É uma diferença consciente em relação ao check-in/check-out (`ajustes-52`), que são datas próximas e em intervalo.

Adicionar em `dateMask.ts` (reaproveitando o `formatSingleDateDigits` que já existe lá):
```ts
/** Máscara de digitação dd/mm/aaaa pra campos de data única. */
export function maskSingleDate(value: string): string {
  return formatSingleDateDigits(digitsOnly(value).slice(0, 8));
}
```
Conferir se `formatSingleDateDigits` já formata parcial (ex.: `"0311"` → `"03/11"`). Se ela só formata data completa, fazer `maskSingleDate` montar o parcial: 2 dígitos → `dd`, 3–4 → `dd/mm`, 5–8 → `dd/mm/aaaa`.

Nos campos: `TextField` com `inputMode="numeric"`, `placeholder="dd/mm/aaaa"`, `onChange={(v) => setX(maskSingleDate(v))}`. Se a data completa não for válida (`parseDisplayDate` devolve `null` com 10 caracteres), mostrar o `error` do próprio `TextField`: "Data inválida". Não bloqueia o salvar.

---

## 4. Tela: `src/screens/Documents.tsx` (novo) + componentes em `src/components/documents/`

### 4.1 Tela `Documents.tsx`
- `ScreenShell` com `AppBar title="Meus documentos"` e `onBack={() => navigate('/inicio')}`, **sem `bottomNav`** (continua fora do menu fixo, como no `ajustes-26`).
- Intro (14px, `var(--muted)`): `Seus documentos ficam guardados aqui e valem pra todas as suas viagens.`
- Lista de cards (`DocumentCard`) na ordem de `DOC_TYPES` (passaporte primeiro), e dentro do mesmo tipo pela ordem de criação.
- Mesmo mecanismo de `editingId` da aba Outros: começa em `'new'` quando não tem documento; `+ Adicionar documento` (Button secondary) quando `editingId === null`.
- Gap: `var(--space-3)` entre cards; `var(--space-6)` entre a intro e a lista.
- Pra calcular "Vence antes do fim da viagem": `const trip = useTrip();` → `tripEndISO` = maior `dateEnd` entre `trip.destinations` (ou `null` se não tiver). Passar pro card.

### 4.2 `DocumentCard.tsx`
**Reaproveitar `TransportItemCard.module.css`** (`.card`, `.header`, `.icon`, `.title`, `.editButton`, `.detailRows`, `.detail`) e `.titleWrap`/`.typeLabel` do `StayItemCard.module.css`.
- Header: ícone do tipo + título (`documentTitle`) + `Editar`.
- Linha abaixo do título: `docTypeShort(type)`, e ` · {holderName}` quando preenchido (ex.: `Passaporte · Laura`).
- **Selo de validade** ao lado do título quando `expiryStatusLabel` não é `null`: pill pequena (11px, 700), `var(--error)` no texto e borda pra "Vencido" e "Vence antes do fim da viagem"; `var(--muted)` pra "Vence em menos de 6 meses". Com o ⚠ antes (`aria-hidden`) e o texto sempre visível (não depender só de cor).
- Linhas de detalhe:
  - Número: `Nº •••• 4821` + botão de texto `Mostrar` / `Ocultar` (estado local do card, 44px de alvo, `aria-pressed`). Mostrando: `Nº AB123456`.
  - `Emitido por {issuer}` quando preenchido.
  - `Validade: {expiryDate}` quando preenchida (e `Emissão: {issueDate}` só se não tiver validade, ex.: RG).
  - `notes`, se tiver.
- Anexos: mesma lista de links com 📎 da aba Outros (tocar abre o arquivo). Se não tem anexo: linha `Nenhum arquivo anexado` em `var(--muted)`.

### 4.3 `DocumentForm.tsx`
**Reaproveitar `TransportItemForm.module.css`** (`.form`, `.actions`, `.removeButton`) e o `.timeRow` do `StayItemForm.module.css` pros campos lado a lado.

Props: `initialDoc: PersonalDocument | null`, `onSave(doc)`, `onRemove?()`.

Ordem:
1. **"Qual documento?"**: `OptionChipGroup` com os 7 tipos (`${docTypeIcon(t)} ${docTypeShort(t)}`). Começa `null` em documento novo; os campos só aparecem depois da escolha (igual Outros).
2. **Arquivos**: `AttachmentList`. **Adicionar uma prop opcional `hint?: string`** no `AttachmentList` (default = o texto atual da aba Outros, pra não mudar nada lá). Aqui o hint muda por tipo:
   - RG, CNH: `Anexe foto da frente e do verso.`
   - Passaporte: `Anexe a página com sua foto e seus dados.`
   - demais: `Anexe uma foto ou PDF do documento.`
   - tipo ainda não escolhido: `Anexe uma foto ou PDF do documento.`
3. Campos por tipo (todos `TextField`, `autoComplete="off"`):

| Campo | Passaporte | RG | CNH | PID | Visto | Vacina | Outro |
|---|---|---|---|---|---|---|---|
| `title` | — | — | — | — | Qual visto (opcional), `Ex.: Visto americano B1/B2` | Qual vacina (opcional), `Ex.: Febre amarela` | **Nome do documento**, `Ex.: Carteira de estudante` |
| `number` | **Número do passaporte** | **Número do RG** | **Nº de registro da CNH** | Número (opcional) | Número do visto (opcional) | — | Número (opcional) |
| `issuer` | País emissor, **inicia "Brasil"** | Órgão emissor / UF, `Ex.: SSP-SP` | UF, `Ex.: SP` | País emissor, **inicia "Brasil"** | País do visto, `Ex.: Estados Unidos` | — | Emitido por (opcional) |
| `issueDate` + `expiryDate` (lado a lado, `.timeRow`) | Emissão + **Validade** | Só Emissão | Emissão + **Validade** | Emissão + **Validade** | Emissão + **Validade** | Data da dose (em `issueDate`, label "Data da vacina"), sem validade | Emissão + Validade (opcionais) |
| `holderName` | Nome no documento (opcional) — em todos, com hint `Deixe em branco se for seu.` |
| `notes` | Observações (opcional) — em todos |

   Nenhum campo obrigatório. Os valores iniciais "Brasil" só entram quando o campo está vazio no momento da escolha do tipo (não sobrescrevem o que a pessoa digitou).
   - Número: `autoCapitalize="characters"` no passaporte (tem letras, ex.: `AB123456`).
   - Mostrar o selo de validade (mesmo componente/estilo do card) logo abaixo dos campos de data, **ao vivo** enquanto digita, pra pessoa já ver "Vencido" antes de salvar.
4. Ações: `Salvar documento` (Button fullWidth, desabilitado com `type === null`) e, só editando, `Remover documento` à esquerda. **Sem "Cancelar".**

Salvar: `id = initialDoc?.id ?? \`doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}\``, com todos os campos (inclusive os que o tipo atual não mostra, pra não perder nada se ela trocar o tipo).

---

## 5. Início: resumo na linha "Meus documentos" (`src/screens/Home.tsx`)

A linha 📄 **Meus documentos ›** já existe (`ajustes-30`). Acrescentar um subtítulo (12px, `var(--muted)`, abaixo do rótulo) com o que tem guardado:
- sem documentos: `Passaporte, RG, CNH e outros`
- com documentos: `N documento(s)` e, se algum tiver selo de validade de alerta, ` · ⚠ 1 precisa de atenção` em `var(--error)`.

Usar `useDocuments()` + `expiryStatus` com o mesmo `tripEndISO` da tela.

---

## 6. Fechamento

- `CLAUDE.md`:
  - Na listagem de telas, item de Documentos: construído no ajustes-54. Contexto próprio (`DocumentsContext`), **não é apagado por Nova viagem**; tipos escolhidos pela pessoa; anexos múltiplos; número mascarado; aviso de validade só por comparação de datas (sem regra de país).
  - Princípio registrado: **nunca gerar documento pessoal falso (passaporte, RG, CNH) nem como exemplo de teste.**
- `npm run lint` e `npm run build` passando.
- Acessibilidade: botão Mostrar/Ocultar com `aria-pressed` e rótulo "Mostrar número do passaporte" etc.; selo de validade com texto (não só cor); contraste do `--error` sobre `--card` conferido.

## 7. Como testar

1. Início → linha "Meus documentos" mostra `Passaporte, RG, CNH e outros`. Tocar → tela com a intro e o formulário aberto em "Qual documento?".
2. Escolher 🛂 Passaporte → hint "Anexe a página com sua foto…", País emissor já "Brasil". Número `ab123456` → aparece em maiúsculas. Validade: digitar `10032031` → `10/03/2031` (sem selo). Anexar uma foto qualquer. Salvar.
3. Card: `🛂 Passaporte`, `Nº •••• 3456`, "Mostrar" revela `AB123456`, "Ocultar" esconde. 📎 abre a foto.
4. Adicionar 🪪 RG → só Emissão (sem validade). Anexar 2 arquivos (frente e verso). Salvar → card com 2 anexos.
5. Adicionar 🚗 CNH com validade `01/01/2025` → selo **Vencido** já aparece no formulário, antes de salvar, e no card.
6. Com uma viagem em andamento terminando em 25/11/2026, adicionar 🌎 PID com validade `20/11/2026` → selo **Vence antes do fim da viagem**.
7. Voltar pra Início → `4 documentos · ⚠ 2 precisam de atenção`.
8. Adicionar 🛂 Passaporte com "Nome no documento" = Laura → card `Passaporte · Laura`.
9. Início → **Nova viagem** → voltar em Meus documentos → **os documentos continuam lá**.
10. Editar um documento → "Remover documento" → some. Não tem "Cancelar".
11. Aba Outros da Central continua com o hint original do `AttachmentList` (a prop nova é opcional).
