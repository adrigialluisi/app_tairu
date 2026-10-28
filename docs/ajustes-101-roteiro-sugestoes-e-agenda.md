# Ajuste 101 — Roteiro dividido em "Sugestões" e "Agenda"

Origem: Adriana testando o ajuste 100 (28/out/2026). A tela única ficou ruim: com a viagem vazia, cada dia mostra "Ainda nada por aqui" + "Ver sugestões pra Buenos Aires", repetido dia após dia, e as sugestões ficam escondidas dentro do botão flutuante.

Decisão dela: o Roteiro abre com uma **primeira divisão em duas partes**:
- **Sugestões**: lista do que o app (e os convidados) sugerem, cada item com "Adicionar à agenda";
- **Agenda**: os dias, por cidade, com o botão flutuante "+ Adicionar".

Mantém do ajuste 100: select de cidade + botão "Dicas", simulação à prova de erro, bloco de convidados (agora dentro de Sugestões), sem interruptor de planos.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 101: roteiro em Sugestões e Agenda`.

---

## 1. Estrutura da tela Roteiro

De cima pra baixo, fixos no topo:
1. **Controle principal "Sugestões | Agenda"**: segmentado, largura total, 48px, ícone + texto (`Sparkles` "Sugestões", `CalendarDays` "Agenda"). Ativo = fundo branco, sombra leve, texto 600. É o elemento mais forte da tela.
2. **Cidade + Dicas** (ajuste 100): select "📍 Buenos Aires ▾" + botão "Dicas". Vale pras duas partes. Em Sugestões, o select **não tem** "Todas as cidades" (sugestão é sempre de uma cidade); se a Agenda estava em "Todas", Sugestões abre na cidade do dia selecionado ou na primeira cidade.

Abertura padrão:
- viagem sem nenhum lugar na agenda → abre em **Sugestões**;
- com pelo menos 1 lugar na agenda → abre em **Agenda**;
- navegação com destino explícito (Novidades, "Ver o dia de hoje", "Ver na agenda") abre na parte pedida.
- Lembrar a última parte escolhida enquanto a pessoa navega pelo app (estado em memória, não localStorage).

## 2. Parte "Sugestões"

Conteúdo, de cima pra baixo:
1. **Sugestões dos convidados · N** (bloco do ajuste 100, seção 6), só quando houver.
2. **Campo "Buscar um lugar em {cidade}"**: tocar abre a mesma folha de busca dos ajustes 97/99 (busca ao vivo, prévia, "Em qual dia?").
3. As **seções por perfil** ("Porque vocês gostam de Gastronomia", "Pontos turísticos", "Fora do circuito"…) e **"Eventos nas suas datas"**, como na antiga aba Sugestões (carrossel por seção, com o "por que" curto).

Cada card de lugar/evento troca o "+" do canto por um **botão de texto "Adicionar à agenda"** (secundário, largura do card, 44px) embaixo do card.

**Fluxo "Adicionar à agenda":**
- Abre uma folha pequena: título "Adicionar {lugar}", **"Em qual dia?"** com os dias da cidade (sem dia pré-selecionado; botão "Adicionar" desabilitado com o texto "Escolha um dia" até tocar num dia).
  - Evento: já vem com o dia do evento marcado.
  - Sugestão de convidado: já vem com o dia do plano dele marcado.
- Ao adicionar: a folha fecha, toast **"Adicionado a dom, 15/11 · Ver na agenda"** (o link troca pra Agenda nesse dia).
- O card passa a mostrar **"✓ Na agenda · dom 15"** no lugar do botão. Tocar abre um menu curto: "Ver na agenda" / "Mudar de dia" / "Tirar da agenda".
- Lugar adicionado assim fica fixado no dia (pinnedDayISO, ajuste 97).

Sem botão flutuante na parte Sugestões.

## 3. Parte "Agenda"

1. **Lista | Mapa**: controle **secundário**, compacto (36px, só ícone + texto pequeno, alinhado à direita, sem largura total), pra não competir com "Sugestões | Agenda".
2. Pílulas de data (com "Todos os dias"), rolam com a página.
3. Cards dos dias: AGENDA DO DIA (horários) · LUGARES · PLANOS DO GRUPO.
4. **Botão flutuante "+ Adicionar"** (ajuste 99: sempre visível), abre a folha de busca com "Em qual dia?" (padrão = dia selecionado nas pílulas). A folha **não** mostra mais as seções de sugestões (elas moram na parte Sugestões); no fim da folha, um link "Ver sugestões pra {cidade}" que fecha a folha e troca pra Sugestões.

**Estado vazio (sem repetição):**
- Cidade sem nenhum lugar na agenda: **um único card no topo** — "A agenda de {cidade} ainda está vazia" + botão primário **"Ver sugestões"** (troca pra Sugestões) e o texto "ou toque em + Adicionar".
- Os dias sem lugar **não** repetem mensagem nem botão: mostram só o que tiverem na AGENDA DO DIA (voo, check-in…); sem nada, uma linha discreta "Dia livre".
- Remover o "Ainda nada por aqui" + "Ver sugestões pra {cidade}" de dentro de cada dia (ajuste 100, seção 5).

## 4. Para onde apontam os atalhos

- Novidades da Início "N lugares sugeridos em {cidade}" → **Sugestões**, na cidade, com o bloco dos convidados visível.
- "Ver o dia de hoje" → **Agenda**, cidade e dia de hoje.
- "Ver na agenda" (toast e menu do card) → **Agenda**, no dia do lugar, com o card piscando.
- Eventos tocados na AGENDA DO DIA → continuam abrindo a folha do ajuste 100 no dia dele.

## 5. Conferir

- 360px, 375px e 390px: "Sugestões | Agenda" e a linha cidade + Dicas sem quebrar; Lista | Mapa compacto não sai da tela.
- Atualizar o `CLAUDE.md` (seção Roteiro).

---

## Checklist de aceite
- [ ] Roteiro abre com "Sugestões | Agenda" no topo; viagem vazia abre em Sugestões.
- [ ] Sugestões: bloco de convidados, busca e seções por perfil; cada card com "Adicionar à agenda" → escolher dia → "✓ Na agenda · dom 15".
- [ ] Agenda: Lista | Mapa compacto, pílulas, dias e "+ Adicionar" flutuante.
- [ ] Cidade vazia mostra um único card "A agenda de {cidade} ainda está vazia"; dias vazios sem botão repetido.
- [ ] Novidades → Sugestões; "Ver o dia de hoje" e "Ver na agenda" → Agenda.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
