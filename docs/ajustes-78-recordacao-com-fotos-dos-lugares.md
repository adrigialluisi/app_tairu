# Ajuste 78 — Recordação gerada com as fotos dos lugares (fotos de exemplo + do celular)

> **Pra quem vai aplicar (Claude Code no Antigravity):** os ajustes 76 e 77 foram aplicados direto no código pelo Claude (Cowork) em 06/out/2026 — leia `docs/ajustes-76-viagem-passada-e-recordacao.md` e `docs/ajustes-77-memoria-restaurantes-eventos-precos.md` antes. Arquivos envolvidos: `src/data/examplePastTrips.ts`, `src/utils/pastTrip.ts`, `src/screens/PastTrip.tsx`, `src/screens/PastTripRecap.tsx`, `src/components/recap/StoryPlayer.tsx` (+ `.module.css`) e `StoryMap.tsx`.

Pedido da Adriana (06/out/2026), vendo a tela "Gerar recordação": a recordação tem que ser montada **com as fotos que já estão nos lugares** da viagem. Como a viagem passada é de exemplo, ela pediu fotos "mock" de Lisboa e Porto achadas na internet. Na tela de gerar, a pessoa **escolhe entre essas fotos** e **também pode adicionar do próprio celular**.

Ligação com o produto real: essas fotos de exemplo fazem o papel das fotos que a pessoa adiciona em cada parada durante a viagem (ajuste 75, "Adicionar foto" no Roteiro). Quando a viagem vira passada, são essas fotos que aparecem na memória e alimentam a recordação.

---

## 1. Fotos de exemplo: dados e download

Curadoria pronta em **`docs/dados/memorias-exemplo-fotos.json`**: **42 fotos reais do Wikimedia Commons**, 2 por lugar (os 21 itens `kind: 'lugar'` da viagem Lisboa + Porto). Todas são paisagem, licença CC BY ou CC BY-SA (crédito obrigatório), e o download de cada uma foi testado (HTTP 200) em 06/out/2026. Cada item tem:

```json
{ "id": "lis-castelo-1", "stopId": "lis-castelo",
  "file": "public/memorias-exemplo/lis-castelo-1.jpg",
  "downloadUrl": "https://upload.wikimedia.org/...1280px-....jpg",
  "sourcePage": "https://commons.wikimedia.org/wiki/File:...",
  "author": "Berthold Werner", "license": "CC BY-SA 4.0" }
```

**Passo 1, baixar as fotos** (mesma lógica das fotos de hotel do ajuste 52: arquivo local em `public/`, funciona sem internet). Na pasta `Prototipo_Mes2`:

```bash
mkdir -p public/memorias-exemplo
node -e '
const d=require("./docs/dados/memorias-exemplo-fotos.json");
(async()=>{for(const p of d.photos){
  const r=await fetch(p.downloadUrl,{headers:{"User-Agent":"TairuPrototipo/1.0 (adri.gialluisi@gmail.com)"}});
  if(!r.ok){console.error("FALHOU",p.id,r.status);continue}
  require("fs").writeFileSync(p.file,Buffer.from(await r.arrayBuffer()));console.log("ok",p.id)}})()'
```

Se alguma falhar, **não trocar por outra foto qualquer**: deixar sem e avisar (o lugar fica só com a outra foto ou com a da Wikipedia).

**Passo 2, dados no app:** copiar o JSON pra `src/data/examplePastTripPhotos.json` (só `photos`, sem `downloadUrl`) e expor em `src/data/examplePastTrips.ts`:

```ts
export interface ExamplePhoto {
  id: string;
  stopId: string;
  /** `${import.meta.env.BASE_URL}memorias-exemplo/<id>.jpg` — respeita o --base do GitHub Pages */
  url: string;
  author: string;
  license: string;
  sourcePage: string;
}
export function photosOfStop(stopId: string): ExamplePhoto[]
```

Montar `url` com `import.meta.env.BASE_URL` (nunca `/memorias-exemplo/...` fixo: o deploy usa `--base=/app_tairu/`).

## 2. Memória (tela da viagem passada): as fotos aparecem nos lugares

Em `PastTrip.tsx` → Roteiro feito → Lista, em cada parada que tiver fotos de exemplo:
- **A foto grande da parada passa a ser a 1ª foto de exemplo** em vez da busca na Wikipedia. Dar ao `TimelineStop` uma prop opcional `photoUrl?: string`: quando vier, usa ela e não chama `usePlaceThumbnail`. Sem `photoUrl`, continua tudo como hoje (restaurantes e eventos seguem com Wikipedia/ícone).
- **Logo abaixo, faixa de miniaturas** com todas as fotos da parada, reaproveitando `StopPhotos` (ajuste 75). Hoje ele recebe `TripPhoto[]`: afrouxar o tipo pra `{ id: string; url: string; caption?: string }[]`, sem duplicar o componente.
- Tocar numa miniatura abre a foto em tela cheia (Dialog do shadcn, `src/components/ui/dialog.tsx`), com legenda "Nome do lugar" e **crédito obrigatório** embaixo: "Foto: {author} · {license} · Wikimedia Commons" com link pra `sourcePage` (`target="_blank"`, `rel="noreferrer"`). Fechar com Esc e com botão de 44px.
- Abaixo do título "Roteiro feito", uma linha `text-muted-foreground` 13px: "Fotos de exemplo do Wikimedia Commons — na sua viagem, aparecem as fotos que você adicionou em cada lugar."

