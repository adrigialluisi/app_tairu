# Ajuste 84 — Todo voucher ou documento enviado preenche os campos sozinho; documento pessoal exige imagem

> **Pra quem vai aplicar (Claude Code no Antigravity):** arquivos: `src/data/mockVouchers.ts` (vira o lugar de toda "leitura" simulada), `src/components/central/TransportItemForm.tsx`, `StayItemForm.tsx`, `OtherItemForm.tsx`, `VoucherUpload.tsx`, `AttachmentList.tsx`, `src/components/documents/DocumentForm.tsx`, `DocumentCard.tsx`.

Pedido da Adriana (08/out/2026):
1. **Toda vez** que a pessoa sobe um voucher ou um documento, os campos têm que ser preenchidos automaticamente. Hoje só Transporte e Hospedagem fazem isso, e só com os arquivos de exemplo com o nome exato.
2. Em **documentos pessoais** (passaporte, vacina, RG, CNH, visto…) a pessoa **tem que subir a imagem** do documento.

Tudo continua **simulado**: não existe leitura de verdade (sem OCR, sem backend, sem IA). O app "lê" pelo nome do arquivo e, se não reconhecer, usa um preenchimento de exemplo.

## 1. Leitura simulada, em 2 níveis

Em `mockVouchers.ts`, uma função por formulário: `readTransportFile(file, destination)`, `readStayFile(file, destination)`, `readOtherFile(file, type, destinations)`, `readDocumentFile(file, docType)`. Cada uma devolve `{ fields, source: 'reconhecido' | 'exemplo' }`:

1. **Arquivo conhecido** (nome exato, sem diferenciar maiúsculas) → os dados daquele arquivo (tabela da seção 3).
2. **Qualquer outro arquivo** (ex.: uma foto do celular do participante) → **preenchimento de exemplo** coerente com o contexto:
   - Transporte: o voucher de exemplo cuja origem é a cidade do destino em que a pessoa está (Buenos Aires → voo BA→Santiago; Santiago → voo Santiago→Calama; San Pedro → transfer). Cidade fora do cenário → voo genérico "Companhia aérea (exemplo)", código "EX-0000", datas = início do destino.
   - Hospedagem: o hotel de exemplo do destino; fora do cenário → "Hotel (exemplo)", check-in/out = datas do destino.
   - Outros e Documentos: os dados de exemplo do tipo (tabela da seção 3).

**Nunca deixar de preencher.** O antigo estado "não reconhecido" (`recognized === false`) deixa de existir.

**Feedback igual em todos os formulários** (reaproveitar o do `VoucherUpload`):
- Ao escolher o arquivo: ~1,2 s de "Lendo o documento…" (ícone `ScanText` + spinner, `aria-live="polite"`), com os campos desabilitados. Respeitar `prefers-reduced-motion` (sem spinner, só o texto).
- Depois: faixa `Alert` do shadcn com `Check`: **"Preenchemos os campos com o que lemos do arquivo. Confira antes de salvar."** — o mesmo texto pros dois níveis (o participante não precisa saber a diferença; o moderador sabe pelo roteiro).
- Campos que vieram preenchidos ganham por 3 s um fundo `--accent-soft` suave (transição de 300 ms; sem animação com reduced-motion), pra mostrar o que mudou.
- A pessoa pode editar qualquer campo depois. Trocar o arquivo lê de novo e sobrescreve.

## 2. Onde entra o upload
- **Transporte e Hospedagem:** como hoje (`VoucherUpload` no topo do formulário).
- **Outros (Seguro, Passeio, Ingresso):** hoje só tem `AttachmentList` no fim. Colocar o `VoucherUpload` **no topo**, depois da escolha do tipo, com o texto "Tem o ingresso, o voucher ou a apólice? Envie pra preencher os campos." O arquivo enviado também entra na lista de anexos.
- **Documentos pessoais:**
  - Depois de escolher o tipo, o **primeiro bloco** do formulário passa a ser **"Foto ou arquivo do documento"**, com dois botões lado a lado: **"Tirar foto"** (`<input accept="image/*" capture="environment">`) e **"Escolher arquivo"** (`accept="image/*,application/pdf"`). Alvos de 44px.
  - **Obrigatório** em passaporte, RG, CNH, PID, visto e vacina: o "Salvar documento" fica desabilitado enquanto não houver ao menos 1 imagem/arquivo, com a dica abaixo do botão: "Envie a foto do documento pra salvar." Em Seguro anual e Outro continua opcional.
  - Ao enviar, roda a leitura simulada (seção 1) e preenche nome, número, emissor, datas, dose etc.
  - Imagem enviada aparece como **miniatura** (64×64, `rounded-md`) no formulário e no `DocumentCard`; tocar abre em tela cheia (Dialog), como as fotos do Roteiro. PDF continua com ícone de arquivo.

