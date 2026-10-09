# Ajuste 82 — Documento mais enxuto e tudo disponível offline por padrão

> **Pra quem vai aplicar (Claude Code no Antigravity):** arquivos principais: `src/components/documents/DocumentForm.tsx` (+ `.module.css`), `src/components/documents/DocumentCard.tsx`, `src/context/DocumentsContext.tsx`, `src/screens/Documents.tsx`, `src/hooks/useSaveToast.ts` / `SaveToast`, e os resumos salvos de Destinos, Central, Roteiro e Custos.

Pedido da Adriana (08/out/2026), vendo o formulário de passaporte em Meus documentos:
1. O campo **"De quem é (opcional)"** não faz sentido: o passaporte já tem o nome completo. **Tirar**, e nos documentos que não têm nome, **adicionar o campo de nome**.
2. **"Observações (opcional)"** também sai.
3. **Offline tem que ser o padrão**, não um interruptor. E não só documentos: depois de salvar documento, roteiro, reservas etc., **tudo aparece como disponível offline**.

## 1. Formulário de documento
- Remover os campos **"De quem é"** e **"Observações"** de **todos** os tipos (passaporte, visto, vacina, seguro anual etc.).
- Em `DocumentsContext`, `holderName` e `notes` saem do tipo (e de qualquer dado de exemplo/mock que os preencha).
- **Campo de nome em todos os tipos** (pedido da Adriana: "pra esses documentos que não tem nome, adiciona o campo de nome, e não 'De quem é'"). Hoje só o passaporte tem `fullName` (`cfg.showFullName`). Passar `showFullName: true` pra **todos** os tipos e trocar o rótulo fixo por um rótulo por tipo na config (`fullNameLabel`):
  - Passaporte: "Nome completo (como está no passaporte)" (como hoje)
  - Visto: "Nome completo (como está no visto)"
  - RG / CNH / documento de identidade (se existirem): "Nome completo (como está no documento)"
  - Vacina: "Nome de quem tomou a vacina"
  - Seguro anual: "Nome do titular do seguro"
  - Outro tipo, se houver: "Nome completo"
  Campo **obrigatório? Não**: continua opcional como no passaporte, sem "(opcional)" no rótulo pra não alongar; placeholder "Ex.: MARIA DA SILVA SOUZA" e `autoCapitalize="characters"` em todos. Posição: o mesmo lugar onde já fica no passaporte (logo depois dos anexos).
- Em `DocumentCard`, a linha que mostrava `· {holderName}` passa a mostrar `· {fullName}` (em todos os tipos, quando preenchido). Assim dá pra distinguir a vacina do filho da sua, sem o campo "De quem é".
- Remover o interruptor **"Disponível offline"** e o estado `availableOffline` do formulário.
- O grupo **"Acesso"** fica só com **"Compartilhar com o grupo de {viagem}"**. Sem viagem em andamento, o grupo inteiro some. Renomear a legenda pra **"Compartilhar"** e corrigir o alinhamento do print: o título fica **acima** da linha divisória, não ao lado (hoje a borda do `fieldset` cruza a `legend`). Usar `<fieldset>` sem borda + um `<Separator>` do shadcn antes, e `legend` como bloco com 16px semibold e `--space-3` embaixo.

## 2. Tudo salvo fica offline (simulado, só visual)
Regra única pro app: **o que a pessoa salvou fica disponível sem internet**. Não precisa ligar nada.

**Indicador padrão** (componente novo `OfflineBadge`, reaproveitável): ícone lucide `CloudCheck` (se não existir na versão instalada, `CircleCheck`) + texto "Disponível offline", 13px, cor `--text-muted`, ícone em `--success` (ou o verde do tema; conferir contraste ≥ 3:1 do ícone e ≥ 4.5:1 do texto). Nunca só ícone: o texto vai junto.

Onde aparece:
- **Toast de salvar** (`useSaveToast`): "Salvo ✓ · disponível offline" (em todo lugar que hoje mostra "Salvo ✓").
- **Meus documentos**: no rodapé de cada `DocumentCard`. A linha do topo da tela que contava "X documentos disponíveis sem internet" vira fixa: "Seus documentos ficam salvos no celular e abrem sem internet."
- **Destinos**: no resumo do Passo 1 e do Passo 2 depois de salvos.
- **Central**: no resumo de cada transporte, hospedagem e item de Outros salvo.
- **Roteiro**: uma linha embaixo das pílulas de data, junto com a linha do ajuste 80: "Roteiro disponível offline" (com o mapa: "O mapa precisa de internet; a lista funciona sem."). Isso é verdade no protótipo: o mapa e as fotos dependem de internet.
- **Custos**: no topo da lista de lançamentos.
- **Início**: no card da viagem atual, quando a viagem já tiver algo salvo: "Viagem disponível offline".

Não mostrar o selo em tela/estado vazio (nada salvo ainda = nada offline).

## 3. Regras de sempre
- Tokens e contraste conferidos; alvo de toque não muda (o selo não é clicável).
- Testar em 375px e 390px, iOS e Android.
- `npm run lint` e `npm run build` sem erro.
- `CLAUDE.md`: (a) documento sem "De quem é"/"Observações", com campo de nome em todos os tipos; (b) regra "tudo salvo fica offline", com o `OfflineBadge` como padrão; (c) no item de Documentos, tirar a menção ao interruptor de offline do ajuste 66.
- Roteiro de teste: o Claude (Cowork) atualiza o `Instrucoes/15-...md`.
- Commit: `ajuste 82: documento enxuto e tudo offline`.
