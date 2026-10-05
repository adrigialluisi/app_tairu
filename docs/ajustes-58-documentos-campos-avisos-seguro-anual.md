# Ajuste 58 — Meus documentos: mais campos, "Me avisar" com aviso na Início, vacina com validade e Seguro anual

Pedido da Adriana (02/out/2026): ao subir passaporte e afins, preencher **campos básicos e não só a foto**, principalmente **validade do passaporte e dos vistos**, com **notificação** pra avisar. Vacinas também. Seguro anual/do cartão vai pra Documentos (seguro de uma viagem específica continua na Central → Outros, decidido junto com o `ajustes-57`).

Depende de: `ajustes-54` (tela Meus documentos) aplicado.

O que já existe e **não muda**: escolha do tipo por chips, anexos múltiplos (`AttachmentList`), número mascarado com Mostrar/Ocultar, selos Vencido / Vence antes do fim da viagem, documentos fora do `TripContext` (Nova viagem não apaga). Regra mantida: **o app só compara datas, nunca afirma regra de país** ("o Chile exige 6 meses" etc.).

Sobre a "notificação": o protótipo não manda push. A representação dela é um **bloco de avisos na tela Início** (seção 5), que é o lugar onde a pessoa cai ao abrir o app. No teste, o moderador pode dizer "imagine que isso chegou como notificação no celular".

---

## 1. Modelo: `src/context/DocumentsContext.tsx`

```ts
export type PersonalDocType =
  | 'passaporte' | 'rg' | 'cnh' | 'pid' | 'visto' | 'vacina' | 'seguro-anual' | 'outro';

export type ReminderLead = '6m' | '3m' | '1m' | 'off';

export interface PersonalDocument {
  // …campos atuais (id, type, title, holderName, number, issuer, issueDate, expiryDate, notes, attachments)…
  /** passaporte: nome completo exatamente como impresso (tem que bater com a passagem) */
  fullName: string;
  /** visto: '' (não informado) | 'unica' | 'multipla' */
  visaEntries: '' | 'unica' | 'multipla';
  /** visto: permanência máxima por entrada, em dias (texto numérico) */
  maxStayDays: string;
  /** vacina: "1ª dose", "reforço", "dose única"… */
  vaccineDose: string;
  /** seguro anual: telefone da central 24h */
  emergencyPhone: string;
  /** com quanto tempo de antecedência avisar antes da validade; padrão '6m' */
  remindBefore: ReminderLead;
}
```
Tipo "achatado", igual `OtherItem`: todos os campos sempre existem, o form só mostra os do tipo escolhido.

## 2. Resumo e validade: `src/utils/documentSummary.ts`

- Tipo novo nos 3 `Record`: `TYPE_LABELS['seguro-anual'] = 'Seguro viagem anual'`, `TYPE_SHORT['seguro-anual'] = 'Seguro anual'`, `TYPE_ICONS['seguro-anual'] = '🛡️'`.
- `DOC_TYPES` (também é a ordem de exibição): `['passaporte', 'visto', 'vacina', 'seguro-anual', 'rg', 'cnh', 'pid', 'outro']` — o que mais importa pra viagem internacional vem primeiro.
- `documentTitle`: incluir `'seguro-anual'` na lista dos que usam `title` quando preenchido.
- `expiryStatus`: o limite do `'soon'` passa a vir de `doc.remindBefore` (6, 3 ou 1 mês). Com `'off'`, nunca retorna `'soon'`. **`'expired'` e `'before-trip-end'` continuam sempre ativos**, independente do lembrete (são críticos). Assinatura: o parâmetro `doc` continua `PersonalDocument`; no preview do form passar `{ expiryDate, remindBefore } as PersonalDocument`.
- `expiryStatusLabel`: o texto de `'soon'` acompanha o lembrete: "Vence em menos de 6 meses" / "…de 3 meses" / "Vence em menos de 1 mês". Pra isso, `'soon'` passa a carregar o lead: `{ kind: 'soon'; months: 6 | 3 | 1 }`.
- Novos helpers:
  ```ts
  /** expired | before-trip-end | soon → precisa de atenção (alimenta a Início) */
  export function needsAttention(doc: PersonalDocument, tripEndISO: string | null): boolean;
  /** "Passaporte vence antes do fim da viagem" — título do documento + texto do selo em minúsculas */
  export function attentionText(doc: PersonalDocument, status: ExpiryStatus): string;
  ```

