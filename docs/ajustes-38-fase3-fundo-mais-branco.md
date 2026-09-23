# Ajuste 38 — Fase 3 do ajuste 34: fundo mais branco nas telas com AppBar

Feedback da Adriana (15/set/2026), vendo Destinos: "as telas não mudaram em termos visuais de serem mais clean... podemos usar mais branco no fundo." Ela está certa — a fase 2 (`ajustes-35`) só tocou a Início e um toque leve nos Lugares; as 5 telas do menu fixo (Destinos, Central, Convidados, Roteiro, Custos) e as `ComingSoon` continuam usando o `ScreenShell`, que nunca foi tocado — ainda tem o gradiente pêssego→verde-azulado original por trás da barra superior.

**Isso vira a fase 3** (a timeline do Roteiro, que eu tinha planejado como fase 3, passa a ser fase 4).

## O que muda

`ScreenShell` é o layout compartilhado de TODAS as 5 telas do menu fixo (e das `ComingSoon`) — uma mudança nele afeta todas de uma vez, sem precisar tocar tela por tela. A única parte do gradiente que hoje aparece de verdade é a faixa por trás do `AppBar` (o resto da tela já é coberto pelo "sheet" cor `--card`, quase branco) — então a mudança é pontual e de baixo risco.

**`src/components/shell/ScreenShell.module.css`** — trocar o `background` de `.screen`:

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}
```

(Era o gradiente de 4 cores — vira branco sólido, mesmo valor que `Home.tsx`/`Splash.tsx` já usam. O `--card` do "sheet" logo abaixo não muda.)

## Também: caixa de sugestão menos "bloco colorido"

A caixa "Tudo pronto! Já pode organizar transporte..." (`SuggestionCard`, do `ajustes-36`) usa `--bg-top` (pêssego) de fundo — contra um fundo agora mais branco, ela vai destacar mais do que deveria como um bloco de cor. Troca pra `--card` (o mesmo creme quase-branco dos outros cards), com borda pra continuar se diferenciando do conteúdo ao redor sem ser um bloco de cor:

**`src/components/shell/SuggestionCard.module.css`** — trocar:

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-android-card);
  background: var(--card);
  border: 1.5px solid var(--card-border);
}
```

(Só a linha `background` muda, de `var(--bg-top)` pra `var(--card)`, e a borda ganha um pouco mais de peso — 1px pra 1.5px — pra compensar a perda de contraste do fundo colorido.)

## Sobre "manter sempre o mesmo padrão de botões"

Isso já é verdade estruturalmente — só existe um componente `Button` (`src/components/shell/Button.tsx`, `primary`/`secondary`), reaproveitado em toda tela (é a mesma regra geral "reaproveitar componentes existentes" do CLAUDE.md). Não precisa de mudança de código agora — deixei registrado como reforço permanente no CLAUDE.md, pra nenhum ajuste futuro criar um botão "customizado" à parte por engano.

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- A faixa por trás do `AppBar`, em qualquer tela do menu fixo (Destinos, Central, Convidados, Roteiro, Custos) e nas `ComingSoon`, aparece branca, não mais pêssego.
- A caixa de sugestão de próximo passo aparece com o mesmo tom creme dos outros cards, não mais um bloco pêssego chamativo.
- Conferir contraste visual rápido: texto escuro sobre o branco novo continua perfeitamente legível (deve estar até mais fácil de ler que no gradiente).
- Testar em 375px/390px, nas duas plataformas.