## 3. Gerar recordação: escolher entre as fotos dos lugares + adicionar do celular

Reescrever o corpo de `PastTripRecap.tsx` (o rodapé e a ida pra história continuam):

**Texto do topo:** "Escolha as fotos de cada cidade" + "A história segue o roteiro: o mapa leva até cada cidade e depois mostra as fotos que você escolher aqui. Até 8 por cidade."

**Um cartão por cidade** (como hoje), com:
1. Cabeçalho: nome da cidade, datas, contador **"5 de 8 escolhidas"**, e à direita um link discreto "Limpar" (ou "Escolher sugeridas", quando estiver vazio).
2. **Grade de fotos, 3 colunas**, quadradas, `rounded-md`, gap 4px, **na ordem do roteiro** (dia → parada → foto 1, 2). Juntas, as fotos de exemplo das paradas daquela cidade e as do celular que a pessoa adicionou (essas no fim, com o selo "Do celular").
   - Cada foto é um botão de alternar (`aria-pressed`), alvo do tamanho da miniatura (≥ 44px). `aria-label`: "{Nome do lugar}, foto {n}" ou "Foto do celular {n}".
   - **Selecionada:** borda 2px `--accent` + círculo bordô com ícone lucide `Check` branco no canto superior direito (branco sobre bordô 6.08:1). **Não selecionada:** sem borda, foto normal. Estado nunca só por cor: o check aparece ou some.
   - Nome do lugar em faixa escura embaixo da miniatura (texto branco 13px sobre `bg-black/60`, contraste ≥ 5.7:1 sobre qualquer foto), cortado com reticências.
   - Com 8 escolhidas, as outras ficam `aria-disabled` com opacidade 50%, e aparece embaixo da grade: "Limite de 8 fotos por cidade. Desmarque uma pra trocar." (não usar `disabled` de verdade: o foco continua chegando nelas e o leitor de tela lê o motivo).
3. Botão secundário de largura cheia **"Adicionar do celular"** (ícone `ImagePlus`), o mesmo input de arquivo de hoje (várias de uma vez). Fotos do celular **entram já selecionadas** enquanto houver vaga; passando de 8, entram desmarcadas. Elas têm um botão "×" pra tirar (como hoje); as de exemplo não têm, só desmarcar.

**Seleção sugerida ao abrir a tela:** já vem marcada a **1ª foto de cada lugar, na ordem do roteiro, até 8**. Assim "Ver recordação" funciona sem nenhum toque e a pessoa só ajusta. O texto do botão do rodapé passa a ser sempre **"Ver recordação"**.

**Cidade com 0 escolhidas:** a história usa as fotos da Wikipedia dos lugares, como já faz hoje (fallback do ajuste 76). Mostrar sob a grade: "Sem fotos escolhidas: a história usa fotos dos lugares da Wikipedia."

Estado: `selected: Record<cityId, string[]>` (ids na ordem do roteiro) + `devicePhotos: Record<cityId, RecapPhoto[]>` (object URLs, revogados ao tirar e ao sair, como hoje).

## 4. A história usa as fotos escolhidas

`RecapPhoto` ganha `placeName?: string` e `credit?: string` ("Berthold Werner · CC BY-SA 4.0"). O que vai pro `StoryPlayer`: as escolhidas de cada cidade, **na ordem do roteiro** (exemplo primeiro, celular no fim).

No slide "{Cidade} em fotos":
- Foto de exemplo: legenda com o nome do lugar (mesmo estilo `tileCaption` usado hoje no fallback da Wikipedia) e, embaixo do nome, o crédito em 11px.
- Rodapé do slide quando houver alguma foto de exemplo: "Fotos de exemplo · Wikimedia Commons".
- Foto do celular: sem legenda (como hoje).
- O resto da história **não muda**: sequência, mapas, só lugares (ajuste 77) e 4 fotos por slide (mais que 4 vira 2 slides).

## 5. Regras de sempre
- Cores só dos tokens; conferir o contraste da faixa de nome e do check (ver valores acima).
- Testar em 375px e 390px, iOS e Android.
- `npm run lint` e `npm run build` sem erro.
- Atualizar o `CLAUDE.md` (item 7, Memórias): fotos de exemplo da viagem passada em `public/memorias-exemplo/` (Wikimedia Commons, com crédito), seleção por cidade na recordação, e a exceção "fotos de exemplo não são do viajante, sempre sinalizadas e com crédito".
