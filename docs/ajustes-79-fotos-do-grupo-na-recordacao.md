# Ajuste 79 — Fotos adicionadas pelo grupo no roteiro da viagem passada, usadas na recordação

> **Pra quem vai aplicar (Claude Code no Antigravity):** este ajuste **inclui o ajuste 78**, que ainda não foi aplicado. Leia `docs/ajustes-78-recordacao-com-fotos-dos-lugares.md` e aplique tudo dele, **com as mudanças abaixo**. Onde este doc e o 78 discordarem, vale este.

Pedido da Adriana (08/out/2026), vendo a tela "Gerar recordação" ainda no estado do ajuste 76 (só "Escolher fotos" vazio): a recordação tem que **já vir com as fotos que foram adicionadas no roteiro** da viagem que passou, e a pessoa **pode enviar mais** se quiser. As fotos são mock, e no roteiro elas aparecem **adicionadas por pessoas diferentes** do grupo.

## 1. Dados — quem adicionou cada foto

`docs/dados/memorias-exemplo-fotos.json` já foi atualizado (pelo Claude/Cowork):
- Novo bloco `travelers` com os 3 viajantes da viagem "Aniversário de 30 anos" (bate com "2 convidados", `travelers: 3`):
  - `voce` — "Você", iniciais "EU"
  - `camila` — "Camila Rocha", iniciais "CR"
  - `bruno` — "Bruno Teixeira", iniciais "BT"
  São **fictícios** (simulação, mesmo espírito de `src/data/mockCompanions.ts`). Usar nomes diferentes de Marina/Rodrigo de propósito, pra não misturar com o cenário fixo de teste.
- Cada foto ganhou `addedBy` (`voce` | `camila` | `bruno`). Distribuição: 14 de cada; em cada lugar, as 2 fotos são de pessoas diferentes.

No passo 2 do ajuste 78: além de `photos` (sem `downloadUrl`), copiar `travelers` pra `src/data/examplePastTripPhotos.json`. Em `examplePastTrips.ts`:

```ts
export interface ExampleTraveler { id: string; name: string; initials: string }
export interface ExamplePhoto {
  id: string; stopId: string; url: string;
  author: string; license: string; sourcePage: string;
  addedBy: string; // ExampleTraveler.id
}
export function photosOfStop(stopId: string): ExamplePhoto[]
export function travelerById(id: string): ExampleTraveler | undefined
```

O download das fotos (passo 1 do 78) continua igual.

## 2. Roteiro da viagem passada — fotos com quem adicionou

Tudo do item 2 do ajuste 78, mais:
- **Cada miniatura da faixa de fotos da parada leva um avatar pequeno** (shadcn `Avatar`, 20px, iniciais, borda branca 2px) no canto inferior esquerdo, com quem adicionou. `aria-label` da miniatura: "{Lugar}, foto adicionada por {Nome}" (pra "Você": "adicionada por você").
- Embaixo da faixa, linha 13px `text-muted-foreground`: "Fotos de Camila e você" / "Fotos de Bruno e Camila" (nomes curtos, sem repetir, "você" sempre por último).
- No Dialog de tela cheia: "Adicionada por {Nome}" acima do crédito do Wikimedia.
- **Trocar a linha abaixo de "Roteiro feito"** do ajuste 78 por: "Fotos que o grupo adicionou em cada lugar durante a viagem. (Exemplo: imagens do Wikimedia Commons.)"
- O card de convidados da viagem passada (onde aparece "2 convidados"), se já existir uma lista ou contagem, pode mostrar os 3 avatares empilhados. Se não existir, não criar seção nova.

## 3. Gerar recordação — já começa com as fotos do roteiro

Tudo do item 3 do ajuste 78, com estas mudanças:
- **Texto do topo:** "Escolha as fotos de cada cidade" + "Já separamos as fotos que o grupo adicionou no roteiro. Desmarque as que não quiser ou adicione mais do celular. Até 8 por cidade."
- **Cabeçalho de cada cidade:** nome, datas e "**6 de 8 escolhidas · fotos de 3 pessoas**" (conta quem tem foto escolhida naquela cidade; foto do celular conta como "Você").
- **Grade:** as mesmas regras (3 colunas, ordem do roteiro, check bordô, faixa com o nome do lugar), e cada foto também com o avatar de quem adicionou (canto inferior esquerdo, acima da faixa do nome, mesmo avatar da seção 2). Foto do celular: avatar "EU" + selo "Do celular", como no 78.
- **Filtro opcional por pessoa** acima da grade: pílulas "Todos · Você · Camila · Bruno" (componente de chips que já existe, seleção única, default "Todos"). Só filtra o que é **mostrado**; a seleção não muda. Se ficar apertado em 375px, pode cortar e deixar só a grade.
- **Seleção sugerida ao abrir:** em vez de "1ª foto de cada lugar", marcar até 8 fotos por cidade **alternando entre as pessoas** (ordem do roteiro, pegando a próxima foto ainda não marcada de uma pessoa diferente da anterior), pra a recordação já mostrar o grupo todo.
- **Botão "Adicionar do celular"** continua igual ao 78 (secundário, largura cheia, ícone `ImagePlus`). Este é o "enviar mais".
- Rodapé: sempre "Ver recordação". Some o texto "sem minhas fotos".

## 4. A história

Tudo do item 4 do ajuste 78, mais:
- Na legenda de cada foto de exemplo no slide "{Cidade} em fotos": nome do lugar + "por {Nome}" na mesma linha ("Torre de Belém · por Camila"), e o crédito do Wikimedia em 11px embaixo.
- No slide de **fecho**, abaixo dos totais: linha "Fotos de você, Camila e Bruno" com os 3 avatares (só quem tem foto na recordação).

## 5. Regras de sempre
- Cores só dos tokens; avatar com contraste ≥ 4.5:1 (iniciais brancas sobre bordô, ou bordô sobre stone-100).
- Nada de nome inventado fora dos 3 viajantes do JSON; tudo continua com o selo/aviso "Exemplo".
- Testar em 375px e 390px, iOS e Android.
- `npm run lint` e `npm run build` sem erro.
- Atualizar o `CLAUDE.md` (item 7, Memórias), como pede o 78, e acrescentar: fotos da viagem passada têm "quem adicionou" (viajantes fictícios em `examplePastTripPhotos.json`), e a recordação já abre com essas fotos marcadas.
- Commit: `ajustes 78 + 79: fotos do grupo no roteiro e na recordação`.