## 3. Dados de leitura

**Arquivos conhecidos novos** (os de Transporte e Hospedagem continuam como estão). Os arquivos já estão em `public/mock-vouchers/`.

| Arquivo | Formulário | Campos |
| --- | --- | --- |
| `seguro-viagem-exemplo.pdf` | Outros → Seguro | plano "Mundo — cobertura médica USD 60.000"; seguradora "Seguro Viagem (exemplo)"; apólice SV-2026-884120; vigência 20/11/2026 a 25/11/2026; vale para: viagem toda; central 24h +55 11 0000-0000 |
| `ingresso-passeio-valle-de-la-luna-exemplo.pdf` | Outros → Passeio | "Valle de la Luna ao pôr do sol"; agência "Atacama Tours (exemplo)"; código ATC-77310; 24/11/2026, 15:30; ponto de encontro "Agência — Caracoles 160, San Pedro de Atacama"; destino San Pedro de Atacama |
| `ingresso-festival-cerveja-santiago.pdf` | Outros → Ingresso | "Festival de cerveja artesanal"; "EntradasYa (exemplo)"; código EYA-48213; 22/11/2026, 13:00; local "Parque Bicentenario, Vitacura"; destino Santiago; valor CLP 45.000 |
| `passaporte-exemplo.png` | Documento → Passaporte | nome PARTICIPANTE DO TESTE; nº XX0000000; país emissor Brasil; emissão 10/03/2017; validade 10/03/2027 |
| `certificado-vacina-febre-amarela-exemplo.png` | Documento → Vacina | título "Febre amarela"; nome PARTICIPANTE DO TESTE; dose "Dose única"; data 15/08/2019; validade em branco (vale por toda a vida; mostrar "Sem validade" no card) |

Se o arquivo conhecido for enviado no formulário "errado" (ex.: passaporte em Vacina), usar o preenchimento de exemplo do formulário atual, não o do arquivo.

**Preenchimento de exemplo por tipo** (arquivo desconhecido) — valores claramente de exemplo:

| Tipo | Campos |
| --- | --- |
| Seguro (Outros) | plano "Plano viagem (exemplo)"; seguradora "Seguradora (exemplo)"; apólice EX-000000; vigência = início e fim da viagem; central 24h +55 11 0000-0000 |
| Passeio | título "Passeio guiado (exemplo)"; agência "Agência (exemplo)"; código EX-0000; data = 2º dia do destino escolhido (ou da viagem), 09:00 |
| Ingresso | título "Ingresso (exemplo)"; "Bilheteria (exemplo)"; código EX-0000; data = 2º dia, 20:00 |
| Passaporte | nome PARTICIPANTE DO TESTE; nº XX0000000; Brasil; emissão 10/03/2017; validade 10/03/2027 (igual ao arquivo de exemplo, pra tarefa do aviso de validade funcionar com qualquer foto) |
| RG | nome PARTICIPANTE DO TESTE; nº 00.000.000-0; SSP-SP; emissão 01/01/2015 |
| CNH | nome PARTICIPANTE DO TESTE; registro 00000000000; SP; validade 01/01/2030 |
| PID | nome PARTICIPANTE DO TESTE; nº PID-0000; Brasil; validade 01/01/2027 |
| Visto | título "Visto (exemplo)"; nome PARTICIPANTE DO TESTE; país "Estados Unidos"; validade 01/01/2030; múltiplas entradas; 90 dias |
| Vacina | título "Febre amarela"; nome PARTICIPANTE DO TESTE; "Dose única"; 15/08/2019 |
| Seguro anual | título "Seguro anual (exemplo)"; seguradora "Seguradora (exemplo)"; apólice EX-000000; validade 31/12/2026; central +55 11 0000-0000 |
| Outro | só o título = nome do arquivo sem extensão |

## 4. Regras de sempre
- Alvos de 44px, foco visível, `aria-live` na leitura, mensagens de erro/dica ligadas ao botão por `aria-describedby`.
- Testar em 375px e 390px, iOS e Android; testar com os arquivos de exemplo **e** com uma foto qualquer da galeria.
- `npm run lint` e `npm run build` sem erro.
- `CLAUDE.md`: (a) leitura simulada em 2 níveis, sempre preenche; (b) documento pessoal exige foto/arquivo; (c) lista dos arquivos de exemplo reconhecidos.
- Commit: `ajuste 84: tudo que sobe preenche sozinho; documento exige imagem`.