## 3. Formulário: `src/components/documents/DocumentForm.tsx`

`DocFieldConfig` ganha: `showFullName`, `showVisaDetails`, `showDose`, `showEmergencyPhone`, `issueLabel?`, `expiryLabel?` (padrão "Emissão"/"Validade"). `dateMode` muda pra `'both' | 'issue-only' | 'vaccine'`, onde `'vaccine'` agora mostra **duas** datas lado a lado (ver abaixo).

Campos por tipo, **nesta ordem** (só os novos/alterados estão detalhados):

**🛂 Passaporte**
1. **"Nome completo (como está no passaporte)"** — novo, `autoCapitalize="characters"`, placeholder "Ex.: MARIA DA SILVA SOUZA"
2. Número do passaporte · 3. País emissor (já vem "Brasil") · 4. Emissão / Validade
5. **"Me avisar antes do vencimento"** (seção 3.1)
- hint do anexo continua "Anexe a página com sua foto e seus dados."

**📑 Visto**
1. Qual visto (opcional) · 2. Número (opcional) · 3. País do visto
4. **"Entradas"** — novo, `OptionChipGroup` de seleção única, opcional: "Única" / "Múltiplas" (tocar de novo desmarca, se o componente já suportar; senão, sem opção de limpar, tudo bem)
5. **"Permanência máxima (opcional)"** — novo, `inputMode="numeric"`, só dígitos, sufixo visual "dias" ou placeholder "Ex.: 90 dias"
6. Emissão / Validade · 7. **Me avisar**

**💉 Certificado de vacina**
1. Qual vacina (opcional)
2. **"Dose (opcional)"** — novo, placeholder "Ex.: 1ª dose, reforço, dose única"
3. **"Data da vacina" + "Válida até (opcional)"** lado a lado (mesmo `timeRow` do modo `'both'`). Abaixo, hint curto: "Preencha a validade só se o certificado tiver uma."
4. **Me avisar** — só aparece quando "Válida até" estiver preenchida.

**🛡️ Seguro anual** (tipo novo)
1. **"Seguradora"** (`issuer`)
2. **"Plano ou cartão (opcional)"** (`title`) — placeholder "Ex.: Seguro do cartão Visa Infinite"
3. **"Nº da apólice (opcional)"** (`number`)
4. **"Início da vigência" / "Fim da vigência"** (`issueDate` / `expiryDate`, via `issueLabel`/`expiryLabel`)
5. **"Telefone da central 24h (opcional)"** (`emergencyPhone`, `inputMode="tel"`)
6. **Me avisar**
- hint do anexo: "Anexe a apólice ou o bilhete do seguro."

**RG, CNH, PID, Outro**: sem mudança de campos; CNH, PID e Outro ganham o **Me avisar** (têm validade).

**Rótulo do "Nome no documento"** (todos os tipos): passa a ser **"De quem é (opcional)"**, hint "Deixe em branco se for seu. Ex.: filho, mãe." — evita confusão com o "Nome completo" novo do passaporte.

### 3.1 "Me avisar antes do vencimento"

`OptionChipGroup` de seleção única, logo abaixo das datas, valor inicial `initialDoc?.remindBefore ?? '6m'`:
`6 meses antes` · `3 meses antes` · `1 mês antes` · `Não avisar`.
Só aparece quando o tipo tem validade (passaporte, visto, CNH, PID, outro, seguro anual; vacina só com "Válida até" preenchida). Abaixo, hint 13px `--muted`: "O aviso aparece na tela Início." O preview do selo (que já existe no form) passa a respeitar a escolha.

