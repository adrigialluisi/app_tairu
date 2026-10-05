# Ajuste 73 — Fundo cinza no conteúdo, botão secundário visível, espaço no Roteiro, seleção duplicada e fotos sumidas

Feedback da Adriana (05/out/2026) depois do ajuste 72: "o resultado ficou bom". Faltam estes acertos.

## 1. Fundo do conteúdo em cinza claro
Pra separar o miolo do header (AppBar) e do menu fixo, e destacar os cartões:
- **Conteúdo da tela** (área entre AppBar e menu): fundo `#f5f5f4` (stone-100).
- **AppBar e menu inferior:** continuam brancos, com a borda stone-200.
- **Cartões, campos, chips, botões:** continuam brancos (agora se destacam do fundo).
- Ajustes que isso exige (senão somem no cinza):
  - **Trilho das abas iOS** (era `bg-muted` = stone-100): passa pra `#e7e5e4` (stone-200); aba ativa continua branca com `shadow-sm`. Contraste do texto inativo stone-600 sobre stone-200: 6.1:1.
  - **Abas Android:** sem mudança (sublinhado), a linha de base fica stone-300.
  - **Círculo do ícone dos estados vazios e dos cabeçalhos de seção** (era stone-100): passa pra branco com borda stone-200.
  - **Bloco sem foto dos cartões de lugar** (era stone-100): passa pra `#ece9e6` (um tom acima) pra não se fundir.
  - Linha da tabela do conversor, segmentado Lista/Mapa e qualquer outro `bg-muted` usado como fundo de controle: conferir e subir pra stone-200 quando estiver sobre o cinza.
  - Texto secundário stone-600 sobre stone-100: 7.0:1 (ok).
- Início e Splash: Início segue a mesma regra (fundo cinza, cartões brancos); Splash continua branca.

## 2. Botão secundário que parece botão
Hoje o `outline` (fundo branco + borda stone-200) some, principalmente no "Convidar", "+ Lançar gasto", "+ Adicionar documento".
- Nova variante **secundária = "bordô suave"**, igual ao "Enviar voucher" que já funciona bem: fundo `#fbeff1`, borda 1px `#b23345` a 30% (`rgba(178,51,69,.3)`), texto `#7e2331` peso 500, altura 44px, `rounded-md`. Hover/pressed: fundo `#f6dfe3`. Contraste do texto: 8.6:1 (7.6:1 no hover).
- Aplicar em **todos** os botões secundários (`variant="secondary"` do nosso `Button`) e no "Enviar voucher" (pra ficarem idênticos).
- `outline` neutro fica só pra ações de baixa ênfase que já são texto/link hoje, se houver.
- Regra do botão primário único por tela continua.

## 3. Roteiro: espaço abaixo das pílulas de data
Na aba Roteiro → Lista, o primeiro cartão do dia está grudado nas pílulas de data. Colocar **16px** entre a faixa de pílulas e o primeiro cartão (e conferir que entre a barra Lista/Mapa e as pílulas também há 16px). Vale também pro Mapa.

## 4. Bug: "selecionar uma atração marca outras embaixo"
**Causa provável (por desenho, não por erro de código):** desde o ajuste 60 o mesmo lugar pode aparecer em mais de uma seção (ex.: Feira de San Telmo em "Pontos turísticos" e em "Compras"). Ao marcar numa, o ✓ aparece na outra, e parece que o app marcou sozinho.
**Correção: cada lugar aparece em uma seção só.**
- Ordem de prioridade: primeiro as **seções de interesse** marcadas no perfil, na ordem da tela (Gastronomia, Cultura e história, Natureza, Vida noturna, Compras); um lugar vai pra **primeira** seção de interesse que bater com uma categoria dele.
- O que não bater com nenhum interesse vai pra **Pontos turísticos** ou **Fora do circuito**, conforme `popularity` (e só se essas seções estiverem ativas no perfil; com "Equilibrado", as duas).
- O que não couber em nenhuma seção ativa não aparece (como hoje quando a seção está desligada).
- Contadores dos atalhos e de cada seção passam a contar sem repetição.
- **Também verificar se existe um bug real**: chaves (`key`) repetidas na lista, ids de seleção compartilhados entre cartões, ou o toggle agindo por índice em vez de `place.id`. Se existir, corrigir e me contar.

## 5. Bug: fotos dos lugares sumiram
Depois do ajuste 72 nenhum cartão mostra foto (só o ícone da categoria), em Sugestões e na Lista do Roteiro. Antes as fotos da Wikipedia apareciam.
- Investigar: se o `usePlaceThumbnail` ainda devolve URL (logar no console), se a `<img>` está renderizando mas escondida (z-index/`position`/`opacity`/altura 0 depois da remoção de CSS Module), ou se o fallback do ícone está sempre por cima.
- Esperado: com foto → só a foto (ícone some quando a imagem carrega); sem foto → ícone da categoria.
- Conferir também o cartão grande da Início (usa o mesmo hook) e as fotos de hotel na Hospedagem.

## 6. Conferir (iOS e Android)
- [ ] Miolo cinza claro; AppBar e menu brancos; cartões brancos destacados.
- [ ] Abas iOS com trilho visível no cinza; estados vazios com círculo branco.
- [ ] "Convidar", "+ Lançar gasto", "+ Adicionar documento" e "Enviar voucher" com o mesmo visual bordô suave.
- [ ] Roteiro → Lista: 16px entre as datas e o primeiro dia.
- [ ] Sugestões: marcar Feira de San Telmo marca só ela; nenhum lugar aparece em duas seções.
- [ ] Fotos dos lugares voltaram (Sugestões, Lista do Roteiro e Início).
- [ ] `npm run build` passa; commit "ajuste 73" na branch `prototipo-mes2-shadcn`.
