# Ajuste 66 — Meus documentos: compartilhar com o grupo da viagem e "Disponível offline"

Sexta parte faltante (02/out/2026). No fluxo proposto, a etapa 8 era **"Carteira de documentos compartilhada + offline"**. O ajuste 54/58 construiu Meus documentos como documentos **da pessoa**; faltaram as duas partes: **compartilhar com o grupo** e **abrir sem internet**.

Depende de: `ajustes-58` (Documentos) aplicado.

Regras:
- **Compartilhar é escolha por documento e começa desligado** (documento é dado sensível).
- Compartilhar vale **pra viagem atual**: o documento continua sendo da pessoa (fica em `DocumentsContext`), a viagem só guarda quais estão compartilhados. "Nova viagem" desliga os compartilhamentos, mas não apaga os documentos.
- **"Disponível offline" é simulado no protótipo** (tudo já está em memória). Mostrar como a funcionalidade se comportaria, sem fingir download real: o selo diz "Salvo no celular", sem barra de progresso falsa.

---

## 1. Modelo

`src/context/DocumentsContext.tsx` — em `PersonalDocument`:
```ts
/** simulado no protótipo: documento marcado pra abrir sem internet */
availableOffline: boolean; // padrão false
```

`src/context/TripContext.tsx`:
```ts
sharedDocumentIds: string[];          // PersonalDocument.id compartilhados com o grupo desta viagem
toggleSharedDocument(id: string): void;
```
Zerar `sharedDocumentIds` no `resetTrip()`. Ao remover um documento em Meus documentos, tirar o id da lista também.

## 2. No formulário e no card — `DocumentForm.tsx` / `DocumentCard.tsx`

No formulário, antes de "Salvar documento", um bloco **"Acesso"** com dois toggles (`role="switch"`, `aria-checked`, alvo de 44px):
- **"📥 Disponível offline"** — hint: "Fica salvo no celular pra abrir sem internet, no aeroporto ou na fronteira." (`availableOffline`)
- **"👥 Compartilhar com o grupo de {nome da viagem}"** — só aparece se existir viagem em andamento (nome ou destino). Hint: "Quem você convidou pra essa viagem vê este documento. O número continua escondido até tocar em Mostrar." Começa desligado. Sem convidados ainda, o toggle funciona e o hint acrescenta: "Ninguém foi convidado ainda."

No card, selos ao lado do tipo (pequenos, ícone + texto):
- `📥 Offline` quando `availableOffline`;
- `👥 Compartilhado` quando o id estiver em `sharedDocumentIds`.

No topo de Meus documentos, abaixo do texto de introdução, uma linha `--text-sm`/`--muted` quando houver algum offline: "{n} documentos disponíveis sem internet."

## 3. Onde o grupo vê — `src/screens/InviteCompanions.tsx` (Convidados)

Nova seção abaixo da lista de convites: **"📂 Documentos do grupo"**.
- Lista os documentos compartilhados (mesmo `DocumentCard` em modo só-leitura: sem "Editar", com "Mostrar" do número e anexos clicáveis), com a linha "De: Você" (ou o `holderName` se tiver).
- Texto `--text-sm`/`--muted` no topo da seção: "Documentos que cada pessoa escolheu compartilhar nesta viagem. Os dos convidados aparecem aqui quando eles entrarem." (Não simular documentos de convidados.)
- Sem nenhum compartilhado: "Nenhum documento compartilhado ainda." + link "Escolher em Meus documentos" (`/documentos`).
- `DocumentCard` ganha prop `readOnly?: boolean`.

## 4. `CLAUDE.md`
No item de Documentos: compartilhamento por documento com o grupo da viagem (desligado por padrão, guardado na viagem em `sharedDocumentIds`) e "Disponível offline" simulado (`docs/ajustes-66-documentos-compartilhados-offline.md`); a seção "Documentos do grupo" fica em Convidados.

## 5. Conferir
- [ ] Novo passaporte: toggles "Disponível offline" e "Compartilhar com o grupo" desligados.
- [ ] Ligar os dois → card com selos "📥 Offline" e "👥 Compartilhado"; contagem de offline no topo.
- [ ] Convidados → "Documentos do grupo" mostra o passaporte em modo só leitura, número mascarado.
- [ ] Remover o documento → some de Convidados também.
- [ ] Nova viagem → documento continua em Meus documentos, mas sem "Compartilhado".
- [ ] `npm run lint` e `npm run build` sem erro.
