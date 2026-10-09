# Ajuste 83 — Convidados fica só com convites e quem está na viagem (sai "Documentos do grupo")

> **Pra quem vai aplicar (Claude Code no Antigravity):** aplicar depois do 82. Arquivos: `src/screens/InviteCompanions.tsx` (+ `.module.css`), `src/context/TripContext.tsx`, `src/components/documents/DocumentForm.tsx`, `DocumentCard.tsx`, `src/context/DocumentsContext.tsx`.

Pedido da Adriana (08/out/2026): "Documentos do grupo" **não faz sentido em Convidados**. A seção serve pra **enviar convites, mostrar quem aceitou e está na viagem, e poder editar**.

## 1. Sai o compartilhamento de documentos (ajuste 66)
- Remover a seção **"Documentos do grupo"** de `InviteCompanions.tsx` (título, texto, estado vazio, lista, link "Escolher em Meus documentos").
- Como ela era o único lugar onde o documento compartilhado aparecia, **o interruptor "Compartilhar com o grupo de {viagem}" também sai** do `DocumentForm` (no 82 ele tinha ficado sozinho no grupo "Compartilhar": o grupo inteiro some). Tirar `sharedDocumentIds` do `TripContext` e `shared` do `DocumentCard`, e a menção no `CLAUDE.md`.
- Registro: a ideia de "carteira de documentos compartilhada" volta pra lista de hipóteses (pode virar teste no Mês 3).

## 2. Tela Convidados
**AppBar:** título "Convidados" (igual ao item do menu), subtítulo = nome da viagem.

**Bloco "Convidar"** (como hoje): campo de e-mail + botão "Convidar" abaixo.

**Bloco "Na viagem"** (`h2` 16px semibold + contador "3 pessoas"):
- Primeira linha sempre **Você** (avatar "EU", selo "Organizador(a)").
- Depois quem entrou (`status === 'entrou'`): avatar, nome, e-mail em 13px `text-muted-foreground`, selo verde "Na viagem" (ícone `Check` + texto).
- Ação por pessoa: botão de 44px com ícone `MoreVertical` (`aria-label="Opções de {nome}"`) abrindo `DropdownMenu` do shadcn com **"Remover da viagem"** (texto em `--destructive`). Abre `AlertDialog`: "Remover {nome} da viagem? Os lugares e gastos que {nome} adicionou continuam no roteiro e em Custos." Botões "Cancelar" / "Remover".

**Bloco "Convites enviados"** (só aparece se houver pendente):
- E-mail, selo neutro "Aguardando resposta" (ícone `Clock`), e "enviado hoje".
- Menu `MoreVertical` com:
  - **"Reenviar convite"** → toast "Convite reenviado para {e-mail}".
  - **"Corrigir e-mail"** → a linha vira um campo de e-mail editável com "Salvar" / "Cancelar" (mesma validação do campo de convidar). Salvar troca o e-mail do convite; se o novo e-mail for de um convidado simulado (Marina/Rodrigo), ele "entra" ~2,5s depois, como no convite normal.
  - **"Cancelar convite"** (`--destructive`) → sem confirmação, com toast "Convite cancelado" + ação "Desfazer" (Sonner).

Novas ações no `TripContext`: `updateCompanionEmail(id, email)`, e `removeCompanion` continua servindo pra cancelar e pra remover. Remover alguém que entrou **não apaga** as contribuições simuladas (marcar `dismissed` só no aviso, como hoje).

**Estado vazio** (ninguém convidado): só a linha "Você" no bloco "Na viagem" + texto "Convide quem vai com você. Cada um pode sugerir lugares e lançar gastos."

## 3. Regras de sempre
- Alvos de 44px, foco visível, selo nunca só por cor (ícone + texto).
- Testar em 375px e 390px, iOS e Android.
- `npm run lint` e `npm run build` sem erro.
- `CLAUDE.md`: atualizar item de Convidados e tirar a parte de documentos compartilhados do item de Documentos.
- Commit: `ajuste 83: convidados só com convites e membros`.
