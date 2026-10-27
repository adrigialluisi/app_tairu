# Ajuste 95 — Segunda rodada do teste guiado de 26/out: Início, Roteiro por cidade, "Alterar", Quem pagou sem restrição, Puerto Madero, recordação sem créditos

Origem: segunda rodada do teste guiado de 26/out/2026 (roteiro novo, em 4 partes), com a Adriana como participante, já com os ajustes 93 e 94 aplicados.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 95: segunda rodada do teste guiado de 26/out`.

**Antes do item 1:** o arquivo `src/components/shell/PlatformSwitcher.tsx` tem uma mudança ainda sem commit, feita fora do Claude Code: as descrições cinza embaixo dos itens do menu do moderador foram removidas ("Convide a Marina e o Rodrigo primeiro", "Cadastre os destinos e as datas primeiro"). Os botões continuam desabilitados nas mesmas condições. Manter essa mudança e incluí-la no commit.

---

## 1. Custos: "Quem pagou?" sem restringir a quem está na viagem (desfaz o 94b)

A intenção é o **organizador ter controle** dos gastos, sem depender de quem aceitou o convite. O commit "ajuste 94b" (que tirou os convites pendentes) **deve ser revertido** nessa parte.

**Lançar gasto (`ExpenseForm`) e custo da Central (`CentralCostForm`):**
- **"Quem pagou?"** passa a ser o **primeiro campo** do formulário (antes do valor e da descrição).
- Opções do select: **Eu**, **todos os convidados** (aceitos **ou** com convite pendente; pelo nome quando houver, senão pelo e-mail) e **Outro** (abre "Nome de quem pagou"), como no ajuste 94.
- **"Dividir com"**: mesmas pessoas (Eu + todos os convidados + o "Outro" digitado).

**Aba Rateio (`SettlementPanel`):**
- Sai o bloqueio "Convide alguém pra dividir os gastos da viagem" + botão "Convidar".
- O rateio funciona com qualquer pessoa que aparece em algum gasto: convidado, pendente ou "Outro".
- Estado vazio (nenhum gasto dividido com outra pessoa): texto *"Lance um gasto e diga quem pagou pra ver quem deve pra quem."*, botão primário **"Lançar gasto"** (abre o formulário) e, abaixo, link secundário **"Convidar alguém pra viagem"**.
- Atualizar os testes de `settlement.test.ts` pra cobrir um gasto pago por um convidado com convite pendente.

## 2. Destinos: tirar o botão "Continuar" do rodapé

Depois que o Perfil da viagem está salvo, o rodapé de Destinos mostra um botão "Continuar". Na avaliação da participante, "fica um pouco estranho". **Remover.** A navegação fica só pelo menu fixo de baixo. Se o botão era o único caminho de alguma sugestão de próximo passo, conferir que o selo de progresso do menu continua indicando o próximo item.

## 3. Roteiro: abas de cidade

**Hoje:** a aba Roteiro mostra só pílulas de data ("Todos os dias", "NOV 14", "NOV 15"…), sem separar por cidade. Sugestões já tem abas de cidade.

**Fazer:**
- No topo da aba **Roteiro** (e da sub-aba Mapa), as mesmas abas de cidade de Sugestões, com uma primeira opção **"Todas"**: `Todas · Buenos Aires · Santiago · San Pedro de Atacama`. Reaproveitar o componente de abas de cidade que Sugestões já usa (`DestinationTabs`).
- As pílulas de data passam a mostrar **só os dias da cidade escolhida**. Com "Todas", mostram os 14 dias, como hoje.
- Dias de troca de cidade ("Buenos Aires → Santiago", ajuste 94) aparecem nas duas cidades.
- Com a viagem "acontecendo" (`simulatedTodayISO`, ajuste 94), abre na cidade e no dia de hoje.
- As abas ficam fixas junto com as pílulas, seguindo a regra de navegação fixa (ajuste 85).

## 4. Parada do Roteiro: o ⋯ vira "Alterar"

**Hoje:** as ações da parada são "Foto", "Gasto" e um ícone ⋯ solto à direita, que abre mudar de dia, pulei e remover. O ⋯ não ficou intuitivo.

**Fazer:** trocar o ⋯ por um botão **"Alterar"**, com ícone de lápis (`Pencil` do lucide), no **mesmo estilo e tamanho** de "Foto" e "Gasto", ao lado deles. Ao tocar, abre o mesmo menu de hoje. Se os três não couberem lado a lado em 360px de largura, usar só ícone + texto curto nos três sem quebrar linha.

## 5. "Escolhas dos convidados": uma linha padrão, com "+" e ✓

**Hoje (print do teste):** a linha do Don Julio tem um botão grande "+ Eu também" e filete colorido. A da Bombonera, depois de marcada, mostra "✓ Você também quer ir" embaixo, chevron › e perdeu o filete. As duas parecem componentes diferentes, e o botão é grande demais.

**Fazer:** as linhas ficam sempre com a mesma estrutura:
- Miniatura 48px · nome · avatar colorido + "Marina · Gastronomia" · **filete colorido à esquerda sempre** (cor de quem sugeriu, ajuste 94).
- À direita, o **mesmo botão circular dos cards de Sugestões** (`PlaceCard`), em versão menor: desenho de ~36px, alvo de toque de 44px.
  - Não escolhido: círculo com contorno bordô e **"+"**. `aria-label="Eu também quero ir"`.
  - Escolhido: círculo bordô cheio com **✓**. `aria-label="Você também quer ir. Tocar pra desfazer"`.
- A frase de quem quer ir aparece no lugar da categoria quando a participante marca: "Marina · Gastronomia" vira **"Você e Marina querem ir"**. Sai a linha solta "✓ Você também quer ir".
- **Sem chevron ›.** Tocar no resto da linha continua rolando até o card.

## 6. Início: tags das viagens e "Nova viagem" fixo

- **Viagens passadas:** a tag "Exemplo" passa a mostrar **o mês e o ano** da viagem, calculados das datas: "Mai 2026" pro Aniversário de 30 anos (10/05–18/05/2026) e "Dez 2025 – Jan 2026" pro Réveillon em família (28/12–02/01). Mesmo estilo de tag de hoje.
- **Sua viagem:** a tag "Sua viagem" mostra o estado:
  - **"Planejando"**, antes da data de início.
  - **"Em andamento"**, com a viagem acontecendo (`simulatedTodayISO`, ajuste 94). Substitui o selo "Acontecendo agora" do ajuste 94; a linha "Buenos Aires · Dia 2 de 14" continua.
- **Botão "Nova viagem"** fixo no rodapé da Início (barra branca com borda superior fina, padding de segurança do iOS), sempre visível. Ajustar o espaçamento inferior pra o último item da lista não ficar escondido atrás dele.

## 7. Recordação: tirar o slide "Créditos das fotos"

**Hoje:** a recordação (`StoryPlayer`) termina com um slide "Fotos de exemplo · Wikimedia Commons — Créditos das fotos" (17 de 18).

**Fazer:** **remover esse slide** da recordação. Os créditos continuam obrigatórios pelas licenças (CC BY / CC BY-SA). Mover pra um link discreto **"Créditos das fotos"** no rodapé da tela da viagem passada (`PastTrip.tsx`), que abre a mesma lista num `Dialog`. Reaproveitar o `PhotoCredits` se servir.

## 8. Puerto Madero: ponto turístico + restaurantes do bairro

**Hoje:** `ba-puerto-madero` está em **Gastronomia** (`categories: ["gastronomia"]`), mas é um bairro/ponto turístico.

**Fazer**, em `src/data/places.json` **e** `docs/dados/places.json`:

1. **Trocar `ba-puerto-madero` por `ba-puente-de-la-mujer`**:
   - name: "Puente de la Mujer" · neighborhood: "Puerto Madero" · categories: `["cultura"]` · popularity: `"turistico"`
   - description: "Ponte giratória de Santiago Calatrava sobre o dique de Puerto Madero, cartão-postal do bairro."
   - wikiTitle: "Puente de la Mujer" · coordenadas aproximadas: -34.6081, -58.3653 (conferir).
   - Se alguma viagem de exemplo, mock de convidado ou evento referencia `ba-puerto-madero`, atualizar a referência.
2. **Dois restaurantes novos de Puerto Madero**, `categories: ["gastronomia"]`, `popularity: "turistico"`:

| id | name | description | lat, lng (aprox., conferir) |
|---|---|---|---|
| `ba-cabana-las-lilas` | Cabaña Las Lilas | Parrilla clássica à beira do dique de Puerto Madero, conhecida pelos cortes de carne argentina. | -34.6078, -58.3646 |
| `ba-chila` | Chila | Cozinha argentina contemporânea com menu degustação, na beira do dique de Puerto Madero. | -34.6150, -58.3640 |

Fotos: mesmo procedimento do ajuste 87, item 4 (foto real do lugar no Wikimedia Commons, senão representativa com `representative: true`). Conferir coordenadas no OpenStreetMap e confirmar que os dois restaurantes continuam abertos (site oficial ou turismo.buenosaires.gob.ar). Se algum tiver fechado, avisar e não incluir.

## 9. Lugares com dia certo de funcionamento (Feria de Mataderos)

**Hoje:** a Feria de Mataderos só acontece aos domingos, mas a divisão por proximidade (ajuste 80) colocou ela no sábado 14/11.

**Fazer:**
- Campo opcional novo em `PlaceEntry`: `openDays?: number[]` (0 = domingo … 6 = sábado). Preencher só onde fizer diferença: `ba-feria-mataderos: [0]`. (A Feira de San Telmo já é tratada como evento de domingo; não mexer.)
- Na divisão dos dias, um lugar com `openDays` só pode cair num dia da semana permitido. Se nenhum dia da cidade servir, vai pro primeiro dia e ganha um aviso "Só abre aos domingos".
- No card de Sugestões e na parada, mostrar "Só aos domingos" embaixo do bairro.
- Cobrir com teste em `proximityDays.test.ts`.

---

## Checklist de aceite
- [ ] Menu do moderador sem as descrições cinza (mudança já feita, incluída no commit).
- [ ] "Quem pagou?" é o primeiro campo; lista Eu, Marina, Rodrigo (mesmo com convite pendente) e Outro.
- [ ] Rateio funciona sem ninguém ter aceitado; estado vazio com "Lançar gasto".
- [ ] Sem "Continuar" no rodapé de Destinos.
- [ ] Roteiro com abas Todas / Buenos Aires / Santiago / San Pedro de Atacama, e pílulas filtradas.
- [ ] Parada com "Foto", "Gasto" e "Alterar" no mesmo estilo.
- [ ] Linhas de "Escolhas dos convidados" iguais, com "+" → ✓, filete sempre e sem chevron.
- [ ] Início: tags "Mai 2026" / "Dez 2025 – Jan 2026", "Planejando" / "Em andamento", e "Nova viagem" fixo no rodapé.
- [ ] Recordação sem o slide de créditos; créditos acessíveis na tela da viagem passada.
- [ ] Puente de la Mujer em Turístico; Cabaña Las Lilas e Chila em Gastronomia; Puerto Madero sem categoria Gastronomia.
- [ ] Feria de Mataderos só cai em domingo no roteiro.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.

Fontes (item 8): turismo.buenosaires.gob.ar/es/gastronomico/cabaña-las-lilas; mercado.com.ar (Chila, ago/2026); noticias.perfil.com (parrillas de Puerto Madero, jun/2026).
