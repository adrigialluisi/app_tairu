# Ajustes — refino visual dos componentes (seta do select colada na borda) (08/set/2026)

## Antes de tudo: use a skill de UX/UI de frontend que você tem disponível neste ambiente

A Adriana tem uma (ou mais) skill de design/UX-UI de frontend instalada aqui no Claude Code/Antigravity. Antes de aplicar qualquer mudança deste arquivo, cheque suas skills disponíveis e carregue/use a que for de UX/UI de frontend design pra conduzir este refino — este documento aponta o problema concreto encontrado, mas o padrão de espaçamento/refino a aplicar no resto dos componentes deve seguir o critério dessa skill.

## O problema relatado

No `CurrencySelect`, a setinha do dropdown ("⌄" / "﹀") está colada na borda direita da pílula, quase encostando — ver print da Adriana (dois selects de moeda, "ARS · Peso argentino" e "CLP · Peso chileno").

## Causa raiz (já investigada)

`CurrencySelect.tsx` usa um `<select>` nativo do HTML, sem `appearance: none`. A seta que aparece é a seta **nativa do navegador/SO**, não um ícone nosso — ela não obedece ao `padding` que definimos em `.select` (`var(--space-1) var(--space-3)`), o navegador desenha a própria seta colada na borda direita do elemento, ignorando nosso espaçamento.

**Importante: manter o `<select>` nativo, não trocar por um dropdown 100% customizado.** No celular, um `<select>` nativo abre o seletor do próprio sistema operacional (roda de opções no iOS, lista Material no Android) — é exatamente o tipo de "navegação nativa" que já decidimos que melhora a usabilidade no resto do protótipo. Trocar por um dropdown customizado do zero perderia esse comportamento nativo. O que precisa mudar é só a **seta visual**, não o comportamento do campo.

## O que fazer

Em `CurrencySelect.module.css`:
- `.select` ganha `appearance: none` (+ `-webkit-appearance: none` `-moz-appearance: none` pra compatibilidade).
- Aumentar o `padding-right` do `.select` o suficiente pra abrir espaço pra um ícone próprio (não deixar o texto colidir com a seta nova).
- Desenhar uma seta/chevron nossa (SVG inline, posicionada com `position: absolute` dentro de `.wrap`, ou via `background-image` no próprio `.select`) — usando `--muted` ou `--text` como cor (conferir contraste), com espaçamento consistente até a borda direita da pílula (uma folga real, não colada — usar um token de espaçamento existente, ex. \`var(--space-3)\` ou \`var(--space-4)\`, o que ficar visualmente equilibrado).
- O clique/toque na seta continua abrindo o \`<select>\` nativo normalmente (a seta é só visual, por cima do elemento real — não pode capturar o clique e bloquear o select).

## Depois disso, um passo a mais: revisão geral de espaçamento interno

Já que estamos revisando espaçamento, aproveite pra passar o mesmo olhar crítico (com a skill de UX/UI) nos outros componentes com ícone/elemento colado em borda de pílula — confirmar que todos têm folga consistente entre conteúdo/ícone e a borda do componente:
- \`Chip\` (botão "×" de remover destino) — conferir se a folga já está adequada (parece ok no print, mas vale confirmar com a skill).
- Qualquer outro select, badge ou pílula com ícone que for aparecer nas próximas telas — vale estabelecer um espaçamento padrão (token) pra ícone-até-borda em componente de pílula, pra não repetir esse problema tela por tela.

## Checklist antes de considerar pronto
- \`npm run build\` limpo.
- A seta do select de moeda tem folga visível até a borda, nos dois lados (iOS e Android).
- O \`<select>\` continua abrindo o seletor nativo do sistema ao tocar (não virou um dropdown customizado).
- Testar em 375px e 390px de largura.
- Conferir contraste da nova seta (cor escolhida) contra o fundo do card.
