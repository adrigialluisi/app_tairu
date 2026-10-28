import { useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { usePlatform, type Platform } from '../../context/PlatformContext';
import { useTrip } from '../../context/TripContext';
import { useDocuments } from '../../context/DocumentsContext';
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

/** toque longo que abre o menu do moderador (ajustes-89) */
const LONG_PRESS_MS = 800;

interface PlatformSwitcherProps {
  /**
   * Quando true, renderiza só o botão, sem o wrapper fixo — pra telas que
   * já encaixam o switcher dentro do próprio cabeçalho (ver Início).
   */
  inline?: boolean;
}

const menuItemClass =
  'flex min-h-11 w-full cursor-pointer items-center rounded-md border-0 bg-transparent px-3 text-left text-(length:--text-base) text-foreground hover:bg-muted disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent';

function ToggleButton() {
  const { platform, setPlatform } = usePlatform();
  const trip = useTrip();
  const docs = useDocuments();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // o toque longo também solta um click no fim: ele não pode trocar a plataforma
  const longPressed = useRef(false);
  const Icon = ICONS[platform];
  const next = OTHER[platform];

  function cancelPress() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function startPress() {
    longPressed.current = false;
    cancelPress();
    timer.current = setTimeout(() => {
      longPressed.current = true;
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  }

  const duringHint = trip.destinations.some((d) => d.dateStart && d.dateEnd)
    ? null
    : 'Cadastre os destinos e as datas primeiro';
  // sem depender do convite (ajustes-100): quem do cenário faltar é convidado na hora
  const simulateHint = trip.groupUpdateSimulated ? 'Já simulado. Recomece o teste pra simular de novo.' : duringHint;

  function simulateDuringTrip() {
    const result = trip.simulateDuringTrip();
    setMenuOpen(false);
    if (result.ok) navigate('/inicio');
  }

  function simulate() {
    const result = trip.simulateGroupUpdate();
    setMenuOpen(false);
    // simula "abrir o app de novo": a Início mostra o banner e as novidades
    if (result.ok) navigate('/inicio');
  }

  function restart() {
    setMenuOpen(false);
    trip.resetTrip();
    docs.clearDocuments();
    navigate('/');
  }

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverAnchor asChild>
        <button
          type="button"
          className={styles.toggle}
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          // no celular o toque longo abriria o menu do sistema
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            if (longPressed.current) {
              longPressed.current = false;
              return;
            }
            setPlatform(next);
          }}
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
      </PopoverAnchor>
      <PopoverContent align="end" collisionPadding={16} className="w-64 gap-1 rounded-xl p-2" aria-label="Moderador">
        <p className="m-0 px-3 pt-1 pb-1 text-(length:--text-sm) font-semibold text-muted-foreground">Moderador</p>
        <button type="button" className={menuItemClass} disabled={simulateHint !== null} onClick={simulate}>
          Simular: uma semana antes da viagem
        </button>
        <button type="button" className={menuItemClass} disabled={duringHint !== null} onClick={simulateDuringTrip}>
          Simular: durante a viagem
        </button>
        <button type="button" className={menuItemClass} onClick={restart}>
          Recomeçar teste
        </button>
      </PopoverContent>
    </Popover>
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
 * Toque longo (~800 ms, ajustes-89) abre o menu escondido do moderador, um atalho por parte do
 * teste (ajustes-94): "Simular: uma semana antes da viagem" (os convidados do cenário entram e
 * trazem as novidades), "Simular: durante a viagem" (o app vai pra 15/11/2026, com a viagem
 * acontecendo) e "Recomeçar teste" (zera a viagem, a data simulada e os documentos e volta pra Splash). O toque curto continua só alternando iOS/Android.
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
