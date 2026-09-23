# Ajuste 33 — Switcher sem círculo, na mesma linha da logo/perfil na Início

Feedback da Adriana (15/set/2026), vendo o `ajustes-32` construído: "ficou péssimo. Não precisa ter o círculo em volta. Só o ícone e a setinha para baixo de select da outro sistema. Logo e o menu de perfil pode ficar tudo na mesma linha."

Duas mudanças, uma visual e uma estrutural:

1. **Visual**: tira o círculo/fundo/borda do botão — vira só o ícone da plataforma atual + uma setinha pra baixo (mesmo desenho de seta que o `CurrencySelect` já usa — reaproveitando, não inventando um novo), sugerindo "isso é um seletor" sem precisar de moldura nenhuma.
2. **Estrutural**: o motivo do switcher aparecer como uma faixa separada, flutuando por cima da tela (em vez de "na mesma linha" da logo/perfil), é que ele é `position: fixed`, renderizado uma vez só lá no `App.tsx`, sempre por cima de tudo — nunca fez parte do fluxo normal do layout de nenhuma tela. **Isso muda só na Início**: o switcher passa a ser renderizado dentro do próprio `<header>` dela, no fluxo normal, lado a lado com a logo e o ícone de perfil. Nas outras telas (`AppBar`) e na Splash, continua como estava — fixo no canto, só com o visual novo (sem círculo).

Isso também **substitui a correção do `docs/ajustes-31-perfil-colidindo-com-switcher.md`** — o `padding-top` extra que reservava espaço pro switcher fixo na Início deixa de ser necessário, porque ele não fica mais fixo ali, então não tem mais como colidir.

## 1. `PlatformSwitcher` ganha uma prop `inline` e perde o círculo

**`src/components/shell/PlatformSwitcher.tsx`** — substituir todo o conteúdo:

```tsx
import type { ReactElement } from 'react';
import { usePlatform, type Platform } from '../../context/PlatformContext';
import { AppleIcon, AndroidIcon } from './PlatformIcons';
import styles from './PlatformSwitcher.module.css';

const ICONS: Record<Platform, () => ReactElement> = {
  ios: AppleIcon,
  android: AndroidIcon,
};

const OTHER: Record<Platform, Platform> = {
  ios: 'android',
  android: 'ios',
};

const LABELS: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
};

interface PlatformSwitcherProps {
  /**
   * Quando true, renderiza só o botão, sem o wrapper fixo — pra telas que
   * já encaixam o switcher dentro do próprio cabeçalho (ver Início).
   */
  inline?: boolean;
}

function ToggleButton() {
  const { platform, setPlatform } = usePlatform();
  const Icon = ICONS[platform];
  const next = OTHER[platform];

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setPlatform(next)}
      aria-label={`Trocar para ${LABELS[next]} (atual: ${LABELS[platform]})`}
    >
      <Icon />
      <svg className={styles.chevron} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path
          d="M1 1L5 5L9 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Seletor de plataforma, sempre visível durante o teste de usabilidade
 * (ver CLAUDE.md — "visível durante o teste"). Só o ícone da plataforma
 * ATUAL + uma setinha pra baixo (mesmo desenho do chevron do
 * `CurrencySelect`) — sem círculo, fundo ou borda. Cada toque já troca
 * pra outra plataforma, sem abrir nada. Alvo de toque continua >= 44x44px
 * via padding, mesmo com a pintura visual pequena (ver docs/ajustes-32 e
 * docs/ajustes-33-switcher-inline-no-header.md).
 *
 * Por padrão fica fixo no canto superior direito de toda tela (`inline`
 * ausente) — é assim que Splash e as telas com `AppBar` continuam
 * mostrando ele. A Início usa `inline`, encaixando o botão dentro do
 * próprio `<header>`, lado a lado com a logo e o ícone de perfil.
 */
export function PlatformSwitcher({ inline = false }: PlatformSwitcherProps) {
  if (inline) return <ToggleButton />;
  return (
    <div className={styles.wrapper}>
      <ToggleButton />
    </div>
  );
}
```

**`src/components/shell/PlatformSwitcher.module.css`** — substituir todo o conteúdo:

```css
.wrapper {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  right: var(--space-2);
  z-index: 1000;
  margin-top: var(--space-2);
}

/*
  Sem círculo/fundo/borda (pedido explícito da Adriana) — só o ícone + a
  setinha, como a pista visual de um <select>. O alvo de toque continua
  >= 44x44px via min-width/min-height + padding, mesmo com a pintura
  visual (ícone 16px + seta 10px) bem menor que isso.
*/
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding: var(--space-2);
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.toggle:active {
  opacity: 0.6;
}

.chevron {
  color: var(--muted);
}
```

## 2. Início: switcher entra no `<header>`, na mesma linha da logo e do perfil

**`src/screens/Home.tsx`** — importar `PlatformSwitcher` e agrupar switcher + perfil num wrapper à direita da logo:

```tsx
import { PlatformSwitcher } from '../components/shell/PlatformSwitcher';
// ...demais imports que já existem...

// dentro de Home():
<header className={styles.header}>
  <img src="/logo/LogoTairu.svg" alt="Tairu" className={styles.logoMark} />
  <div className={styles.headerActions}>
    <PlatformSwitcher inline />
    <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
      <span aria-hidden="true">👤</span>
    </button>
  </div>
</header>
```

**`src/screens/Home.module.css`** — adicionar:

```css
.headerActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

E **reverter** o `padding-top` que o `ajustes-31` tinha adicionado em `.screen` — volta a ser só:

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  background-color: #ffffff;
}
```

(Sem `padding-top` especial — não tem mais switcher fixo pra reservar espaço.)

## 3. Início para de renderizar o switcher fixo global

**`src/App.tsx`** — o switcher fixo continua existindo pras outras telas, só não deve aparecer duas vezes na Início (a fixa + a inline dentro do header dela). Trocar:

```tsx
<HashRouter>
  <PlatformSwitcher />
  <Routes>
    {/* ... */}
  </Routes>
</HashRouter>
```

por um componente pequeno que esconde a versão fixa só na rota `/inicio`:

```tsx
function GlobalPlatformSwitcher() {
  const location = useLocation();
  if (location.pathname === '/inicio') return null;
  return <PlatformSwitcher />;
}
```

(precisa importar `useLocation` de `react-router-dom` junto dos outros imports do router) e usar:

```tsx
<HashRouter>
  <GlobalPlatformSwitcher />
  <Routes>
    {/* ... */}
  </Routes>
</HashRouter>
```

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Switcher sem círculo/fundo/borda em NENHUM lugar (nem fixo, nem inline) — só ícone + setinha.
- Na Início: logo, switcher e ícone de perfil aparecem todos na mesma linha, sem nenhum switcher flutuando acima.
- Nas outras telas (Destinos, Central, Convidados, Roteiro, Custos, Documentos) e na Splash: switcher continua visível, fixo no canto, só com o visual novo.
- Trocar de plataforma continua funcionando (toque único alterna) em todos os lugares, inclusive na Início.
- Testar em 375px e 390px, nas duas plataformas.
