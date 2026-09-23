# Ajuste 31 — Ícone de perfil da Início colidindo com o switcher iOS/Android

Feedback da Adriana (15/set/2026), a partir de um print: "embaixo do switch tem uma parte de um arco, é algum elemento embaixo do switch".

## Causa

Não é um elemento novo nem um bug de renderização — são dois elementos legítimos ocupando o mesmo canto:

- `PlatformSwitcher` (`src/components/shell/PlatformSwitcher.tsx`) é `position: fixed`, `top: env(safe-area-inset-top, 0px)`, `right: var(--space-2)`, `z-index: 1000` — fica por cima de **toda** tela do protótipo, sempre no canto superior direito.
- O cabeçalho da tela Início (`src/screens/Home.tsx`, do `ajustes-28`) também põe um elemento redondo no canto superior direito: o botão de perfil desabilitado (`.profileButton`, 44px, `border-radius: 999px`).

Como a Início não usa `ScreenShell`/`AppBar` (decisão do `ajustes-28`, pra ter "cara própria"), ela não herda o espaçamento que already mantém as outras telas longe desse canto — nas telas com `AppBar`, o botão de voltar fica à esquerda e não há nada redondo à direita, então o switcher nunca colide. Só a Início tem esse conflito, porque foi a única tela em que pedi um ícone especificamente no canto superior direito.

O switcher (`z-index: 1000`) fica por cima do botão de perfil; a borda arredondada do botão, que não cabe embaixo do switcher, aparece como esse "arco".

## Correção

Reservar espaço no topo da tela Início pra ela nunca desenhar conteúdo embaixo do switcher, independente de plataforma/tamanho de tela.

**`src/screens/Home.module.css`** — trocar o `padding` de `.screen`:

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  padding-top: calc(env(safe-area-inset-top, 0px) + 76px);
  background-color: #ffffff;
}
```

(76px = altura aproximada do switcher a partir do topo — botão de 44px + padding interno do grupo + a margem de 8px que ele já tem — mais uma folga de respiro. Só o `padding-top` muda; os outros três lados continuam em `var(--space-6)`.)

Não precisa mexer no `.header`/`.profileButton` em si — eles continuam do jeito que estão, só passam a começar mais abaixo na tela, com folga do switcher.

## Checklist antes de considerar pronto

- Na Início, em nenhuma das duas plataformas (iOS/Android) o switcher encosta ou sobrepõe o botão de perfil — deve sobrar uma faixa de fundo branco visível entre os dois.
- Testar em 375px e 390px de largura.
- Conferir que nenhuma outra tela (`AppBar`) tem esse mesmo problema — elas usam `ScreenShell`, onde o botão de voltar fica à esquerda, então não deveria haver conflito, mas vale um olhar rápido em Destinos/Central/Convidados/Roteiro/Custos pra confirmar.
