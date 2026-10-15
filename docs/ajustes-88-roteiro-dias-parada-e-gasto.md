# Ajuste 88 — Roteiro dia a dia: divisão por proximidade de verdade, mapa, parada mais limpa, lançar gasto pela parada, controles fixos

Origem: teste de 13/out/2026, nas tarefas "ver e ajustar o roteiro" e "lançar um gasto".

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint` e `npm run build`. Commit: `ajuste 88: roteiro por proximidade, parada limpa e gasto pela parada`.

---

## 1. Divisão dos dias: agrupar por proximidade de verdade

**Problema visto:** em Buenos Aires, um lugar de Palermo caiu no mesmo dia de San Telmo e La Boca, cruzando a cidade; o Café Tortoni (Av. de Mayo) ficou longe da Casa Rosada; e os dois restaurantes (Café Tortoni e La Brigada) caíram no mesmo dia.

**Causa:** `computeProximityDays` (`src/utils/itinerary.ts`) monta uma rota gulosa pelo vizinho mais próximo, começando pelo lugar mais ao norte, e corta essa rota em pedaços de tamanho igual. O vizinho mais próximo deixa "sobras" distantes no fim da rota, que caem no último dia; e o corte prioriza quantidade igual em vez de bairro.

**Fazer — trocar o algoritmo (mantendo a assinatura da função e o determinismo):**
1. **Agrupamento:** k-medoids (ou k-means com sementes determinísticas, ex.: farthest-point a partir do lugar mais ao norte) com `k = dayCount`, usando `haversineKm`. Iterar atribuindo cada lugar ao centro mais próximo até estabilizar.
2. **Equilíbrio com folga:** um dia pode ter até 2 lugares a mais que outro. Só mover um lugar de grupo pra equilibrar se o aumento de distância for pequeno (ex.: até 1,5× a distância ao próprio centro).
3. **Restaurantes:** lugar com categoria `gastronomia` conta como "refeição". No máximo **1 refeição por dia** enquanto houver dias livres; se houver mais refeições que dias, o segundo restaurante do dia é permitido (almoço e jantar). Ao realocar, o restaurante vai pro dia **mais próximo que ainda não tem refeição**.
4. **Dia de deslocamento mais leve:** se num dia há voo, ônibus ou trem saindo ou chegando (Central, via `buildAgenda`), esse dia recebe no máximo metade da média de lugares.
5. **Ordem dentro do dia:** rota pelo vizinho mais próximo **dentro do grupo**, começando pelo lugar mais perto do hotel daquele destino, se houver hotel na Central (senão, pelo mais ao norte, como hoje).
6. Itens fixados (movidos à mão ou pulados) continuam fora do cálculo, como hoje.
7. **Testes:** criar `src/utils/itinerary.test.ts` (ou um script em `scripts/`) com o cenário do teste de 13/out (Buenos Aires: Caminito, La Brigada, Casa Rosada, Café Tortoni, Cemitério da Recoleta, MALBA, La Bombonera; 3 dias, sendo o dia 22 de deslocamento). **Critério de aceite:**
   - Café Tortoni no mesmo dia da Casa Rosada;
   - La Brigada no mesmo dia do Caminito e de La Bombonera;
   - MALBA no mesmo dia do Cemitério da Recoleta;
   - Café Tortoni e La Brigada em dias diferentes.

## 2. Mapa: marcadores sem sobreposição e legenda com datas

**Fazer em `RouteMap.tsx`:**
- **Marcadores sobrepostos** (paradas muito próximas, como 2 e 3 em La Boca): deslocar levemente em leque quando a distância na tela for menor que o tamanho do pino, ou agrupar num pino "2–3" que abre ao tocar.
- **Legenda:** hoje mostra "Dia 1 / Dia 2" embaixo do mapa, quase fora da tela, enquanto as pílulas mostram "20 / 21". Passa a usar **as mesmas datas das pílulas** ("Sex 20/11", "Sáb 21/11") e fica **por cima do mapa**, no canto superior esquerdo, num cartão branco semitransparente, visível sem rolar.
- Na visão "Todos os dias", o número no pino vira "dia.parada" curto (ex.: "1·2") ou a cor sozinha + número da parada, desde que a legenda esteja visível. Escolher o que ficar mais legível em 375px.

## 3. Parada do roteiro mais limpa

**Hoje (`TimelineStop.tsx`):** "Adicionar foto" e o seletor de dia ficam numa linha, e o "Pulei" cai sozinho na linha de baixo, parecendo solto. Em parada pulada, ainda aparece "Adicionar foto".

**Fazer:**
- **Parada normal:** uma **faixa única de ações** no rodapé da parada, alinhada: `[📷 Foto]  [💰 Gasto]  [⇆ 21/11 ▾]  [⋯]`. O "Pulei" vai pra dentro do menu `⋯` (junto com "Remover do roteiro", se existir). Se não couber em 375px, o seletor de dia também vai pro `⋯` como "Mudar de dia".
- **Parada pulada:** só o nome riscado e o botão **"Desfazer" na mesma linha, à direita**. Sem foto do lugar, sem tags, sem descrição e sem "Adicionar foto".
- **Divisória** fina (`border-border`) entre uma parada e outra, com o espaçamento padrão entre grupos, pra delimitar cada atividade.

## 4. Lançar gasto a partir da parada

**Ideia da Adriana:** a pessoa está olhando o lugar no roteiro; é mais fácil lançar o gasto dali do que ir em Custos e preencher tudo.

**Fazer:**
- Ação **"Gasto"** na faixa da parada (item 3). Abre o `ExpenseForm` (bottom sheet ou inline) **já preenchido** com:
  - descrição = nome do lugar (ex.: "Don Julio");
  - "Onde foi?" = cidade do destino;
  - moeda = moeda do destino (ARS);
  - data = data do dia da parada;
  - categoria = deduzida da categoria do lugar (`gastronomia` → Alimentação; `cultura`/`natureza` → Passeios; `compras` → Compras);
  - quem pagou = Você; dividir com = todos.
  A pessoa só digita o valor e confirma.
- O gasto guarda a referência da parada (`placeSelectionId`).
- Depois de lançado, a parada mostra uma linha: "ARS 120.000 · ≈ R$ 409", e tocar nela leva ao lançamento em Custos.
- Continua dando pra lançar por Custos → "+ Lançar gasto" (táxi, mercado etc.).

## 5. Controles do Roteiro fixos no topo

Seguindo a regra de navegação fixa (ajuste 85), mas sem comer metade da tela:
- Fica fixo: **abas de cidade** + **pílulas de data**, numa faixa só, com o alternador **Lista/Mapa como ícone** na ponta direita da mesma linha das pílulas.
- As abas Sugestões · Roteiro · Dicas locais **não** ficam fixas (rolam com a página), para economizar altura.
- Na aba Sugestões, o que fica fixo são as abas de cidade + o campo "Buscar ou adicionar um lugar" (ajuste 87).

---

## Checklist de aceite
- [ ] Critério de aceite do item 1 passando no teste automatizado.
- [ ] Pinos próximos não se sobrepõem; legenda com datas por cima do mapa.
- [ ] Parada normal com faixa única de ações; "Pulei" no `⋯`.
- [ ] Parada pulada: só nome riscado + "Desfazer" à direita.
- [ ] Divisória entre paradas.
- [ ] "Gasto" na parada abre o formulário preenchido; o valor aparece na parada depois.
- [ ] Cidade + datas + Lista/Mapa fixos ao rolar o Roteiro.
- [ ] `npm run lint` e `npm run build` ok.
