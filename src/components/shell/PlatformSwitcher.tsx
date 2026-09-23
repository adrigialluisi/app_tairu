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
