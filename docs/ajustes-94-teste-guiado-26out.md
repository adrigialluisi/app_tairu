# Ajuste 94 — Correções do teste guiado de 26/out: atalhos do moderador por parte, "Quem pagou", cor por convidado, conflito com voo, mapa da viagem passada

Origem: teste guiado de 26/out/2026, com a Adriana como participante. Depois do teste, o roteiro foi reorganizado em 4 partes lineares (`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md`, versão 26/out): **organizar a viagem → uma semana antes → durante a viagem → recordação**. Este ajuste prepara o protótipo pra esse formato e corrige o que apareceu no teste.

Aplicar **depois do ajuste 93**. Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 94: correções do teste guiado de 26/out`.

---

## 1. Menu do moderador: um atalho por parte do teste

Arquivo: `src/components/shell/PlatformSwitcher.tsx` (menu aberto pelo toque longo, ajuste 89).

**Hoje:** "Simular: 2 dias depois" e "Recomeçar teste".

**Fazer:** o menu passa a ter 3 itens, nessa ordem:

1. **"Simular: uma semana antes da viagem"**. Faz exatamente o que o "Simular: 2 dias depois" faz hoje (`trip.simulateGroupUpdate()`). Só muda o texto. Atualizar também o banner/aviso que hoje fala em "2 dias" (procurar "2 dias" no código) para "Faltam poucos dias pra viagem".
2. **"Simular: durante a viagem"** (novo). Coloca o app no **dia 15/11/2026, à noite**, com a viagem acontecendo:
   - Novo estado no `TripContext`: `simulatedTodayISO: string | null` (padrão `null`), zerado em `resetTrip()`.
   - Se `simulateGroupUpdate` ainda não rodou, roda antes, pra Marina e Rodrigo estarem na viagem (assim a Parte 3 funciona mesmo se a Parte 2 foi pulada). Se os dois não foram convidados, convida e já faz entrarem.
   - Define `simulatedTodayISO = '2026-11-15'` e navega pra `/inicio`.
   - Fica desabilitado, com dica "Cadastre os destinos e as datas primeiro", se a viagem não tiver destino com datas.
3. **"Recomeçar teste"**: como hoje. Também zera `simulatedTodayISO`.

**O que muda no app quando `simulatedTodayISO` existe:**
- **Início:** o card "Sua viagem" ganha um selo **"Acontecendo agora"** e a linha **"Buenos Aires · Dia 2 de 14"** (cidade e número do dia calculados pela data). Abaixo, um botão secundário **"Ver o dia de hoje"** que abre o Roteiro já nesse dia.
- **Roteiro:** abre na cidade e na pílula de data de hoje, e a pílula de hoje ganha o rótulo "Hoje".
- Nada mais muda: Central, Custos e Convidados continuam iguais.

## 2. Custos: "Quem pagou?" vira select, com a opção "Outro" pra quem não está na viagem

Arquivos: `src/components/costs/PaidSplitFields.tsx` e quem monta a lista de `members` para ele (`ExpenseForm`, `CentralCostForm`, `utils/costs.ts`).

**Hoje:** "Quem pagou?" e "Dividir com" são chips só com quem está na viagem. Não dá pra registrar um gasto pago por alguém que **não foi adicionado** ao app (um amigo que entrou só num jantar, um parente que pagou o passeio).

**Fazer:**
- **"Quem pagou?"** vira um **select** (`NativeSelect`/select do shadcn já usado no projeto, altura 44px) com: **Eu**, os membros da viagem (os mesmos de hoje; no cenário, Marina e Rodrigo depois de entrarem) e **Outro**.
- Escolhendo **Outro**, aparece logo abaixo o campo **"Nome de quem pagou"** (obrigatório). Essa pessoa **não** vira membro nem convidado da viagem: existe só nesse gasto.
- **"Dividir com"** continua em chips com os membros da viagem. Se quem pagou foi "Outro", o nome digitado também aparece como chip, marcado por padrão.
- Não mudar quem conta como membro: convites pendentes continuam fora, como hoje.
- **Quem deve pra quem** (`settlement`): a pessoa "Outro" entra no acerto pelo nome digitado ("Você deve R$ 50 pra Paula"). Pessoas "Outro" com o mesmo nome (sem diferenciar maiúscula, acento e espaços) contam como a mesma pessoa.
- Ajustar os testes de `settlement.test.ts` pra cobrir um gasto pago por "Outro".

## 3. Cor por convidado: selo colorido e card tingido

**Hoje:** "Sugerido por Marina" é um avatar cinza com texto, discreto demais (print do teste: parada do Don Julio no Roteiro).

**Fazer:**
- Cada membro ganha uma **cor fixa**, definida em um lugar só (ex.: `src/utils/memberColors.ts`): Você = bordô do Tairu; Marina e Rodrigo com duas cores distintas da paleta, com contraste AA (texto 4,5:1). Convidados reais além do cenário recebem as cores seguintes de uma lista fixa.
- O `MemberAvatars` passa a usar essa cor no fundo do avatar.
- **Parada do Roteiro (`TimelineStop`) e card de Sugestões (`PlaceCard`) escolhidos por convidado:**
  - O selo de quem sugeriu sai da linha de baixo e vira uma **tag colorida no canto superior direito** ("Marina" com o avatar, fundo na cor dela).
  - O **card inteiro ganha um fundo bem suave na cor da pessoa** (cor a ~8% de opacidade) e uma borda na mesma cor. Quando dois ou mais querem ir, usar a cor de quem sugeriu primeiro.
  - Quando a participante tocou "Eu também", o card mantém a tag do convidado, mas volta ao estado "Eu escolhi" (✓ bordô), como no ajuste 87.
- A linha de **"Escolhas dos convidados"** usa a mesma cor (avatar colorido e um filete à esquerda).

## 4. "Eu também" direto na lista "Escolhas dos convidados"

**Hoje:** a lista compacta (ajuste 87) só leva até o card do lugar, e o "Eu também" fica no card, longe. No teste não ficou evidente.

**Fazer:** cada linha da lista ganha, à direita, um botão compacto **"Eu também"** (44px de alvo). Ao tocar, vira **"✓ Você também"** e o card do lugar na categoria fica sincronizado. Tocar no resto da linha continua rolando até o card. Tirar o chevron `›` quando o botão estiver presente, pra não competir.

## 5. Tirar o link de dicas de dentro da parada

**Hoje:** embaixo das paradas do Roteiro aparece um link de dicas locais (cortado no print do teste, logo abaixo do Don Julio).

**Fazer:** remover esse link das paradas. As dicas continuam na seção/aba de Dicas locais do topo do Roteiro.

## 6. Atividade marcada depois da saída da cidade

**Hoje:** no dia 19/11, com o voo pra Santiago às 14:00 vindo da Central, o app deixou adicionar o evento "Noite de galerias abertas em Palermo" (Buenos Aires, 19:00–23:00). Ele aparece na Agenda do dia como se estivesse tudo certo.

**Fazer:**
- **Regra:** no dia em que existe um transporte **saindo** da cidade A (voo, ônibus, trem com origem em A), qualquer evento, ingresso ou passeio **da cidade A** com horário **depois da partida** está em conflito. Vale também o contrário: atividade da cidade B **antes da chegada**.
- **Ao adicionar** (cartão de evento em "Eventos nas suas datas" ou ingresso/passeio da Central): se houver conflito, abrir um `AlertDialog`: *"Nesse horário vocês já vão estar a caminho de Santiago (voo às 14:00). Adicionar mesmo assim?"*, com "Adicionar mesmo assim" e "Cancelar".
- **Na lista "Eventos nas suas datas":** eventos em conflito aparecem com o selo "Depois do seu voo".
- **Na Agenda do dia:** item em conflito ganha um selo de alerta "Conflita com o voo das 14:00", em âmbar (contraste AA), e a opção de remover continua.
- Lugares sem horário (seção "Lugares pra visitar") não entram na regra.

## 7. Dia de troca de cidade: "Buenos Aires → Santiago"

**Hoje:** o dia 19/11 aparece como "Santiago · Dia 6 de 14", mas a manhã é em Buenos Aires (check-out e voo). Isso vem da regra do ajuste 09: o dia de fronteira fica com a cidade de chegada.

**Fazer:** manter a regra de atribuição (os lugares do dia continuam contando pra cidade de chegada), mas no **cabeçalho do dia** de fronteira mostrar **"Buenos Aires → Santiago · Dia 6 de 14"**. Só muda o texto exibido.

## 8. "Novidades na viagem" também mostra os lugares sugeridos

**Hoje:** depois da simulação, a Início mostra "Marina Duarte e Rodrigo Antunes entraram na viagem" e "2 gastos lançados", mas nada sobre os lugares que eles sugeriram (Don Julio e La Bombonera). No teste, a participante só percebeu que os amigos entraram.

**Fazer:** nova linha de novidade **"2 lugares sugeridos em Buenos Aires"**, com os avatares de quem sugeriu, levando direto pra Roteiro → Sugestões → "Escolhas dos convidados" de Buenos Aires. Ordem: entraram → lugares sugeridos → gastos.

## 9. Mapa da viagem passada: pinos enfileirados

**Hoje:** em "Aniversário de 30 anos" → Mapa da viagem → "Viagem toda", os pinos aparecem em **duas fileiras horizontais** atravessando o mapa, do oceano até a Espanha, em vez de ficarem sobre Lisboa e o Porto (print do teste).

**Provável causa (conferir antes de corrigir):** os pinos de fotos do mesmo lugar estão sendo afastados uns dos outros para não sobrepor com um deslocamento em pixels. Com o zoom aberto, cada passo vira dezenas de quilômetros. Também pode ser `lat`/`lng` faltando em `examplePastTripPhotos.json`, com um valor de reserva.

**Fazer:**
- **Um pino por lugar** (não por foto), com o número do dia, como no Roteiro. Tocar no pino mostra o lugar e as fotos dele.
- O mapa abre com `fitBounds` nos pinos da aba escolhida ("Viagem toda", "Lisboa", "Porto"), com uma margem.
- A linha tracejada liga os **lugares** na ordem da visita.
- Conferir se todos os lugares da viagem de exemplo têm coordenadas reais.

---

## Checklist de aceite
- [ ] Menu do moderador com "Simular: uma semana antes da viagem", "Simular: durante a viagem" e "Recomeçar teste".
- [ ] "Durante a viagem" funciona mesmo sem ter passado pelo "uma semana antes"; a Início mostra "Acontecendo agora · Buenos Aires · Dia 2 de 14"; o Roteiro abre no dia 15/11.
- [ ] "Quem pagou?" em select com Eu, os membros da viagem e Outro; "Outro" pede nome, não vira membro e entra no quem deve pra quem.
- [ ] Tag colorida por convidado no canto do card e card tingido, no Roteiro e nas Sugestões.
- [ ] "Eu também" funciona direto na lista "Escolhas dos convidados".
- [ ] Sem link de dicas dentro das paradas.
- [ ] Evento de Buenos Aires às 19:00 no dia 19 pede confirmação e, se mantido, aparece com alerta de conflito.
- [ ] Dia 19 com cabeçalho "Buenos Aires → Santiago".
- [ ] Novidades mostram os lugares sugeridos.
- [ ] Mapa da viagem passada com um pino por lugar, sobre Lisboa e Porto.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
