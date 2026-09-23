# Ajuste 32 — Switcher iOS/Android mais sutil (botão único, toque troca direto)

Feedback da Adriana (15/set/2026): "vamos deixar esse switch mais sutil. ele pode ser um select bem pequeno no canto superior direito que clica e troca. Assim ele está ocupando mto espaço no header."

**Decisão de interação (via pergunta direta antes de escrever esta spec):** não é um dropdown que abre opções — é um botão único que já alterna pra outra plataforma a cada toque, sem abrir nada.

## O que muda

Hoje `PlatformSwitcher` é um par de botões lado a lado (`role="radiogroup"` com dois `role="radio"`, um pra iOS e um pra Android) dentro de uma pílula — ocupa a largura de dois alvos de toque de 44px lado a lado. Vira um **botão único**: mostra o ícone da plataforma **atual**; cada toque já troca pra outra. Larguras aproximadas de layout: de ~96px pra ~48px.

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

/**
 * Seletor de plataforma, sempre visível durante o teste de usabilidade
 * (ver CLAUDE.md — "visível durante o teste"). Fica fixo no topo em toda
 * tela do protótipo, trocando só a casca de navegação (nunca o conteúdo).
 *
 * Botão único e compacto (não mais um par de botões lado a lado — ver
 * docs/ajustes-32-switcher-compacto.md): mostra o ícone da plataforma
 * ATUAL; cada toque já troca pra outra, sem abrir nada. Alvo de toque
 * continua >= 44x44px (padding invisível ao redor do ícone visual de
 * 16px) — só o espaço ocupado no layout que fica bem menor.
 */
export function PlatformSwitcher() {
  const { platform, setPlatform } = usePlatform();
  const Icon = ICONS[platform];
  const next = OTHER[platform];

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setPlatform(next)}
        aria-label={`Trocar para ${LABELS[next]} (atual: ${LABELS[platform]})`}
      >
        <Icon />
      </button>
    </div>
  );
}
```

**`src/components/shell/PlatformSwitcher.module.css`** — substituir todo o conteúdo (`.wrapper` mantém a mesma posição/z-index de antes; `.group`/`.option`/`.optionSelected` saem, entra `.toggle`):

```css
.wrapper {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  right: var(--space-2);
  z-index: 1000;
  margin-top: var(--space-2);
}

.toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  padding: 0;
  border: 1.5px solid var(--field-border);
  border-radius: 50%;
  background: var(--card);
  color: var(--text);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.toggle:active {
  background: var(--accent-dark);
  color: var(--text-on-dark);
}
```

## Compatibilidade com o `ajustes-31` (colisão com o ícone de perfil da Início)

Esse ajuste não muda a posição do `.wrapper` (mesmo `top`/`right`/`margin-top` de antes) nem a altura do alvo de toque (continua 44px) — só a **largura** encolhe. A colisão vertical com o ícone de perfil da Início, corrigida no `docs/ajustes-31-perfil-colidindo-com-switcher.md` (`padding-top: calc(env(safe-area-inset-top, 0px) + 76px)` em `Home.module.css`), continua necessária do jeito que está — não precisa recalcular esse valor.

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- O switcher aparece como um único botão redondo no canto superior direito, mostrando o ícone da plataforma atual.
- Tocar nele troca a plataforma imediatamente (sem abrir menu/dropdown) — testar os dois sentidos (iOS→Android e Android→iOS).
- Alvo de toque continua >= 44x44px mesmo com o ícone visual pequeno (herdado de `var(--touch-target)`, sem mudança nesse valor).
- `aria-label` muda junto com o estado (ex.: quando está em iOS, anuncia "Trocar para Android (atual: iOS)").
- Testar nas duas plataformas e em 375px/390px — confirmar que não volta a colidir com o ícone de perfil da Início (herda a correção do `ajustes-31`, sem precisar de ajuste novo ali).
