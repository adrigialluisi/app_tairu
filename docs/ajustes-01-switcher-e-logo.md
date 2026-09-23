# Ajustes — switcher de plataforma + logo real (08/set/2026)

## 1. Switcher iOS/Android menor, só ícone

Arquivo: `src/components/shell/PlatformSwitcher.tsx` (+ `.module.css`).

Hoje cada opção mostra texto ("iOS" / "Android"), min-width 60px, min-height 32px, font-size 13px. Trocar por:

- Cada opção vira **só um ícone** (sem texto ao lado nem embaixo) — remover o `label` visível.
- Ícone iOS: glifo de maçã. Ícone Android: glifo do robozinho Android. Usar SVG inline simples (não precisa de lib de ícones).
- Reduzir o tamanho visual do botão (ícone + preenchimento) — o objetivo é ocupar bem menos espaço na tela do que hoje.
- **Mas manter a área de toque em pelo menos 44×44px** (regra de acessibilidade do `CLAUDE.md`) — o ícone em si pode ser menor (ex.: 16-18px), com padding suficiente ao redor pra a área clicável do `<button>` continuar 44×44, mesmo que visualmente o grupo pareça mais compacto.
- Manter `role="radiogroup"` / `role="radio"` / `aria-checked` como já está.
- Adicionar `aria-label="iOS"` e `aria-label="Android"` em cada botão (essencial agora que não sobra texto visível pra leitor de tela).
- Manter o destaque visual de qual está selecionado (hoje é fundo `--accent-dark`) — só adaptar ao tamanho novo.

## 2. Logo real na Splash (substitui o placeholder)

Arquivos da logo já estão no projeto, em `public/logo/`:
- `public/logo/LogoTairu.svg` (sem tagline, 242×203)
- `public/logo/LogoTairu_Tagline.svg` (com tagline, 243×246)

Ficam em `public/` de propósito — são servidos por URL direta, pra poder ser substituídos (trocar o arquivo) sem mexer em código, se a Adriana mandar uma versão nova depois.

Em `src/screens/Splash.tsx`:
- Remover o comentário `// TODO: substituir por logo oficial` e o wordmark de texto (`<h1 className={styles.wordmark}>tairu</h1>` + o `<span className={styles.sparkle}>✦</span>`).
- Usar `public/logo/LogoTairu.svg` (a versão **sem** tagline) como `<img src="/logo/LogoTairu.svg" alt="Tairu" />` (ou via `import.meta.env.BASE_URL + 'logo/LogoTairu.svg'` se o projeto usar `base` diferente de `/` no `vite.config.ts` — conferir antes).
- A logo é monocromática, preenchida em `#110F0D` (quase preto) — **sem cor de destaque**. Só fica legível sobre fundo claro. Posicionar sobre a parte clara do gradiente de fundo (topo) ou sobre um bloco de fundo claro sólido — nunca direto sobre a parte escura de baixo do gradiente sem um fundo de apoio.
- Manter a tagline em texto (`<p className={styles.tagline}>...</p>`) como está — é conteúdo diferente da logo com tagline em SVG, pode continuar em texto normal.
- Não recolorir o SVG.

## Checklist antes de considerar pronto
- Rodar `npm run build` limpo.
- Testar em 375px e 390px de largura.
- Conferir que a área de toque do switcher continua ≥44×44px mesmo menor visualmente.
- Conferir contraste da logo sobre o fundo onde ela foi posicionada.