`handleSave` inclui todos os campos novos. Estados iniciam de `initialDoc` ou vazios (`visaEntries: ''`, `remindBefore: '6m'`).

## 4. Card: `src/components/documents/DocumentCard.tsx`

Linhas novas em `detailRows`, só quando preenchidas:
- Passaporte: `fullName` em linha própria, antes do número (não mascarar: não é dado sensível como o número, e ajuda a conferir a grafia).
- Visto: `"Entradas múltiplas · até 90 dias"` (montar com o que tiver: "Entrada única", "Entradas múltiplas", "até N dias").
- Vacina: `vaccineDose`; e a data: "Vacinada em dd/mm/aaaa" + ", válida até dd/mm/aaaa" quando houver.
- Seguro anual: "Vigência: dd/mm/aaaa – dd/mm/aaaa" no lugar de "Validade: …"; telefone como link `tel:` clicável (mesmo padrão do `OtherItemCard` do seguro da Central, alvo ≥ 44px).
- Quando `remindBefore === 'off'` e o doc tem validade, uma linha discreta "Sem aviso de vencimento".

## 5. Avisos na Início: `src/screens/Home.tsx` (+ `Home.module.css`)

Novo bloco **entre a saudação e o `TripHeroCard`**, só renderizado se houver pelo menos 1 documento com `needsAttention`:

- Título de seção pequeno: "Avisos" (`h2`, mesmo estilo de `sectionTitle`).
- Uma linha por documento (no máximo 3; se houver mais, uma 4ª linha "Ver todos os avisos (N)" que leva pra `/documentos`), ordenadas: vencido → vence antes do fim da viagem → vence em breve.
- Cada linha é um `<button>` com: ícone 🔔, texto principal `attentionText(doc, status)` (ex.: "Passaporte vence antes do fim da viagem"), linha secundária "Validade: dd/mm/aaaa" (ou "Vigência até…" no seguro anual) e `›`. Se o doc tiver `holderName`, acrescentar " · {holderName}" na secundária.
- Visual de notificação: fundo `--surface`, borda esquerda de 4px na cor `--error` (vencido/antes do fim da viagem) ou `--accent` (em breve), raio e sombra dos tokens já usados nos cards da Início. Altura mínima 44px, foco visível.
- Toque → `navigate('/documentos', { state: { openDocId: doc.id } })`.

A contagem "⚠ N precisa(m) de atenção" na linha "Meus documentos" continua, agora usando `needsAttention` (inclui também os "em breve" que respeitam o lembrete), pra bater com o bloco de avisos.

## 6. Abrir o documento certo: `src/screens/Documents.tsx`

Ler `useLocation().state?.openDocId`. Se existir e o doc existir, iniciar `editingId` com ele (abre direto o formulário daquele documento, pra pessoa atualizar a validade) e rolar até ele (`scrollIntoView({ block: 'start' })` num `useEffect` com `ref` do item). Senão, mantém o comportamento atual.

## 7. Conferir

- [ ] Passaporte: Nome completo, número, país, emissão/validade e "Me avisar" (6 meses marcado por padrão).
- [ ] Visto: entradas (Única/Múltiplas) e permanência máxima aparecem no card: "Entradas múltiplas · até 90 dias".
- [ ] Vacina com e sem "Válida até": o "Me avisar" só aparece com validade preenchida.
- [ ] Seguro anual: vigência no card, telefone clicável, selo "Vence antes do fim da viagem" se o fim da vigência cair antes da última data dos destinos cadastrados.
- [ ] Passaporte com validade 15/12/2026 e viagem terminando depois disso → aviso vermelho na Início; tocar abre o formulário desse passaporte.
- [ ] Mesmo passaporte com validade 3 meses à frente e lembrete "1 mês antes" → nenhum aviso; trocar pra "6 meses antes" → aviso aparece.
- [ ] "Não avisar" some com o "em breve", mas vencido continua aparecendo.
- [ ] Nova viagem não apaga documentos nem avisos de vencido.
- [ ] `npm run lint` e `npm run build` sem erro.
