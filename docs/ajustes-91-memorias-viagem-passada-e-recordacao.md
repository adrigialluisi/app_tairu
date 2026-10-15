# Ajuste 91 — Memórias: viagem passada como álbum por dia, e recordação com fotos em tela cheia

Origem: teste de 13/out/2026, nas tarefas de viagem passada ("Aniversário de 30 anos") e recordação.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 91: viagem passada como álbum e recordação em tela cheia`.

---

## 1. Viagem passada: visão de memória, com divisão clara de dias

**Problema:** `PastTrip.tsx` reaproveita o `TimelineStop` da viagem em planejamento, então cada lugar aparece com preço, categoria, descrição e ações. Pra uma viagem que já passou, isso é ruído, e cabe pouca coisa na tela. A Adriana pediu "o que foi feito em cada dia e as fotos mais diretas", e reforçou que **a divisão de dias é importante**.

**Fazer — `PastTrip.tsx` deixa de usar `TimelineStop` e passa a ter um layout próprio de álbum:**
- **Topo:** nome da viagem, cidades e datas, quem foi (avatares) e o botão principal **"Gerar recordação"** (como hoje).
- **Pílulas de dia** fixas no topo ao rolar (regra de navegação fixa): "Dia 1 · 10/05", "Dia 2 · 11/05"… Tocar leva direto ao dia.
- **Cada dia é um bloco bem separado:**
  - **Cabeçalho do dia forte**: "Dia 1 · Sáb, 10/05" + bairros ou cidade ("Baixa e Alfama"), com espaço generoso antes e uma linha divisória. O cabeçalho do dia em que a pessoa está fica **fixo logo abaixo das pílulas** enquanto ela rola aquele dia (sticky por seção).
  - Dentro do dia, **só o nome de cada lugar visitado**, numa linha (ícone pequeno da categoria + nome; se for fora da cidade-base, "· Sintra").
  - **Fotos em destaque** logo abaixo de cada lugar: grade de 3 por linha, quadradas, com o avatar pequeno de quem adicionou no canto inferior esquerdo da foto. Se o lugar tem mais de 6 fotos, mostrar 5 + um quadrado "+N".
  - Botão discreto "Adicionar foto" por lugar (ícone + texto curto), alinhado à direita do nome.
- **Sai:** preço, categoria por extenso, descrição, mover de dia, pulei, selos e cartão do lugar com foto da Wikipedia. Lugar pulado (não visitado) **não aparece**.
- **Tocar numa foto** abre o `PhotoViewer` em tela cheia, com lugar, dia e quem adicionou; deslizar passa para a próxima foto do mesmo dia.
- O filtro por pessoa (Todos · Você · Camila · Bruno), que já existe em "Gerar recordação", também aparece aqui, como pílulas acima da lista de dias.

## 2. Recordação: fotos em tela cheia e montagens com ritmo

**Problema:** o cartão "Lisboa em fotos" é uma grade de 4 fotos pequenas dentro de um story, com legenda e crédito por cima de cada uma. É justamente o formato em que menos dá pra ver as imagens.

**Fazer — em `utils/retrospective.ts` (montagem dos cartões) e `components/recap/StoryPlayer.tsx` (desenho):**
- Trocar o cartão `city-photos` (grade de 4) por uma **sequência de cartões de foto** por cidade, alternando layouts para dar ritmo:
  - **`photo-full`** (a maioria): 1 foto em tela cheia, borda a borda, `object-fit: cover`, com um **zoom lento** (Ken Burns: escala de 1.0 → 1.08 durante a duração do cartão). Legenda pequena no rodapé, sobre um degradê escuro: "Castelo de São Jorge · por Camila".
  - **`photo-split`**: 2 fotos uma em cima da outra, cada uma com metade da altura, separadas por 4px.
  - **`photo-hero`**: 1 foto grande (dois terços da altura) + 2 pequenas lado a lado embaixo.
  - **Nunca** grade de 4 ou mais.
  - Sequência sugerida por cidade: título da cidade → full → split → full → hero → full… até acabar as fotos escolhidas (máx. 8 por cidade, como hoje).
  - Foto vertical vai preferencialmente em `photo-full`; fotos horizontais em `photo-split`.
- **Créditos fora das fotos:** tirar "Autor · CC BY-SA 4.0" de cima de cada imagem. Criar um cartão final **"Créditos das fotos"** (antes do fecho, ou como última tela), listando autor, licença e fonte de cada foto de exemplo do Wikimedia. A legenda da foto fica só com lugar e quem adicionou. A linha "Fotos de exemplo · Wikimedia Commons" pode ficar bem pequena no cartão de título da cidade.
- As telas de texto (capa, números, mapa, destaques, fecho) continuam como estão, intercaladas.
- Duração: cartão de foto cheia ~3,5 s; split e hero ~4,5 s (têm mais pra ver). Tocar à direita/esquerda continua avançando/voltando; pausar continua funcionando.
- Atualizar o contador de progresso ("5 de 11") e as barrinhas do topo para a nova quantidade de cartões.

---

## Checklist de aceite
- [ ] Viagem passada sem preço, categoria, descrição e ações; só nome dos lugares + fotos em grade 3×.
- [ ] Divisão de dias clara: cabeçalho forte, divisória e cabeçalho fixo ao rolar; pílulas de dia funcionando.
- [ ] Avatar de quem adicionou em cada foto; filtro por pessoa.
- [ ] Recordação sem grade de 4; maioria das fotos em tela cheia com zoom lento; montagens split e hero.
- [ ] Créditos só no cartão "Créditos das fotos".
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
